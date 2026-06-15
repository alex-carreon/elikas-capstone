<?php

use App\Jobs\SendFloodReminders;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new SendFloodReminders)->everyMinute();
