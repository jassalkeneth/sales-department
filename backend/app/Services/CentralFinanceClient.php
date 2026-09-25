<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class CentralFinanceClient
{
    private function client(): PendingRequest
    {
        $apiKey = (string) config('services.tmt_finance.api_key');

        if ($apiKey === '') {
            throw new RuntimeException('Finance data source is not configured.');
        }

        return Http::baseUrl(rtrim((string) config('services.tmt_finance.base_url'), '/'))
            ->acceptJson()
            ->withHeader('X-API-Key', $apiKey)
            ->timeout((int) config('services.tmt_finance.timeout', 30))
            ->retry(2, 200);
    }

    /** @return array<int, array<string, mixed>> */
    public function transactions(): array
    {
        $transactions = [];
        $page = 1;

        do {
            $response = $this->client()->get('/api/transactions', [
                'page' => $page,
                'limit' => 500,
                'sort' => 'id',
            ])->throw()->json();

            $transactions = array_merge($transactions, $response['data'] ?? []);
            $totalPages = (int) ($response['pagination']['totalPages'] ?? 1);
            $page++;
        } while ($page <= $totalPages);

        return $transactions;
    }

    public function latestChangeId(): int
    {
        $response = $this->client()->get('/api/changes', [
            'after_id' => 0,
            'limit' => 1,
        ])->throw()->json();

        return (int) ($response['cursor']['latest_id'] ?? 0);
    }
}
