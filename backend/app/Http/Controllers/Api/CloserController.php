<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Closer;
use Illuminate\Http\Request;

class CloserController extends Controller
{
    public function index()
    {
        return Closer::orderBy('name')->get();
    }

    public function show(Closer $closer)
    {
        return $closer;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => 'required|string|unique:closers,id',
            'name' => 'required|string',
            'email' => 'required|email|unique:closers,email',
            'title' => 'required|string',
            'avatar_url' => 'nullable|string',
            'monthly_target' => 'required|integer|min:0',
            'collection_target' => 'required|integer|min:0',
            'effective_period' => 'required|string',
            'base_commission_pct' => 'required|numeric|min:0',
            'accelerator_pct' => 'required|numeric|min:0',
        ]);

        return Closer::create($data);
    }

    public function update(Request $request, Closer $closer)
    {
        $data = $request->validate([
            'name' => 'sometimes|string',
            'title' => 'sometimes|string',
            'avatar_url' => 'sometimes|nullable|string',
            'monthly_target' => 'sometimes|integer|min:0',
            'collection_target' => 'sometimes|integer|min:0',
            'effective_period' => 'sometimes|string',
            'base_commission_pct' => 'sometimes|numeric|min:0',
            'accelerator_pct' => 'sometimes|numeric|min:0',
        ]);

        $closer->update($data);

        return $closer;
    }

    public function destroy(Closer $closer)
    {
        $closer->delete();

        return response()->noContent();
    }
}
