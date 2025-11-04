# Email Templates Setup Guide

This guide explains how to configure **three different email templates** in Supabase for the INF Platform 2.0.

---

## Overview

Your platform now supports three distinct email flows:

| Email Type | Used For | Template File | Supabase Type |
|------------|----------|---------------|---------------|
| **Student Signup** | When students create accounts | `EMAIL_TEMPLATE_STUDENT_SIGNUP.md` | Confirm signup |
| **Company Invitation** | When admins invite companies | `EMAIL_TEMPLATE_INSTRUCTIONS.md` | Invite user |
| **Password Reset** | Forgot password for all users | `EMAIL_TEMPLATE_PASSWORD_RESET.md` | Reset Password |

---

## 🎯 Quick Setup Checklist

- [ ] Configure Student Signup email template
- [ ] Configure Company Invitation email template
- [ ] Configure Password Reset email template
- [ ] Add redirect URLs to Supabase
- [ ] Test all three email flows
- [ ] Verify emails are sent and links work

---

## 1️⃣ Student Signup Email Template

### When It's Sent
- Automatically when a student signs up via `/signup` page
- Requires email confirmation before login

### Setup Steps

1. **Go to Supabase Dashboard**
   - Navigate to: `Authentication → Email Templates → Confirm signup`

2. **Set Subject Line**
   ```
   Welcome to INF Platform - Confirm Your Email ✅
   ```

3. **Paste HTML Template**
   - Open `EMAIL_TEMPLATE_STUDENT_SIGNUP.md`
   - Copy the HTML template
   - Paste into the Supabase editor

4. **Configure Redirect URL**
   - Go to: `Authentication → URL Configuration`
   - Add redirect URLs:
     ```
     http://localhost:3000/auth/callback
     https://your-domain.com/auth/callback
     ```

5. **Test the Flow**
   - Go to `/signup`
   - Create a new student account with `@um6p.ma` email
   - Check email inbox
   - Click confirmation link
   - Verify redirect to app

### Template Features
- ✅ Welcome message for students
- ✅ Clear call-to-action button
- ✅ Step-by-step onboarding guide
- ✅ Expiration notice (24 hours)
- ✅ Responsive design
- ✅ UM6P branding

---

## 2️⃣ Company Invitation Email Template

### When It's Sent
- When admin uses "Quick Invite" feature
- Creates company account and sends invitation
- Password is set by company via magic link

### Setup Steps

1. **Go to Supabase Dashboard**
   - Navigate to: `Authentication → Email Templates → Invite user`

2. **Set Subject Line**
   ```
   You're invited to {{ .Data.event_name }}! 🎉
   ```

3. **Paste HTML Template**
   - Open `EMAIL_TEMPLATE_INSTRUCTIONS.md`
   - Copy the HTML template (the big HTML block)
   - Paste into the Supabase editor

4. **Configure Redirect URL**
   - Go to: `Authentication → URL Configuration`
   - Add redirect URLs:
     ```
     http://localhost:3000/auth/set-password
     https://your-domain.com/auth/set-password
     ```

5. **Test the Flow**
   - Login as admin
   - Go to event → "Quick Invite"
   - Invite a new company
   - Check company email inbox
   - Click "Set My Password" button
   - Set password and verify redirect to company dashboard

### Template Features
- ✅ Event details (name, date)
- ✅ Company information (name, code)
- ✅ Password setup instructions
- ✅ Next steps for companies
- ✅ Professional design
- ✅ Clear branding

### Available Variables
The company invitation template supports these Supabase variables:
- `{{ .Email }}` - Company email
- `{{ .ConfirmationURL }}` - Password setup link
- `{{ .Data.event_name }}` - Event name
- `{{ .Data.company_name }}` - Company name
- `{{ .Data.company_code }}` - Unique company code
- `{{ .Data.industry }}` - Company industry

---

## 3️⃣ Password Reset Email Template

### When It's Sent
- When student or company clicks "Forgot Password"
- Works for all user types (students, companies, admins)

### Setup Steps

1. **Go to Supabase Dashboard**
   - Navigate to: `Authentication → Email Templates → Reset Password`

2. **Set Subject Line**
   ```
   Reset Your INF Platform Password 🔑
   ```

3. **Paste HTML Template**
   - Open `EMAIL_TEMPLATE_PASSWORD_RESET.md`
   - Copy the HTML template
   - Paste into the Supabase editor

4. **Configure Redirect URL**
   - Go to: `Authentication → URL Configuration`
   - Add redirect URLs:
     ```
     http://localhost:3000/auth/reset-password
     https://your-domain.com/auth/reset-password
     ```

5. **Test the Flow**
   
   **For Next.js Frontend:**
   - Go to `/login`
   - Click "Forgot Password?"
   - Enter email and submit
   - Check email inbox
   - Click reset link
   - Set new password at `/auth/reset-password`
   - Login with new password
   
   **For Vite Frontend:**
   - Go to `/login`
   - Click "Forgot Password?"
   - Enter email and submit
   - Check email inbox
   - Click reset link
   - Set new password at `/reset-password`
   - Login with new password

### Template Features
- ✅ Clear security notice
- ✅ One-time password (OTP) code as backup
- ✅ Expiration warning (1 hour)
- ✅ Security best practices
- ✅ Alternative text link if button doesn't work
- ✅ Professional design

---

## 🔧 Common Configuration Issues

### Issue 1: Emails Not Sent
**Cause:** Email confirmations disabled in Supabase

**Fix:**
1. Go to: `Authentication → Providers → Email`
2. Enable "Confirm email" toggle
3. Configure SMTP settings (or use Supabase's default)

### Issue 2: Wrong Redirect After Click
**Cause:** Incorrect redirect URL configuration

**Fix:**
1. Go to: `Authentication → URL Configuration`
2. Verify ALL redirect URLs are added:
   - Student signup: `/auth/callback`
   - Company invite: `/auth/set-password`
   - Password reset: `/auth/reset-password`
3. Include both `http://localhost:3000` and production URLs

### Issue 3: Template Variables Not Working
**Cause:** Wrong email type selected

**Fix:**
- **Student signup** must use "Confirm signup" type
- **Company invitation** must use "Invite user" type
- **Password reset** must use "Reset Password" type

Each type has different available variables!

### Issue 4: Link Expired
**Cause:** User clicked link after expiration time

**Fix:**
1. Go to: `Authentication → Email`
2. Adjust token expiration times:
   - Email confirmation: 86400 seconds (24 hours)
   - Password reset: 3600 seconds (1 hour)
   - Magic link: 3600 seconds (1 hour)

---

## 📋 Testing Checklist

### Test Student Signup Flow
- [ ] Navigate to `/signup`
- [ ] Fill form with `@um6p.ma` email
- [ ] Submit signup
- [ ] Receive confirmation email with correct template
- [ ] Email has purple/blue gradient header
- [ ] Click confirmation link
- [ ] Redirected to app (not 404)
- [ ] Can login with new account

### Test Company Invitation Flow
- [ ] Login as admin
- [ ] Navigate to event → Quick Invite
- [ ] Invite new company
- [ ] Company receives invitation email
- [ ] Email shows event details and company code
- [ ] Click "Set My Password" button
- [ ] Redirected to password setup page
- [ ] Set password successfully
- [ ] Redirected to company dashboard
- [ ] Can login with new credentials

### Test Password Reset Flow
- [ ] Navigate to `/login`
- [ ] Click "Forgot Password"
- [ ] Enter email (student or company)
- [ ] Receive reset email
- [ ] Email has red/pink gradient header
- [ ] Click reset link
- [ ] Redirected to reset password page
- [ ] Enter new password
- [ ] Password updated successfully
- [ ] Can login with new password

---

## 🎨 Customization

### Change Colors
Edit the gradient colors in each template's `<style>` section:

**Student Signup (Purple/Blue):**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**Company Invitation (Green/Blue):**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**Password Reset (Pink/Red):**
```css
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
```

### Add Logo
Add your logo to the header section of each template:

```html
<div class="header">
    <img src="https://your-domain.com/logo.png" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">
    <h1>Welcome to INF Platform</h1>
</div>
```

### Modify Text
Simply edit the HTML content in each template file. All text is clearly commented.

---

## 📚 Related Files

- `EMAIL_TEMPLATE_STUDENT_SIGNUP.md` - Full student signup template
- `EMAIL_TEMPLATE_INSTRUCTIONS.md` - Full company invitation template
- `EMAIL_TEMPLATE_PASSWORD_RESET.md` - Full password reset template
- `frontend/app/auth/forgot-password/page.tsx` - Forgot password page (Next.js)
- `frontend/app/auth/reset-password/page.tsx` - Reset password page (Next.js)
- `src/pages/ForgotPassword.tsx` - Forgot password page (Vite)
- `src/pages/ResetPassword.tsx` - Reset password page (Vite)

---

## 🆘 Troubleshooting

### "Email not sent" Error
1. Check Supabase logs: `Authentication → Logs`
2. Verify SMTP configuration
3. Check rate limits (60 emails/hour in free tier)
4. Ensure email confirmation is enabled

### "Invalid redirect URL" Error
1. Go to: `Authentication → URL Configuration`
2. Add exact redirect URL (with `/auth/callback`, `/auth/set-password`, etc.)
3. Include both `http://` and `https://` versions
4. Restart dev server after changes

### Variables Not Rendering
1. Verify correct email type is selected
2. Check variable syntax: `{{ .Email }}` (with spaces)
3. Ensure metadata is passed in `signUp()` options
4. Check Supabase logs for errors

### Links Return 404
1. Verify routes exist in your app
2. Check `App.tsx` (Vite) or routing config (Next.js)
3. Ensure redirect URL matches exact route
4. Test locally first with `localhost` URLs

---

## ✅ Production Deployment

Before going to production:

1. **Update Redirect URLs**
   - Add production domain to Supabase
   - Remove `localhost` URLs (or keep for testing)

2. **Configure Custom SMTP**
   - Use SendGrid, AWS SES, or Mailgun
   - Avoid Supabase's rate limits (60/hour)
   - Better deliverability

3. **Test All Flows**
   - Test with real email addresses
   - Verify deliverability (check spam folder)
   - Test on mobile devices

4. **Monitor Email Logs**
   - Regularly check Supabase logs
   - Set up alerts for failed emails
   - Track delivery rates

---

## 🎉 Summary

You now have three distinct email templates:

1. ✅ **Student Signup** - Purple/blue gradient, onboarding steps
2. ✅ **Company Invitation** - Professional, event details, password setup
3. ✅ **Password Reset** - Red/pink gradient, security warnings, OTP code

All templates are:
- Responsive and mobile-friendly
- Professional and branded
- Clear call-to-action
- Secure with expiration times
- Customizable

Need help? Check the troubleshooting section or consult the Supabase documentation.
