<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $q = Lead::query();
        if ($request->filled('closer_id') && $request->closer_id !== 'all') {
            $q->where('assigned_closer_id', $request->closer_id);
        }
        if ($request->filled('stage')) {
            $q->where('stage', $request->stage);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $q->where(fn ($x) => $x->where('full_name', 'like', "%$s%")->orWhere('email', 'like', "%$s%"));
        }

        return $q->orderByDesc('last_activity_at')->get();
    }

    public function show(Lead $lead)
    {
        return $lead;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'full_name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'required|string',
            'target_program' => 'required|string',
            'assigned_closer_id' => 'required|exists:closers,id',
            'stage' => 'required|in:new_lead,contacted,demo_call,negotiation,enrolled,closed_won,lost',
            'estimated_deal_value' => 'required|integer|min:0',
            'source' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $data['id'] = 'lead-'.Str::lower(Str::random(8));
        $data['created_at_source'] = now();
        $data['last_activity_at'] = now();

        return Lead::create($data);
    }

    public function update(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'full_name' => 'sometimes|string',
            'email' => 'sometimes|email',
            'phone' => 'sometimes|string',
            'target_program' => 'sometimes|string',
            'assigned_closer_id' => 'sometimes|exists:closers,id',
            'stage' => 'sometimes|in:new_lead,contacted,demo_call,negotiation,enrolled,closed_won,lost',
            'estimated_deal_value' => 'sometimes|integer|min:0',
            'source' => 'sometimes|string',
            'notes' => 'sometimes|nullable|string',
        ]);
        $data['last_activity_at'] = now();
        $lead->update($data);

        return $lead;
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();

        return response()->noContent();
    }
}
