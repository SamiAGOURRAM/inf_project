📧 CUSTOM EMAIL TEMPLATE FOR QUICK INVITE
==========================================

Go to: Supabase Dashboard → Authentication → Email Templates → Confirm signup

Replace the default template with this:

---

Subject: You're invited to {{ .Data.event_name }}! 🎉

---

Body (HTML):

<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 10px 0; font-weight: 700;">
                🎉 You're Invited!
              </h1>
              <p style="color: #e0e7ff; font-size: 16px; margin: 0;">
                Speed Recruiting Event
              </p>
            </td>
          </tr>

          <!-- Event Details -->
          <tr>
            <td style="padding: 40px 30px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">
                      {{ .Data.event_name }}
                    </h2>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="40" style="vertical-align: top; padding-right: 15px;">
                          <div style="width: 40px; height: 40px; background-color: #dbeafe; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 20px;">🏢</span>
                          </div>
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Company</p>
                          <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">{{ .Data.company_name }}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 15px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="40" style="vertical-align: top; padding-right: 15px;">
                          <div style="width: 40px; height: 40px; background-color: #fef3c7; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 20px;">🔑</span>
                          </div>
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Company Code</p>
                          <p style="margin: 0; color: #1f2937; font-size: 16px; font-family: 'Courier New', monospace; font-weight: 600; background-color: #f3f4f6; padding: 8px 12px; border-radius: 6px; display: inline-block;">{{ .Data.company_code }}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Message -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Great news! You've been invited to participate in <strong>{{ .Data.event_name }}</strong> as a recruiting company.
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                To get started, please set your password and activate your account by clicking the button below:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      🔐 Set My Password & Access Event
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #667eea; word-break: break-all; font-size: 12px;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- What's Next Section -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                📝 What's Next?
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #667eea; font-weight: 700; margin-right: 10px;">1.</span>
                    <span style="color: #4b5563; font-size: 15px;">Click the button above to set your password</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #667eea; font-weight: 700; margin-right: 10px;">2.</span>
                    <span style="color: #4b5563; font-size: 15px;">Login to your company dashboard</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #667eea; font-weight: 700; margin-right: 10px;">3.</span>
                    <span style="color: #4b5563; font-size: 15px;">Review your interview time slots</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #667eea; font-weight: 700; margin-right: 10px;">4.</span>
                    <span style="color: #4b5563; font-size: 15px;">Start receiving candidate bookings!</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #1f2937;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
                This invitation was sent to <strong style="color: #e5e7eb;">{{ .Email }}</strong>
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="color: #4b5563; font-size: 12px; margin: 15px 0 0 0;">
                © 2025 Speed Recruiting Platform. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>

---

AVAILABLE VARIABLES:
- {{ .Email }} - User's email address
- {{ .ConfirmationURL }} - Link to set password
- {{ .Data.event_name }} - Event name (from metadata)
- {{ .Data.company_name }} - Company name (from metadata)
- {{ .Data.company_code }} - Company code (from metadata)
- {{ .Data.event_id }} - Event ID (from metadata)

---

IMPORTANT NOTES:
1. This template uses the "Confirm signup" email type
2. The {{ .ConfirmationURL }} automatically redirects to /company after password setup
3. The template is fully responsive (mobile-friendly)
4. Gradient colors match your brand (#667eea → #764ba2)
5. All metadata from signUp() is accessible via {{ .Data.variable_name }}
