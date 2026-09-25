<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FinanceSyncWorkflow;
use Illuminate\Http\JsonResponse;

class FinanceSyncController extends Controller
{
    public function sync(FinanceSyncWorkflow $workflow): JsonResponse
    {
        return response()->json($workflow->run());
    }

    public function status(FinanceSyncWorkflow $workflow): JsonResponse
    {
        return response()->json($workflow->status());
    }
}
