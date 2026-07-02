<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flood Path Reminder</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f5f5f5;
    font-family:Arial, Helvetica, sans-serif;
">

@php
    $totalHours = max(0, floor(now()->diffInHours($floodPath->expiry, false)));
    $days = intdiv($totalHours, 24);
    $hours = $totalHours % 24;
@endphp

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="padding:30px 15px;">

<table width="600" cellpadding="0" cellspacing="0" border="0"
       style="
       background:#ffffff;
       border-radius:18px;
       overflow:hidden;
       box-shadow:0 2px 10px rgba(0,0,0,0.08);
       ">

    <!-- Header -->
    <tr>
        <td style="
            background:#F5AE3D;
            padding:35px 30px;
            color:#ffffff;
            text-align:center;
        ">
            <h1 style="
                margin:0;
                font-size:30px;
                line-height:1.2;
            ">
                🌊 Flood Path Reminder
            </h1>

            <p style="
                margin:10px 0 0;
                font-size:14px;
            ">
                eLikas Community Alert System
            </p>
        </td>
    </tr>

    <!-- Main Content -->
    <tr>
        <td style="padding:35px;">

            <h2 style="
                margin-top:0;
                color:#333333;
            ">
                Hello!
            </h2>

            <p style="
                color:#555555;
                line-height:1.7;
                margin-bottom:20px;
            ">
                Thank you for contributing flood information to the eLikas community.
            </p>

            <p style="
                color:#555555;
                line-height:1.7;
            ">
                The flood path you reported has reached the midpoint of its active period.
                To help keep community information accurate and useful, please confirm
                whether this flood path is still valid.
            </p>

            <!-- Days Remaining Badge -->
            <div style="text-align:center; margin:25px 0;">
                <span style="
                    background:#FFF5E4;
                    color:#6A2E0A;
                    padding:10px 18px;
                    border-radius:999px;
                    font-weight:bold;
                    font-size:14px;
                    display:inline-block;
                ">
                    @if($totalHours <= 0)
                        ⏳ Expired
                    @elseif($days > 0)
                        ⏳ {{ $days }} Day{{ $days == 1 ? '' : 's' }}
                        @if($hours > 0)
                            {{ $hours }} Hour{{ $hours == 1 ? '' : 's' }}
                        @endif
                        Remaining
                    @else
                        ⏳ {{ $hours }} Hour{{ $hours == 1 ? '' : 's' }} Remaining
                    @endif
                </span>
            </div>
            <!-- Action Needed -->
            <div style="
                background:#FFF5E4;
                border-left:5px solid #F5AE3D;
                padding:16px;
                margin:25px 0;
                color:#6A2E0A;
            ">
                <strong>Action Needed</strong><br>
                Please verify if this flood path is still active.
            </div>

            <!-- Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="
                   background:#FAF7F2;
                   border:1px solid #E6DED2;
                   border-radius:10px;
                   margin-bottom:25px;
                   ">
                <tr>
                    <td style="padding:20px;">

                        <p style="
                            margin:0 0 10px;
                            color:#333333;
                            font-weight:bold;
                        ">
                            Description
                        </p>

                        <p style="
                            margin:0 0 20px;
                            color:#666666;
                            line-height:1.6;
                        ">
                            {{ $floodPath->description }}
                        </p>

                        <hr style="
                            border:none;
                            border-top:1px solid #E6DED2;
                            margin:15px 0;
                        ">

                        <p style="
                            margin:0 0 8px;
                            color:#333333;
                            font-weight:bold;
                        ">
                            Expiry Date
                        </p>

                        <p style="
                            margin:0;
                            color:#666666;
                        ">
                            {{ $floodPath->expiry->timezone('Asia/Manila')->format('F d, Y h:i A') }}
                        </p>

                    </td>
                </tr>
            </table>

            <!-- CTA Button -->
            <div style="text-align:center; margin:35px 0;">

                <a href="https://elikas.solarflare-tilapia.ts.net/"
                   style="
                   background:#6A2E0A;
                   color:#ffffff;
                   text-decoration:none;
                   padding:14px 30px;
                   border-radius:8px;
                   display:inline-block;
                   font-weight:bold;
                   font-size:15px;
                   ">
                    Confirm Flood Path
                </a>

            </div>

            <p style="
                color:#555555;
                line-height:1.7;
                margin-bottom:0;
            ">
                Your updates help residents make informed decisions during flooding events.
                Thank you for supporting your community and helping keep local information accurate.
            </p>

        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td style="
            background:#FAF7F2;
            padding:20px;
            text-align:center;
            color:#777777;
            font-size:12px;
            border-top:1px solid #E6DED2;
        ">
            <strong>eLikas</strong><br>
            Community-Based Flood & Evacuation Information System
        </td>
    </tr>

</table>

</td>
</tr>
</table>

</body>
</html>