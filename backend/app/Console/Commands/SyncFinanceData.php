<?php

namespace App\Console\Commands;

use App\Services\FinanceSyncWorkflow;
use Illuminate\Console\Command;

class SyncFinanceData extends Command
{
    protected $signature = 'sales:sync-finance';

    protected $description = 'Synchronize authoritative Central Finance records into the Sales database';

    public function handle(FinanceSyncWorkflow $workflow): int
    {
        $result = $workflow->run();

        if (($result['state'] ?? null) === 'syncing') {
            $this->line('A Finance synchronization is already running.');

            return self::SUCCESS;
        }

        if (($result['changed'] ?? true) === false) {
            $this->line('Finance data is already current.');

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Finance sync complete: %d imported, %d verified, %d pending.',
            $result['importedRecords'] ?? 0,
            $result['verifiedRecords'] ?? 0,
            $result['pendingRecords'] ?? 0,
        ));

        return self::SUCCESS;
    }
}
