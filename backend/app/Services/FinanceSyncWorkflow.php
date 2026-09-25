<?php

namespace App\Services;

use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Throwable;

class FinanceSyncWorkflow
{
    private const LOCK_KEY = 'sales.finance-sync.lock';

    private const STATUS_KEY = 'sales.finance-sync.status';

    public function __construct(
        private readonly FinanceDataSyncService $sync,
        private readonly CentralFinanceClient $client,
    ) {}

    /** @return array<string, mixed> */
    public function run(): array
    {
        $lock = Cache::lock(self::LOCK_KEY, 55);

        try {
            return $lock->block(1, function (): array {
                $previous = $this->status();
                Cache::forever(self::STATUS_KEY, [
                    ...$previous,
                    'state' => 'syncing',
                    'startedAt' => now()->toIso8601String(),
                    'error' => null,
                ]);

                try {
                    $latestChangeId = $this->client->latestChangeId();
                    if (($previous['state'] ?? null) === 'ready'
                        && $latestChangeId > 0
                        && $latestChangeId === (int) ($previous['centralCursor'] ?? 0)) {
                        $unchanged = [
                            ...$previous,
                            'state' => 'ready',
                            'changed' => false,
                            'checkedAt' => now()->toIso8601String(),
                            'error' => null,
                        ];
                        Cache::forever(self::STATUS_KEY, $unchanged);

                        return $unchanged;
                    }

                    $result = [
                        ...$this->sync->sync(),
                        'state' => 'ready',
                        'changed' => true,
                        'centralCursor' => $latestChangeId,
                        'checkedAt' => now()->toIso8601String(),
                        'error' => null,
                    ];
                    Cache::forever(self::STATUS_KEY, $result);

                    return $result;
                } catch (Throwable $exception) {
                    Cache::forever(self::STATUS_KEY, [
                        ...$previous,
                        'state' => 'failed',
                        'error' => 'Finance synchronization failed.',
                        'failedAt' => now()->toIso8601String(),
                    ]);

                    throw $exception;
                }
            });
        } catch (LockTimeoutException) {
            return [
                ...$this->status(),
                'state' => 'syncing',
            ];
        }
    }

    /** @return array<string, mixed> */
    public function status(): array
    {
        return Cache::get(self::STATUS_KEY, [
            'state' => 'waiting',
            'changed' => false,
            'source' => 'TMT Central / Finance',
            'sourceRecords' => 0,
            'importedRecords' => 0,
            'verifiedRecords' => 0,
            'pendingRecords' => 0,
            'skipped' => [],
            'attribution' => [
                'explicitNaRecords' => 0,
                'unassignedRecords' => 0,
                'fallbackCloserRecords' => 0,
            ],
            'sourceUpdatedAt' => null,
            'syncedAt' => null,
            'checkedAt' => null,
            'centralCursor' => 0,
            'error' => null,
        ]);
    }
}
