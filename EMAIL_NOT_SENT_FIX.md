# 📧 EMAIL NOT SENT? FIX SUPABASE AUTH CONFIGURATION

## ❌ Problem: Emails are not being sent

When you invite a company, the `auth.signUp()` function is called but **no email is sent**. This happens because:

### 🔍 Root Cause:
Supabase **disables email confirmation by default** in development/local environments to prevent spam.

## ✅ SOLUTION: Enable Email Confirmation

### Step 1: Go to Supabase Dashboard
1. Open **Supabase Dashboard** (https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **Authentication → Settings → Email Auth**

### Step 2: Enable Email Confirmation
Find the setting: **"Enable email confirmations"**

✅ **Enable it** (toggle ON)

### Step 3: Configure SMTP (CRITICAL!)
By default, Supabase uses a **rate-limited email service** for development.

For production, you MUST configure your own SMTP:

#### Option A: Use Gmail SMTP (Easy)
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Password: [App Password - NOT your Gmail password!]
```

**How to get Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Generate new password for "Mail"
5. Copy the 16-character password

#### Option B: Use SendGrid (Recommended for Production)
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587  
SMTP User: apikey
SMTP Password: [Your SendGrid API Key]
```

#### Option C: Use AWS SES
```
SMTP Host: email-smtp.[region].amazonaws.com
SMTP Port: 587
SMTP User: [Your SES SMTP Username]
SMTP Password: [Your SES SMTP Password]
```

### Step 4: Configure Email Templates
Go to: **Authentication → Email Templates → Confirm signup**

Paste the template from: `EMAIL_TEMPLATE_INSTRUCTIONS.md`

### Step 5: Test Email Sending

1. Go to Quick Invite page
2. Invite a company with a **real email** (your email for testing)
3. Check inbox (and spam folder!)
4. Click the confirmation link
5. Set password
6. Login → Should see event!

## 🐛 Debugging

### Check if email was sent:
```bash
# In Supabase Dashboard → Authentication → Users
# Look for the invited email
# Status should be: "Waiting for verification" or "Confirmed"
```

### Check logs:
```bash
# Supabase Dashboard → Logs → Edge Functions
# Search for: "signup" or your email address
```

### Common Issues:

#### 1. **"Email rate limit exceeded"**
- **Cause:** Using default Supabase email service
- **Fix:** Configure custom SMTP (see Step 3)

#### 2. **"SMTP authentication failed"**
- **Cause:** Wrong SMTP credentials
- **Fix:** Double-check SMTP user/password

#### 3. **"Email not received"**
- **Cause:** Email in spam, or blocked by provider
- **Fix:** 
  - Check spam folder
  - Whitelist sender: `noreply@mail.app.supabase.io`
  - Use different email provider for testing

#### 4. **"User already registered"**
- **Cause:** Email already exists in auth.users
- **Fix:** 
  - Delete user from Supabase Dashboard → Authentication → Users
  - Or use different email for testing

## 📊 Verification Checklist

- [ ] Email confirmation enabled in Supabase Dashboard
- [ ] SMTP configured (or using default for dev)
- [ ] Email template customized (from EMAIL_TEMPLATE_INSTRUCTIONS.md)
- [ ] Test email sent to real inbox
- [ ] Email received in inbox (check spam!)
- [ ] Confirmation link works
- [ ] User can set password
- [ ] User can login and see event

## 🚀 Production Ready Checklist

- [ ] Custom SMTP configured (not using default)
- [ ] Email template branded
- [ ] From email domain verified
- [ ] SPF/DKIM records configured
- [ ] Email deliverability tested with multiple providers (Gmail, Outlook, etc.)
- [ ] Rate limits increased
- [ ] Monitoring/alerts set up for email failures

## 💡 Quick Test (No SMTP Setup Required)

If you just want to test the workflow without waiting for emails:

1. Go to Supabase Dashboard → Authentication → Settings
2. **Disable** "Enable email confirmations"
3. Invite a company
4. Go to Supabase Dashboard → Authentication → Users
5. Find the invited user
6. Click user → Set password manually
7. Give password to company
8. They can now login directly!

**Note:** This defeats the purpose of email invitations, but good for quick testing.

## 🎯 Recommended Flow:

**Development:**
- Use Gmail SMTP (easy to set up)
- Or disable email confirmation for testing

**Production:**
- Use SendGrid or AWS SES (reliable, scalable)
- Custom domain for emails (noreply@yourdomain.com)
- Monitor email delivery rates
