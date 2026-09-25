<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CloserController;
use App\Http\Controllers\Api\FinanceSyncController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PerformanceController;
use App\Http\Controllers\Api\SalesDashboardController;
use App\Http\Controllers\Api\StudentEnrollmentController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('user', [AuthController::class, 'user']);
    Route::post('logout', [AuthController::class, 'logout']);

    Route::apiResource('closers', CloserController::class);
    Route::apiResource('leads', LeadController::class);
    Route::apiResource('students', StudentEnrollmentController::class);
    Route::apiResource('payments', PaymentController::class)->except(['update', 'destroy']);
    Route::post('payments/{payment}/verify', [PaymentController::class, 'verify']);
    Route::post('finance-sync', FinanceSyncController::class);
    Route::get('sales-dashboard', SalesDashboardController::class);

    Route::get('performance', [PerformanceController::class, 'index']);
    Route::get('sync-events', [PerformanceController::class, 'syncEvents']);
    Route::get('audit-logs', [PerformanceController::class, 'auditLogs']);
});
