<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Closer;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\StudentEnrollment;
use App\Models\SyncEvent;
use App\Models\VerificationAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SalesDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return DB::transaction(function (): JsonResponse {
            $payments = Payment::orderByDesc('created_at_source')->get();

            return response()->json([
                'closers' => Closer::orderBy('name')->get(),
                'leads' => Lead::orderByDesc('last_activity_at')->get(),
                'students' => StudentEnrollment::orderByDesc('enrolled_at')->get(),
                'payments' => $payments,
                'syncEvents' => SyncEvent::orderByDesc('occurred_at')->limit(100)->get(),
                'auditLogs' => VerificationAuditLog::orderByDesc('occurred_at')->limit(200)->get(),
                'integrity' => [
                    'financeRecords' => $payments->whereNotNull('finance_transaction_id')->count(),
                    'orphanedStudents' => Payment::whereDoesntHave('student')->count(),
                    'orphanedClosers' => Payment::whereDoesntHave('closer')->count(),
                ],
                'fetchedAt' => now()->toIso8601String(),
            ]);
        }, 3);
    }
}
