<?php

namespace App\Http\Controllers;

use App\Models\TargetTable;
use Illuminate\Http\Request;

class TargetTableController extends Controller
{
    public function index()
    {
        return TargetTable::all();
    }
}
