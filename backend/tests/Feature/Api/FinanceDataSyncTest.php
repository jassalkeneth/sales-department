<?php

namespace Tests\Feature\Api;

use App\Models\Closer;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FinanceDataSyncTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_it_imports_only_valid_finance_records_and_mirrors_verification(): void
    {
        config([
            'services.tmt_finance.base_url' => 'http://central.test',
            'services.tmt_finance.api_key' => 'read-only-test-key',
        ]);
        Http::fake([
            'http://central.test/api/transactions*' => Http::response([
                'data' => [
                    $this->transaction(101, 'OR-101', 1000.25, 'verified', 'New Premium'),
                    $this->transaction(102, 'OR-102', 500.50, 'for_verification', 'Premium Collection'),
                    $this->transaction(103, 'EVENT-103', 900, 'verified', null, ['type' => 'event']),
                    $this->transaction(104, 'INTTEST-104', 80000, 'verified', null),
                    $this->transaction(105, 'OR-105', 0, 'verified', null),
                    $this->transaction(106, 'OR-106', 2500, 'verified', null, ['transaction_date' => null]),
                ],
                'pagination' => ['page' => 1, 'totalPages' => 1, 'totalRows' => 6],
            ]),
        ]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/finance-sync')
            ->assertOk()
            ->assertJsonPath('sourceRecords', 6)
            ->assertJsonPath('importedRecords', 2)
            ->assertJsonPath('verifiedRecords', 1)
            ->assertJsonPath('pendingRecords', 1)
            ->assertJsonPath('skipped.events', 1)
            ->assertJsonPath('skipped.test_records', 1)
            ->assertJsonPath('skipped.nonpositive_amount', 1)
            ->assertJsonPath('skipped.missing_date', 1);

        $this->assertDatabaseCount('payments', 2);
        $this->assertDatabaseHas('payments', [
            'finance_transaction_id' => 101,
            'transaction_ref' => 'OR-101',
            'status' => 'verified',
            'finance_verification_status' => 'verified',
            'income_product' => 'New Premium',
        ]);
        $this->assertDatabaseHas('payments', [
            'finance_transaction_id' => 102,
            'status' => 'pending',
            'finance_verification_status' => 'for_verification',
        ]);
        $this->assertSame(1000.25, Payment::where('finance_transaction_id', 101)->firstOrFail()->amount);
    }

    public function test_performance_uses_finance_sales_classification_and_marginal_commission_rate(): void
    {
        config([
            'services.tmt_finance.base_url' => 'http://central.test',
            'services.tmt_finance.api_key' => 'read-only-test-key',
        ]);
        Http::fake([
            'http://central.test/api/transactions*' => Http::response([
                'data' => [
                    $this->transaction(201, 'OR-201', 1000, 'verified', 'New Premium'),
                    $this->transaction(202, 'OR-202', 500, 'verified', 'Premium Collection'),
                ],
                'pagination' => ['page' => 1, 'totalPages' => 1, 'totalRows' => 2],
            ]),
        ]);
        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/finance-sync')->assertOk();

        $closer = Closer::firstOrFail();
        $closer->update([
            'monthly_target' => 1000,
            'collection_target' => 1000,
            'base_commission_pct' => 10,
            'accelerator_pct' => 20,
        ]);

        $this->getJson('/api/performance')
            ->assertOk()
            ->assertJsonPath('0.actualSales', 1000)
            ->assertJsonPath('0.actualCollections', 1500)
            ->assertJsonPath('0.estimatedCommissions', 200);
    }

    public function test_it_distinguishes_na_unassigned_and_valid_base_closer_fallbacks(): void
    {
        config([
            'services.tmt_finance.base_url' => 'http://central.test',
            'services.tmt_finance.api_key' => 'read-only-test-key',
        ]);
        Http::fake([
            'http://central.test/api/transactions*' => Http::response([
                'data' => [
                    $this->transaction(301, 'OR-301', 1000, 'verified', 'New Premium', [
                        'income_closer' => '',
                        'closer' => 'Valid Base Closer',
                    ]),
                    $this->transaction(302, 'OR-302', 2000, 'verified', 'New Premium', [
                        'person_canonical_id' => 'person-2',
                        'income_closer' => 'N/A',
                        'closer' => null,
                    ]),
                    $this->transaction(303, 'OR-303', 3000, 'for_verification', 'New Premium', [
                        'person_canonical_id' => 'person-3',
                        'income_closer' => null,
                        'closer' => null,
                    ]),
                ],
                'pagination' => ['page' => 1, 'totalPages' => 1, 'totalRows' => 3],
            ]),
        ]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/finance-sync')
            ->assertOk()
            ->assertJsonPath('attribution.fallbackCloserRecords', 1)
            ->assertJsonPath('attribution.explicitNaRecords', 1)
            ->assertJsonPath('attribution.unassignedRecords', 1);

        $this->assertDatabaseHas('payments', [
            'finance_transaction_id' => 301,
            'closer_name' => 'Valid Base Closer',
        ]);
        $this->assertDatabaseHas('payments', [
            'finance_transaction_id' => 302,
            'closer_name' => 'N/A',
        ]);
        $this->assertDatabaseHas('payments', [
            'finance_transaction_id' => 303,
            'closer_name' => 'Unassigned',
        ]);
    }

    /** @param array<string, mixed> $overrides */
    private function transaction(int $id, string $reference, float $amount, string $verification, ?string $incomeProduct, array $overrides = []): array
    {
        return array_merge([
            'id' => $id,
            'person_canonical_id' => 'person-1',
            'first_name' => 'Accurate',
            'last_name' => 'Customer',
            'person_email' => 'customer@example.com',
            'person_mobile' => '+639000000000',
            'type' => 'premium_sale',
            'or_number' => $reference,
            'program' => 'Premium Coaching',
            'program_code' => 'premium',
            'income_program' => 'Premium',
            'income_product' => $incomeProduct,
            'amount' => $amount,
            'transaction_date' => '2026-09-20',
            'closer' => 'Finance Closer',
            'income_closer' => 'Finance Closer',
            'payment_method' => 'Bank Transfer',
            'income_mop' => 'Bank Transfer',
            'verification_status' => $verification,
            'verified_by' => $verification === 'verified' ? 'Finance Officer' : null,
            'verified_at' => $verification === 'verified' ? '2026-09-21T10:00:00Z' : null,
            'finance_remarks' => null,
            'updated_at' => '2026-09-21T10:00:00Z',
        ], $overrides);
    }
}
