<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\StudentEnrollment;
use App\Models\SyncEvent;
use App\Models\VerificationAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $q = Payment::query();
        foreach (['closer_id', 'status', 'payment_type', 'program'] as $f) {
            if ($request->filled($f) && $request->$f !== 'all') {
                $q->where($f, $request->$f);
            }
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $q->where(fn ($x) => $x->where('transaction_ref', 'like', "%$s%")->orWhere('student_name', 'like', "%$s%"));
        }

        return $q->orderByDesc('created_at_source')->get();
    }

    public function show(Payment $payment)
    {
        return $payment;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'transaction_ref' => 'required|string|unique:payments,transaction_ref',
            'student_id' => 'required|exists:student_enrollments,id',
            'amount' => 'required|integer|min:1',
            'payment_type' => 'required|string',
            'installment_number' => 'required|integer|min:1',
            'total_installments' => 'required|integer|min:1',
            'finance_notes' => 'nullable|string',
        ]);

        $student = StudentEnrollment::findOrFail($data['student_id']);
        $data['id'] = 'pay-'.Str::lower(Str::random(8));
        $data['student_name'] = $student->full_name;
        $data['closer_id'] = $student->assigned_closer_id;
        $data['closer_name'] = optional($student->closer)->name ?? '';
        $data['program'] = $student->program;
        $data['status'] = 'pending';
        $data['created_at_source'] = now();

        return Payment::create($data);
    }

    public function verify(Request $request, Payment $payment)
    {
        $data = $request->validate([
            'action' => 'required|in:verified,rejected,refunded',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($payment, $data, $request) {
            $payment = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $previous = $payment->status;
            $officerName = optional($request->user())->name ?? 'System';

            $payment->update([
                'status' => $data['action'],
                'verified_at' => now(),
                'verified_by' => $officerName,
                'finance_notes' => $data['notes'] ?? $payment->finance_notes,
            ]);

            VerificationAuditLog::create([
                'id' => 'audit-'.Str::lower(Str::random(8)),
                'payment_id' => $payment->id,
                'transaction_ref' => $payment->transaction_ref,
                'previous_status' => $previous,
                'new_status' => $data['action'],
                'officer_name' => $officerName,
                'occurred_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]);

            if ($data['action'] === 'verified') {
                SyncEvent::create([
                    'id' => 'sync-'.Str::lower(Str::random(8)),
                    'occurred_at' => now(),
                    'payment_id' => $payment->id,
                    'transaction_ref' => $payment->transaction_ref,
                    'closer_name' => $payment->closer_name,
                    'student_name' => $payment->student_name,
                    'amount' => $payment->amount,
                    'program' => $payment->program,
                    'status' => 'SYNCED',
                    'verification_latency_ms' => random_int(80, 220),
                    'details' => "Attribution verified. Added \${$payment->amount} to {$payment->closer_name} collection ledger.",
                ]);

                $student = StudentEnrollment::find($payment->student_id);
                if ($student?->lead_id) {
                    Lead::whereKey($student->lead_id)->update([
                        'stage' => 'closed_won',
                        'last_activity_at' => now(),
                    ]);
                }
            }

            $this->recomputeStudentFinanceStatus($payment->student_id);

            return $payment->fresh();
        });
    }

    private function recomputeStudentFinanceStatus(string $studentId): void
    {
        $student = StudentEnrollment::find($studentId);
        if (! $student) {
            return;
        }
        $verified = Payment::where('student_id', $studentId)->where('status', 'verified')->sum('amount');
        $status = 'pending_payment';
        if ($verified > 0 && $verified < $student->total_contract_value) {
            $status = 'partially_collected';
        } elseif ($verified >= $student->total_contract_value) {
            $status = 'fully_collected';
        }
        $student->update(['finance_status' => $status]);
    }
}
