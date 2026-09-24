<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\StudentEnrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StudentEnrollmentController extends Controller
{
    public function index(Request $request)
    {
        $q = StudentEnrollment::query();
        if ($request->filled('closer_id') && $request->closer_id !== 'all') {
            $q->where('assigned_closer_id', $request->closer_id);
        }
        if ($request->filled('program') && $request->program !== 'all') {
            $q->where('program', $request->program);
        }

        return $q->orderByDesc('enrolled_at')->get();
    }

    public function show(StudentEnrollment $student)
    {
        return $student->load('payments');
    }

    // Close-a-lead flow: convert a Lead into a StudentEnrollment.
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lead_id' => 'nullable|exists:leads,id',
            'full_name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string',
            'program' => 'required|string',
            'tier' => 'required|in:Standard,Premium,Elite Cohort',
            'assigned_closer_id' => 'required|exists:closers,id',
            'total_contract_value' => 'required|integer|min:0',
            'payment_plan' => 'required|string',
            'initial_payment' => ['sometimes', 'array'],
            'initial_payment.transaction_ref' => ['required_with:initial_payment', 'string', 'unique:payments,transaction_ref'],
            'initial_payment.amount' => ['required_with:initial_payment', 'integer', 'min:1'],
            'initial_payment.payment_type' => ['required_with:initial_payment', 'string'],
            'initial_payment.installment_number' => ['required_with:initial_payment', 'integer', 'min:1'],
            'initial_payment.total_installments' => ['required_with:initial_payment', 'integer', 'min:1'],
            'initial_payment.finance_notes' => ['nullable', 'string'],
        ]);

        $result = DB::transaction(function () use ($data): array {
            $initialPayment = $data['initial_payment'] ?? null;
            unset($data['initial_payment']);

            $data['id'] = 'stu-'.Str::lower(Str::random(8));
            $data['enrolled_at'] = now();
            $data['finance_status'] = 'pending_payment';
            $student = StudentEnrollment::create($data);

            if (! empty($data['lead_id'])) {
                Lead::whereKey($data['lead_id'])->update([
                    'stage' => 'enrolled',
                    'enrollment_id' => $student->id,
                    'last_activity_at' => now(),
                ]);
            }

            $payment = null;
            if ($initialPayment !== null) {
                $closer = $student->closer()->firstOrFail();
                $payment = Payment::create([
                    ...$initialPayment,
                    'id' => 'pay-'.Str::lower(Str::random(8)),
                    'student_id' => $student->id,
                    'student_name' => $student->full_name,
                    'closer_id' => $student->assigned_closer_id,
                    'closer_name' => $closer->name,
                    'program' => $student->program,
                    'status' => 'pending',
                    'created_at_source' => now(),
                ]);
            }

            return ['student' => $student, 'payment' => $payment];
        });

        return response()->json($result, 201);
    }

    public function update(Request $request, StudentEnrollment $student)
    {
        $data = $request->validate([
            'tier' => 'sometimes|in:Standard,Premium,Elite Cohort',
            'total_contract_value' => 'sometimes|integer|min:0',
            'payment_plan' => 'sometimes|string',
            'finance_status' => 'sometimes|in:pending_payment,partially_collected,fully_collected',
        ]);
        $student->update($data);

        return $student;
    }

    public function destroy(StudentEnrollment $student)
    {
        $student->delete();

        return response()->noContent();
    }
}
