<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Content Flagged</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f5f5f5;
    font-family:Arial, Helvetica, sans-serif;
">

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
            background:#C0392B;
            padding:35px 30px;
            color:#ffffff;
            text-align:center;
        ">
            <h1 style="
                margin:0;
                font-size:30px;
                line-height:1.2;
            ">
                🚩 Content Flagged
            </h1>

            <p style="
                margin:10px 0 0;
                font-size:14px;
            ">
                eLikas Moderation Alert
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
                Hello, Admin!
            </h2>

            <p style="
                color:#555555;
                line-height:1.7;
                margin-bottom:20px;
            ">
                A piece of content on eLikas has just reached the flag threshold
                and needs your review.
            </p>

            <p style="
                color:#555555;
                line-height:1.7;
            ">
                This {{ $details['type'] === 'comment' ? 'comment' : 'flood path' }}
                has been flagged by <strong>{{ $details['flag_count'] }}</strong>
                different users.
            </p>

            <!-- Status Badge -->
            <div style="text-align:center; margin:25px 0;">
                <span style="
                    background:#FDEAEA;
                    color:#8A1F11;
                    padding:10px 18px;
                    border-radius:999px;
                    font-weight:bold;
                    font-size:14px;
                    display:inline-block;
                ">
                    ⚠️ {{ $details['flag_count'] }} Flags — Review Needed
                </span>
            </div>

            <!-- Action Needed -->
            <div style="
                background:#FDEAEA;
                border-left:5px solid #C0392B;
                padding:16px;
                margin:25px 0;
                color:#8A1F11;
            ">
                <strong>Action Needed</strong><br>
                Please review this {{ $details['type'] === 'comment' ? 'comment' : 'flood path' }}
                and decide whether it should be approved or removed.
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

                        <p style="margin:0 0 10px; color:#333333; font-weight:bold;">
                            Flagged Content Details
                        </p>

                        <table width="100%" cellpadding="4" cellspacing="0" style="color:#666666; font-size:14px;">
                            <tr>
                                <td style="width:140px; font-weight:bold; color:#333333;">Type</td>
                                <td>{{ ucfirst(str_replace('_', ' ', $details['type'])) }}</td>
                            </tr>
                            <tr>
                                <td style="font-weight:bold; color:#333333;">
                                    @if($details['type'] === 'comment') Comment ID @else Flood Path ID @endif
                                </td>
                                <td>{{ $details['content_id'] }}</td>
                            </tr>
                            <tr>
                                <td style="font-weight:bold; color:#333333;">Element ID</td>
                                <td>{{ $details['element_id'] }}</td>
                            </tr>
                            <tr>
                                <td style="font-weight:bold; color:#333333;">Posted By</td>
                                <td>{{ $details['posted_by'] ?? 'Unknown' }} (ID: {{ $details['posted_by_id'] ?? 'N/A' }})</td>
                            </tr>
                        </table>

                        @if(!empty($details['content']))
                        <p style="
                            margin:15px 0 0;
                            color:#666666;
                            line-height:1.6;
                            font-style:italic;
                            border-top:1px solid #E6DED2;
                            padding-top:15px;
                        ">
                            "{{ $details['content'] }}"
                        </p>
                        @endif

                    </td>
                </tr>
            </table>

            <p style="
                color:#555555;
                line-height:1.7;
                margin-bottom:0;
            ">
                Please log in to the admin dashboard to take action on this report.
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