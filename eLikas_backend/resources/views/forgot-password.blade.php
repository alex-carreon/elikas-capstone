<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset your eLikas Password</title>
</head>
<body style="
    margin:0;
    padding:0;
    background-color:#f4f4f4;
    font-family:Arial, Helvetica, sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 20px;">
    <tr>
        <td align="center">

            <table width="600" cellpadding="0" cellspacing="0" border="0" style="
                background:#ffffff;
                border-radius:18px;
                overflow:hidden;
                box-shadow:0 6px 20px rgba(0,0,0,0.08);
            ">

                <!-- Header -->
                <tr>
                    <td style="
                        background:#F7AE3A;
                        background:linear-gradient(
                            135deg,
                            #FFD98A 0%,
                            #F7AE3A 35%,
                            #E89B1F 70%,
                            #D97A00 100%
                        );
                        padding:40px 32px;
                        text-align:center;
                    ">

                        <h1 style="
                            margin:0;
                            color:#ffffff;
                            font-size:32px;
                            font-weight:700;
                            letter-spacing:1px;
                        ">
                            eLikas
                        </h1>

                        <p style="
                            margin:10px 0 0;
                            color:#fff8ee;
                            font-size:14px;
                            line-height:1.5;
                        ">
                            Community Disaster Preparedness & Emergency Response Platform
                        </p>

                    </td>
                </tr>

                <!-- Content -->
                <tr>
                    <td style="padding:40px;">

                        <h2 style="
                            margin-top:0;
                            margin-bottom:20px;
                            color:#2d2d2d;
                            font-size:24px;
                        ">
                            Reset Your Password
                        </h2>

                        <p style="
                            color:#555;
                            font-size:15px;
                            line-height:1.8;
                        ">
                            Good day,
                            <strong>{{ $username }}</strong>.
                        </p>

                        <p style="
                            color:#555;
                            font-size:15px;
                            line-height:1.8;
                        ">
                            We received a request to reset the password for your
                            <strong>eLikas</strong> account. To continue, click the
                            button below and follow the instructions to create a new
                            password.
                        </p>

                        <div style="
                            text-align:center;
                            margin:35px 0;
                        ">
                            <a href="{{ $link }}"
                               style="
                                    display:inline-block;
                                    background:#6B2F0A;
                                    color:#ffffff;
                                    text-decoration:none;
                                    padding:15px 32px;
                                    border-radius:10px;
                                    font-size:15px;
                                    font-weight:600;
                               ">
                                Reset Password
                            </a>
                        </div>

                        <p style="
                            color:#666;
                            font-size:14px;
                            line-height:1.7;
                        ">
                            If the button above does not work, copy and paste the following URL into your browser:
                        </p>

                        <div style="
                            background:#f8f8f8;
                            border:1px solid #ececec;
                            border-radius:10px;
                            padding:14px;
                            margin-top:10px;
                        ">
                            <p style="
                                margin:0;
                                color:#666;
                                font-size:13px;
                                word-break:break-all;
                                line-height:1.6;
                            ">
                                {{ $link }}
                            </p>
                        </div>

                        <p style="
                            color:#777;
                            font-size:14px;
                            line-height:1.8;
                            margin-top:30px;
                        ">
                            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged unless you complete the reset process.
                        </p>

                        <p style="
                            color:#555;
                            font-size:15px;
                            line-height:1.8;
                            margin-top:30px;
                        ">
                            Sincerely,<br>
                            <strong>The eLikas Team</strong>
                        </p>

                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="
                        background:#fafafa;
                        border-top:1px solid #eeeeee;
                        padding:24px;
                        text-align:center;
                    ">

                        <p style="
                            margin:0;
                            color:#888;
                            font-size:12px;
                            line-height:1.8;
                        ">
                            © {{ date('Y') }} eLikas. All rights reserved.
                        </p>

                        <p style="
                            margin-top:8px;
                            color:#999;
                            font-size:12px;
                        ">
                            This is an automated email. Please do not reply directly to this message.
                        </p>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>