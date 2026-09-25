<?php

namespace App\Services;

use App\Models\Closer;
use App\Models\Payment;
use App\Models\StudentEnrollment;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FinanceDataSyncService
{
    public function __construct(private readonly CentralFinanceClient $client) {}

    /** @return array<string, mixed> */
    public function sync(): array
    {
        $sourceRows = collect($this->client->transactions());
        $skipped = [
            'events' => 0,
            'test_records' => 0,
            'nonpositive_amount' => 0,
            'missing_date' => 0,
        ];

        $rows = $sourceRows->filter(function (array $row) use (&$skipped): bool {
            if (($row['type'] ?? null) === 'event') {
                $skipped['events']++;

                return false;
            }

            $reference = (string) ($row['or_number'] ?? '');
            if (Str::startsWith($reference, ['INTTEST-', 'RCT-'])) {
                $skipped['test_records']++;

                return false;
            }

            if ((float) ($row['amount'] ?? 0) <= 0) {
                $skipped['nonpositive_amount']++;

                return false;
            }

            if (blank($row['transaction_date'] ?? null)) {
                $skipped['missing_date']++;

                return false;
            }

            return true;
        })->values();

        return DB::transaction(function () use ($rows, $sourceRows, $skipped): array {
            $now = now();
            $groups = $rows->groupBy(fn (array $row): string => $this->studentKey($row));
            $financePaymentIds = [];
            $financeStudentIds = [];

            foreach ($groups as $groupRows) {
                /** @var Collection<int, array<string, mixed>> $groupRows */
                $first = $groupRows->first();
                $closerName = $this->closerName($first);
                $closer = $this->upsertCloser($closerName, $now);
                $studentId = 'fin-stu-'.substr(sha1($this->studentKey($first)), 0, 24);
                $financeStudentIds[] = $studentId;
                $program = $this->programName($first);
                $verifiedTotal = $groupRows
                    ->where('verification_status', 'verified')
                    ->sum(fn (array $row): float => (float) $row['amount']);
                $total = $groupRows->sum(fn (array $row): float => (float) $row['amount']);
                $count = $groupRows->count();

                StudentEnrollment::updateOrCreate(
                    ['id' => $studentId],
                    [
                        'lead_id' => null,
                        'full_name' => $this->studentName($first),
                        'email' => (string) ($first['person_email'] ?? ''),
                        'phone' => (string) ($first['person_mobile'] ?? ''),
                        'program' => $program,
                        'tier' => $this->tier($first),
                        'assigned_closer_id' => $closer->id,
                        'total_contract_value' => round($total, 2),
                        'payment_plan' => $this->paymentPlan($count),
                        'enrolled_at' => Carbon::parse($groupRows->min('transaction_date')),
                        'finance_status' => $verifiedTotal <= 0
                            ? 'pending_payment'
                            : ($verifiedTotal + 0.005 >= $total ? 'fully_collected' : 'partially_collected'),
                    ],
                );

                $orderedRows = $groupRows->sortBy('transaction_date')->values();
                foreach ($orderedRows as $index => $row) {
                    $financeId = (int) $row['id'];
                    $paymentId = 'fin-pay-'.$financeId;
                    $financePaymentIds[] = $paymentId;
                    $status = ($row['verification_status'] ?? 'for_verification') === 'verified'
                        ? 'verified'
                        : 'pending';

                    Payment::updateOrCreate(
                        ['finance_transaction_id' => $financeId],
                        [
                            'id' => $paymentId,
                            'transaction_ref' => filled($row['or_number'] ?? null)
                                ? trim((string) $row['or_number'])
                                : 'CENTRAL-'.$financeId,
                            'student_id' => $studentId,
                            'student_name' => $this->studentName($row),
                            'closer_id' => $closer->id,
                            'closer_name' => $closerName,
                            'program' => $program,
                            'amount' => round((float) $row['amount'], 2),
                            'payment_type' => $this->paymentMethod($row),
                            'income_product' => $row['income_product'] ?? null,
                            'installment_number' => $index + 1,
                            'total_installments' => $count,
                            'status' => $status,
                            'finance_verification_status' => $row['verification_status'] ?? 'for_verification',
                            'created_at_source' => Carbon::parse($row['transaction_date']),
                            'verified_at' => filled($row['verified_at'] ?? null) ? Carbon::parse($row['verified_at']) : null,
                            'finance_updated_at' => filled($row['updated_at'] ?? null) ? Carbon::parse($row['updated_at']) : null,
                            'verified_by' => $row['verified_by'] ?? null,
                            'finance_notes' => $row['finance_remarks'] ?? null,
                            'is_duplicate_flag' => false,
                        ],
                    );
                }
            }

            Payment::whereNotNull('finance_transaction_id')
                ->when($financePaymentIds !== [], fn ($query) => $query->whereNotIn('id', $financePaymentIds))
                ->delete();
            StudentEnrollment::where('id', 'like', 'fin-stu-%')
                ->when($financeStudentIds !== [], fn ($query) => $query->whereNotIn('id', $financeStudentIds))
                ->delete();

            return [
                'source' => 'TMT Central / Finance',
                'sourceRecords' => $sourceRows->count(),
                'importedRecords' => $rows->count(),
                'verifiedRecords' => $rows->where('verification_status', 'verified')->count(),
                'pendingRecords' => $rows->where('verification_status', '!=', 'verified')->count(),
                'skipped' => $skipped,
                'sourceUpdatedAt' => $rows->max('updated_at'),
                'syncedAt' => $now->toIso8601String(),
            ];
        });
    }

    private function studentKey(array $row): string
    {
        return implode('|', [
            $row['person_canonical_id'] ?? 'transaction-'.$row['id'],
            Str::lower($this->programName($row)),
            Str::lower($this->closerName($row)),
        ]);
    }

    private function closerName(array $row): string
    {
        return trim((string) ($row['income_closer'] ?? $row['closer'] ?? '')) ?: 'Unassigned';
    }

    private function programName(array $row): string
    {
        return trim((string) ($row['income_program'] ?? $row['program'] ?? $row['program_code'] ?? '')) ?: 'Unspecified';
    }

    private function studentName(array $row): string
    {
        $name = trim(implode(' ', array_filter([
            $row['first_name'] ?? null,
            $row['last_name'] ?? null,
        ])));

        return $name !== '' ? $name : 'Unassigned student';
    }

    private function paymentMethod(array $row): string
    {
        return trim((string) ($row['income_mop'] ?? $row['payment_method'] ?? '')) ?: 'Unspecified';
    }

    private function tier(array $row): string
    {
        $value = Str::lower(implode(' ', [
            (string) ($row['tier_level'] ?? ''),
            $this->programName($row),
        ]));

        if (Str::contains($value, 'elite')) {
            return 'Elite Cohort';
        }

        return Str::contains($value, 'premium') ? 'Premium' : 'Standard';
    }

    private function paymentPlan(int $count): string
    {
        return match ($count) {
            1 => 'Full Upfront',
            2 => '2-Part Installment',
            3 => '3-Part Installment',
            default => 'Income Share Option',
        };
    }

    private function upsertCloser(string $name, $now): Closer
    {
        $id = 'fin-closer-'.substr(sha1($name), 0, 20);

        return Closer::firstOrCreate(
            ['id' => $id],
            [
                'name' => $name,
                'email' => null,
                'title' => 'Sales Closer',
                'avatar_url' => null,
                'monthly_target' => 0,
                'collection_target' => 0,
                'effective_period' => $now->format('F Y'),
                'base_commission_pct' => 0,
                'accelerator_pct' => 0,
            ],
        );
    }
}
