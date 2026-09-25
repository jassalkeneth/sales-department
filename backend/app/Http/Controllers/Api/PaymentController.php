<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
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
        $request->validate([
            'action' => 'required|in:verified,rejected,refunded',
            'notes' => 'nullable|string',
        ]);

        return response()->json([
            'message' => 'Verification is controlled by Finance. Update the transaction in Finance, then sync this dashboard.',
        ], 422);
    }
}
