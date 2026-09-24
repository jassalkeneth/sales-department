<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Closer;
use App\Models\Payment;
use App\Models\StudentEnrollment;
use App\Models\SyncEvent;
use App\Models\VerificationAuditLog;

class PerformanceController extends Controller
{
    public function index()
    {
        $closers = Closer::all();

        $rows = $closers->map(function (Closer $c) {
            $verified = Payment::where('closer_id', $c->id)->where('status', 'verified');
            $pending = Payment::where('closer_id', $c->id)->where('status', 'pending');

            $actualSales = StudentEnrollment::where('assigned_closer_id', $c->id)->sum('total_contract_value');
            $actualCollections = (int) (clone $verified)->sum('amount');
            $pendingCollections = (int) (clone $pending)->sum('amount');
            $closedDealsCount = StudentEnrollment::where('assigned_closer_id', $c->id)->count();
            $premiumStudentsCount = StudentEnrollment::where('assigned_closer_id', $c->id)
                ->whereIn('tier', ['Premium', 'Elite Cohort'])->count();

            $salesAchievementPct = $c->monthly_target > 0 ? round(($actualSales / $c->monthly_target) * 100, 2) : 0;
            $collectionAchievementPct = $c->collection_target > 0 ? round(($actualCollections / $c->collection_target) * 100, 2) : 0;
            $avgSaleValue = $closedDealsCount > 0 ? (int) round($actualSales / $closedDealsCount) : 0;

            $commissionPct = $salesAchievementPct >= 100 ? $c->accelerator_pct : $c->base_commission_pct;
            $estimatedCommissions = (int) round($actualCollections * ($commissionPct / 100));

            return [
                'closer' => $c,
                'actualSales' => (int) $actualSales,
                'actualCollections' => $actualCollections,
                'pendingCollections' => $pendingCollections,
                'salesAchievementPct' => $salesAchievementPct,
                'collectionAchievementPct' => $collectionAchievementPct,
                'remainingSalesTarget' => max(0, $c->monthly_target - $actualSales),
                'remainingCollectionTarget' => max(0, $c->collection_target - $actualCollections),
                'closedDealsCount' => $closedDealsCount,
                'avgSaleValue' => $avgSaleValue,
                'premiumStudentsCount' => $premiumStudentsCount,
                'estimatedCommissions' => $estimatedCommissions,
            ];
        })->sortByDesc('actualCollections')->values();

        return $rows->map(function ($r, $i) {
            $r['rank'] = $i + 1;

            return $r;
        });
    }

    public function syncEvents()
    {
        return SyncEvent::orderByDesc('occurred_at')->limit(100)->get();
    }

    public function auditLogs()
    {
        return VerificationAuditLog::orderByDesc('occurred_at')->limit(200)->get();
    }
}
