<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class EvacTypeController extends Controller
{
    public function index()
    {
        $evacTypes = DB::table('EvacTypes')
            ->select('id', 'evac_type')
            ->orderBy('evac_type')
            ->get();

        return response()->json($evacTypes, 200);
    }
}
