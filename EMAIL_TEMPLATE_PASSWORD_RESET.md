# Password Reset Email Template (Supabase)

This template is for **password reset** emails sent when users click "Forgot Password".

## Configuration

**Email Type:** `Reset Password` (in Supabase Dashboard → Authentication → Email Templates)

**Subject:** `Reset Your INF Platform Password 🔑`

---

## HTML Template

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f7fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .alert-box {
            background-color: #fff5f5;
            border-left: 4px solid #fc8181;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .alert-box p {
            margin: 8px 0;
            color: #742a2a;
            font-size: 14px;
        }
        .info-text {
            font-size: 16px;
            color: #2d3748;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
        }
        .button:hover {
            box-shadow: 0 6px 20px rgba(245, 87, 108, 0.6);
        }
        .token-box {
            background-color: #f7fafc;
            border: 2px dashed #cbd5e0;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
            text-align: center;
        }
        .token-code {
            font-size: 24px;
            font-weight: 700;
            color: #2d3748;
            letter-spacing: 2px;
            font-family: 'Courier New', monospace;
        }
        .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            color: #718096;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🔑 Password Reset Request</h1>
        </div>

        <!-- Main Content -->
        <div class="content">
            <p class="info-text">
                Hi there!
            </p>
            <p class="info-text">
                We received a request to reset the password for your <strong>INF Platform</strong> account associated with <strong>{{ .Email }}</strong>.
            </p>

            <!-- Reset Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{{ .ConfirmationURL }}" class="button">
                    🔓 Reset Your Password
                </a>
            </div>

            <!-- Alternative: OTP Code -->
            <p style="text-align: center; color: #718096; font-size: 14px; margin: 25px 0;">
                Or copy this one-time password:
            </p>
            <div class="token-box">
                <div class="token-code">{{ .Token }}</div>
                <p style="color: #718096; font-size: 13px; margin-top: 10px;">
                    Enter this code on the password reset page
                </p>
            </div>

            <!-- Security Alert -->
            <div class="alert-box">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>• This reset link is valid for <strong>1 hour</strong> only</p>
                <p>• If you didn't request this reset, please ignore this email</p>
                <p>• Your password will remain unchanged until you complete the reset</p>
                <p>• Never share this link or code with anyone</p>
            </div>

            <p style="color: #718096; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #667eea; word-break: break-all;">{{ .ConfirmationURL }}</a>
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                This email was sent to <strong>{{ .Email }}</strong>
            </p>
            <p style="margin-top: 15px;">
                If you didn't request a password reset, someone may have entered your email by mistake. Your account is still secure.
            </p>
            <p style="margin-top: 15px;">
                © 2025 INF Platform - Speed Recruiting System<br>
                UM6P Mohammed VI Polytechnic University
            </p>
        </div>
    </div>
</body>
</html>
```

---

## Available Variables

- `{{ .Email }}` - User's email address
- `{{ .ConfirmationURL }}` - Password reset link (required)
- `{{ .Token }}` - One-time password code (6-digit)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your application URL

---

## Setup Instructions

### 1. Go to Supabase Dashboard
Navigate to: **Authentication → Email Templates → Reset Password**

### 2. Set the Subject Line
```
Reset Your INF Platform Password 🔑
```

### 3. Paste the HTML Template
Copy the HTML template above and paste it into the email body editor.

### 4. Configure Redirect URL
In **Authentication → URL Configuration**, add the reset password callback URL:
- `http://localhost:3000/auth/reset-password` (development)
- `https://your-domain.com/auth/reset-password` (production)

### 5. Test the Flow
1. Click "Forgot Password" on login page
2. Enter your email
3. Check inbox for reset email
4. Click the reset link
5. Set new password
6. Verify you can login with new password

---

## Important Notes

1. **Reset links expire in 1 hour** (configurable in Supabase settings)
2. **One-time use only** - after clicking the link, it becomes invalid
3. **Works for both students and companies** - same template for all users
4. **OTP code provided** as backup method
5. **Rate limited** - Supabase prevents spam password reset requests

---

## Security Features

- ✅ Time-limited tokens (1 hour expiration)
- ✅ One-time use tokens
- ✅ Rate limiting on reset requests
- ✅ Clear security warnings in email
- ✅ OTP code as alternative to link
- ✅ Email verification before password change

---

## Customization

You can customize:
- Token expiration time in Supabase settings
- Email colors and styling
- Security notice text
- Footer information
- Add company logo
