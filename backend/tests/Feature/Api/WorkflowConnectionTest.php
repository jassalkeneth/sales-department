<?php

namespace Tests\Feature\Api;

use App\Models\Closer;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkflowConnectionTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_401_when_dashboard_data_is_requested_without_authentication(): void
    {
        $this->getJson('/api/closers')->assertUnauthorized();
    }

    public function test_dashboard_data_is_available_with_authentication(): void
    {
        Sanctum::actingAs(User::factory()->create());

        foreach (['closers', 'leads', 'students', 'payments', 'performance', 'sync-events', 'audit-logs'] as $endpoint) {
            $this->getJson("/api/{$endpoint}")
                ->assertOk()
                ->assertJsonIsArray();
        }
    }

    public function test_sales_dashboard_returns_one_consistent_related_database_snapshot(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $closer = Closer::create([
            'id' => 'closer-dashboard-test',
            'name' => 'Dashboard Test Closer',
            'email' => 'dashboard-closer@example.com',
            'title' => 'Sales Closer',
            'avatar_url' => null,
            'monthly_target' => 0,
            'collection_target' => 0,
            'effective_period' => now()->format('F Y'),
            'base_commission_pct' => 0,
            'accelerator_pct' => 0,
        ]);
        $student = StudentEnrollment::create([
            'id' => 'student-dashboard-test',
            'lead_id' => null,
            'full_name' => 'Dashboard Student',
            'email' => 'dashboard-student@example.com',
            'phone' => '+639000000000',
            'program' => 'Premium',
            'tier' => 'Premium',
            'assigned_closer_id' => $closer->id,
            'total_contract_value' => 25000,
            'payment_plan' => 'Full Upfront',
            'enrolled_at' => now(),
            'finance_status' => 'fully_collected',
        ]);
        Payment::create([
            'id' => 'payment-dashboard-test',
            'finance_transaction_id' => 9001,
            'transaction_ref' => 'OR-DASHBOARD-TEST',
            'student_id' => $student->id,
            'student_name' => $student->full_name,
            'closer_id' => $closer->id,
            'closer_name' => $closer->name,
            'program' => $student->program,
            'amount' => 25000,
            'payment_type' => 'Bank Transfer',
            'income_product' => 'New Premium',
            'installment_number' => 1,
            'total_installments' => 1,
            'status' => 'verified',
            'finance_verification_status' => 'verified',
            'created_at_source' => now(),
            'verified_at' => now(),
            'finance_updated_at' => now(),
            'verified_by' => 'Finance Officer',
            'finance_notes' => null,
            'is_duplicate_flag' => false,
        ]);

        $this->getJson('/api/sales-dashboard')
            ->assertOk()
            ->assertJsonPath('closers.0.id', $closer->id)
            ->assertJsonPath('students.0.assigned_closer_id', $closer->id)
            ->assertJsonPath('payments.0.student_id', $student->id)
            ->assertJsonPath('payments.0.closer_id', $closer->id)
            ->assertJsonPath('integrity.financeRecords', 1)
            ->assertJsonPath('integrity.orphanedStudents', 0)
            ->assertJsonPath('integrity.orphanedClosers', 0);
    }

    public function test_local_payment_cannot_override_finance_verification(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $closer = Closer::create([
            'id' => 'closer-connection-test',
            'name' => 'Connection Test Closer',
            'email' => 'closer@example.com',
            'title' => 'Sales Closer',
            'avatar_url' => null,
            'monthly_target' => 10000,
            'collection_target' => 8000,
            'effective_period' => now()->format('F Y'),
            'base_commission_pct' => 10,
            'accelerator_pct' => 15,
        ]);
        $lead = Lead::create([
            'id' => 'lead-connection-test',
            'full_name' => 'Connection Test Student',
            'email' => 'student@example.com',
            'phone' => '+1 555 0100',
            'target_program' => 'Test Program',
            'assigned_closer_id' => $closer->id,
            'stage' => 'negotiation',
            'estimated_deal_value' => 9000,
            'source' => 'API Test',
            'created_at_source' => now(),
            'last_activity_at' => now(),
        ]);

        $enrollmentResponse = $this->postJson('/api/students', [
            'lead_id' => $lead->id,
            'full_name' => $lead->full_name,
            'email' => $lead->email,
            'phone' => $lead->phone,
            'program' => $lead->target_program,
            'tier' => 'Premium',
            'assigned_closer_id' => $lead->assigned_closer_id,
            'total_contract_value' => 9000,
            'payment_plan' => '2-Part Installment',
            'initial_payment' => [
                'transaction_ref' => 'CONNECTION-TEST-001',
                'amount' => 4500,
                'payment_type' => 'Wire Transfer',
                'installment_number' => 1,
                'total_installments' => 2,
                'finance_notes' => 'Created through the connected enrollment workflow.',
            ],
        ]);

        $enrollmentResponse
            ->assertCreated()
            ->assertJsonPath('student.lead_id', $lead->id)
            ->assertJsonPath('payment.transaction_ref', 'CONNECTION-TEST-001')
            ->assertJsonPath('payment.status', 'pending');

        $studentId = $enrollmentResponse->json('student.id');
        $paymentId = $enrollmentResponse->json('payment.id');

        $this->postJson("/api/payments/{$paymentId}/verify", [
            'action' => 'verified',
            'notes' => 'Bank settlement confirmed.',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Verification is controlled by Finance. Update the transaction in Finance, then sync this dashboard.');

        $this->assertDatabaseHas(Payment::class, [
            'id' => $paymentId,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas(StudentEnrollment::class, [
            'id' => $studentId,
            'finance_status' => 'pending_payment',
        ]);
        $this->assertDatabaseHas(Lead::class, [
            'id' => $lead->id,
            'stage' => 'enrolled',
            'enrollment_id' => $studentId,
        ]);
        $this->assertDatabaseMissing('verification_audit_logs', ['payment_id' => $paymentId]);
        $this->assertDatabaseMissing('sync_events', ['payment_id' => $paymentId]);
    }
}
