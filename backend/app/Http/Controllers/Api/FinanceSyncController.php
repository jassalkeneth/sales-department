<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FinanceDataSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class FinanceSyncController extends Controller
{
    public function __invoke(Request $request, FinanceDataSyncService $sync): JsonResponse
    {
        if ($request->boolean('force')) {
            Cache::forget('sales.finance-sync.result');
        }

        $result = Cache::remember(
            'sales.finance-sync.result',
            now()->addMinutes(5),
            fn (): array => $sync->sync(),
        );

        return response()->json($result);
    }
}
