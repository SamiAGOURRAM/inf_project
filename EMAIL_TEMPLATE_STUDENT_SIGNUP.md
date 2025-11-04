# Student Signup Email Template (Supabase)

This template is for **student account confirmation** emails sent via Supabase Authentication.

## Configuration

**Email Type:** `Confirm signup` (in Supabase Dashboard → Authentication → Email Templates)

**Subject:** `Welcome to INF Platform - Confirm Your Email ✅`

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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        .welcome-text {
            font-size: 18px;
            color: #1a202c;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .info-box {
            background-color: #edf2f7;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .info-box p {
            margin: 8px 0;
            color: #2d3748;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .button:hover {
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }
        .steps {
            margin: 30px 0;
        }
        .step {
            display: flex;
            margin: 15px 0;
            align-items: start;
        }
        .step-number {
            background-color: #667eea;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
        }
        .step-text {
            color: #2d3748;
            font-size: 15px;
            line-height: 1.6;
        }
        .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            color: #718096;
            font-size: 13px;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🎓 Welcome to INF Platform</h1>
        </div>

        <!-- Main Content -->
        <div class="content">
            <p class="welcome-text">
                Hi there! 👋
            </p>
            <p class="welcome-text">
                Welcome to the <strong>INF Platform 2.0 - Speed Recruiting</strong> system for UM6P students!
            </p>

            <!-- Confirmation Button -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="{{ .ConfirmationURL }}" class="button">
                    ✅ Confirm Your Email
                </a>
            </div>

            <!-- Account Info -->
            <div class="info-box">
                <p><strong>📧 Your Email:</strong> {{ .Email }}</p>
                <p><strong>👤 Account Type:</strong> Student</p>
            </div>

            <!-- Next Steps -->
            <div class="steps">
                <h3 style="color: #1a202c; margin-bottom: 20px;">What's Next?</h3>
                
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-text">
                        <strong>Confirm your email</strong> by clicking the button above
                    </div>
                </div>

                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-text">
                        <strong>Complete your profile</strong> with your specialization, graduation year, and CV
                    </div>
                </div>

                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-text">
                        <strong>Browse company offers</strong> and book interview slots during recruitment events
                    </div>
                </div>

                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-text">
                        <strong>Attend your interviews</strong> and land your dream internship!
                    </div>
                </div>
            </div>

            <p style="color: #718096; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <strong>⏰ Important:</strong> This confirmation link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                This email was sent to <strong>{{ .Email }}</strong>
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

You can use these Supabase variables in your template:

- `{{ .Email }}` - User's email address
- `{{ .ConfirmationURL }}` - Email confirmation link (required)
- `{{ .SiteURL }}` - Your application URL
- `{{ .Token }}` - Raw confirmation token
- `{{ .TokenHash }}` - Hashed token
- `{{ .Data.full_name }}` - User's full name (from signup metadata)
- `{{ .Data.role }}` - User role (should be "student")
- `{{ .Data.is_deprioritized }}` - Whether student has internship

---

## Setup Instructions

### 1. Go to Supabase Dashboard
Navigate to: **Authentication → Email Templates → Confirm signup**

### 2. Set the Subject Line
```
Welcome to INF Platform - Confirm Your Email ✅
```

### 3. Paste the HTML Template
Copy the HTML template above and paste it into the email body editor.

### 4. Configure Redirect URL
In **Authentication → URL Configuration**, ensure your redirect URLs include:
- `http://localhost:3000/auth/callback` (development)
- `https://your-domain.com/auth/callback` (production)

### 5. Test the Flow
1. Create a new student account via `/signup`
2. Check the email inbox
3. Verify the email looks correct
4. Click the confirmation link
5. Ensure it redirects to your app

---

## Important Notes

1. **Email Confirmation is REQUIRED** for students
2. **Link expires in 24 hours** by default (configurable in Supabase)
3. **This template is ONLY for student signups** (not companies)
4. Companies use a different template via the "Invite user" email type
5. Users can request a new confirmation email if the link expires

---

## Customization

You can customize:
- Colors in the gradient (currently purple/blue)
- Logo (add your UM6P logo in the header)
- Footer text and links
- Step descriptions
- Additional metadata from `{{ .Data.* }}`
