<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Content Removed</title>
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
                🚫 Content Removed
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
                Hello, {{ $user->username ?? 'there' }}!
            </h2>

            <p style="
                color:#555555;
                line-height:1.7;
                margin-bottom:20px;
            ">
                One of your contributions to the eLikas community has been reviewed
                by our moderation team.
            </p>

            <p style="
                color:#555555;
                line-height:1.7;
            ">
                After review, your {{ $contentType }} was found to be
                <strong>{{ $reason }}</strong> and has been removed from the platform.
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
                    ⚠️ Removed
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
                <strong>Reason for Removal</strong><br>
                Your {{ $contentType }} was {{ $reason }}.
            </div>

            @if($snippet)
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
                            Removed Content
                        </p>

                        <p style="
                            margin:0;
                            color:#666666;
                            line-height:1.6;
                            font-style:italic;
                        ">
                            "{{ $snippet }}"
                        </p>

                    </td>
                </tr>
            </table>
            @endif

            <p style="
                color:#555555;
                line-height:1.7;
                margin-bottom:0;
            ">
                If you believe this was a mistake, please contact our support team
                so we can review the decision with you.
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