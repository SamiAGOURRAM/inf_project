# 🔗 Configuration Supabase pour Codespaces

## URLs à Ajouter dans Supabase Dashboard

### Redirect URLs (Authentication → URL Configuration)

Ajoutez ces URLs :

```
https://opulent-fiesta-7j55g5xggx93rv6g-3000.app.github.dev/auth/callback
https://opulent-fiesta-7j55g5xggx93rv6g-3000.app.github.dev/auth/set-password
https://opulent-fiesta-7j55g5xggx93rv6g-3000.app.github.dev/**
```

**Note :** Le wildcard `/**` couvre toutes les routes.

### Site URL

```
https://opulent-fiesta-7j55g5xggx93rv6g-3000.app.github.dev
```

---

## ⚠️ Important : Codespaces URL Change

Les URLs GitHub Codespaces changent à chaque fois que vous :
- Stoppez et redémarrez le Codespace
- Créez un nouveau Codespace

**Solution Recommandée :**

### Option A : Utiliser Localhost avec Port Forwarding (Recommandé pour Dev)

Gardez `http://localhost:3000` et utilisez le port forwarding de Codespaces (déjà activé automatiquement).

**Dans Supabase :**
```
Redirect URLs:
- http://localhost:3000/auth/callback
- http://localhost:3000/auth/set-password
- http://localhost:3000/**

Site URL:
- http://localhost:3000
```

**Pourquoi ça marche ?**
- Codespaces forward automatiquement port 3000
- Supabase voit `localhost:3000` comme origin
- Plus stable (URL ne change pas)

### Option B : Configurer Custom Domain (Production)

Pour production, déployez sur Vercel/Netlify avec domaine fixe :

```
https://inf-platform.vercel.app
```

---

## 📧 Template Email - Corrections

Votre template est excellent ! Voici les **corrections mineures** :

### Problème 1 : Variables Supabase

Certaines variables peuvent ne pas exister selon le contexte. Ajoutez des fallbacks :

```html
<!-- Au lieu de : -->
{{ .Data.event_name }}

<!-- Utilisez : -->
{{ .Data.event_name | default "Speed Recruiting Event" }}
```

### Problème 2 : Styles inline pour compatibilité email

Les `display: flex` ne fonctionnent pas dans tous les clients email. Votre approche avec tables est **correcte** !

### Template Email Corrigé (Optimisé)

Voici la version améliorée avec fallbacks :

```html
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
                🎉 Welcome to INF Platform!
              </h1>
              <p style="color: #e0e7ff; font-size: 16px; margin: 0;">
                Speed Recruiting Event - Company Invitation
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
                      {{ if .Data.event_name }}{{ .Data.event_name }}{{ else }}Speed Recruiting 2025{{ end }}
                    </h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="40" style="vertical-align: top; padding-right: 15px;">
                          <table cellpadding="0" cellspacing="0" width="40" height="40" style="background-color: #dbeafe; border-radius: 8px;">
                            <tr>
                              <td align="center" valign="middle" style="font-size: 20px;">🏢</td>
                            </tr>
                          </table>
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Company</p>
                          <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                            {{ if .Data.company_name }}{{ .Data.company_name }}{{ else }}Your Company{{ end }}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="40" style="vertical-align: top; padding-right: 15px;">
                          <table cellpadding="0" cellspacing="0" width="40" height="40" style="background-color: #fef3c7; border-radius: 8px;">
                            <tr>
                              <td align="center" valign="middle" style="font-size: 20px;">🔑</td>
                            </tr>
                          </table>
                        </td>
                        <td style="vertical-align: top;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Company Code</p>
                          <p style="margin: 0;">
                            <span style="color: #1f2937; font-size: 16px; font-family: 'Courier New', monospace; font-weight: 600; background-color: #f3f4f6; padding: 8px 12px; border-radius: 6px; display: inline-block;">
                              {{ if .Data.company_code }}{{ .Data.company_code }}{{ else }}COMPANY2025{{ end }}
                            </span>
                          </p>
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
                Great news! You've been invited to participate in <strong>{{ if .Data.event_name }}{{ .Data.event_name }}{{ else }}our upcoming Speed Recruiting event{{ end }}</strong> as a recruiting company.
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                To get started, please <strong>activate your account and set your password</strong> by clicking the button below:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
                          <a href="{{ .ConfirmationURL }}" style="display: block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                            🔐 Set My Password & Access Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #667eea; word-break: break-all; font-size: 12px;">{{ .ConfirmationURL }}</a>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                  <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      ⚠️ <strong>Important:</strong> This link expires in 24 hours. Please activate your account soon to ensure access to the event.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's Next Section -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">
                📝 What Happens Next?
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #667eea; font-weight: 700; margin-right: 10px;">1.</span>
                    <span style="color: #4b5563; font-size: 15px;">Click the button above to set your secure password</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #667eea; font-weight: 700; margin-right: 10px;">2.</span>
                    <span style="color: #4b5563; font-size: 15px;">Access your company dashboard instantly</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #667eea; font-weight: 700; margin-right: 10px;">3.</span>
                    <span style="color: #4b5563; font-size: 15px;">Create your job offers and opportunities</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #667eea; font-weight: 700; margin-right: 10px;">4.</span>
                    <span style="color: #4b5563; font-size: 15px;">Review your pre-generated interview time slots</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #667eea; font-weight: 700; margin-right: 10px;">5.</span>
                    <span style="color: #4b5563; font-size: 15px;">Start receiving student bookings!</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Help Section -->
          <tr>
            <td style="padding: 30px; background-color: #eff6ff; border-top: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="60" style="vertical-align: top; padding-right: 20px;">
                    <table cellpadding="0" cellspacing="0" width="50" height="50" style="background-color: #dbeafe; border-radius: 50%;">
                      <tr>
                        <td align="center" valign="middle" style="font-size: 24px;">💡</td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align: top;">
                    <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 8px 0; font-weight: 600;">
                      Need Help?
                    </h4>
                    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                      If you have any questions or issues accessing your account, please contact the event administrator or visit our help center.
                    </p>
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
                © 2025 INF Speed Recruiting Platform. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📝 Instructions d'Application

### 1. Configuration Supabase URLs

**Allez dans Supabase Dashboard :**
```
Project → Authentication → URL Configuration
```

**Ajoutez TOUTES ces URLs dans "Redirect URLs" :**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/set-password
http://localhost:3000/**
https://opulent-fiesta-7j55g5xggx93rv6g-3000.app.github.dev/auth/callback
https://opulent-fiesta-7j55g5xggx93rv6g-3000.app.github.dev/auth/set-password
https://opulent-fiesta-7j55g5xggx93rv6g-3000.app.github.dev/**
```

**Site URL :**
```
http://localhost:3000
```

### 2. Appliquer le Template Email

**Supabase Dashboard :**
```
Project → Authentication → Email Templates → Invite user
```

1. Cliquez sur "Invite user"
2. Collez le template HTML ci-dessus
3. Cliquez "Save"

### 3. Tester

```bash
# Dans votre Codespace, assurez-vous que le serveur tourne
cd frontend
npm run dev

# Ouvrir dans le navigateur (Codespaces forward automatiquement)
# Aller sur /admin/events/[id]/quick-invite
# Inviter avec votre email réel
```

---

## ✅ Résumé des Corrections

| Élément | Avant | Après |
|---------|-------|-------|
| **Redirect URLs** | Seulement localhost | localhost + Codespaces URL |
| **Site URL** | localhost:3000 | localhost:3000 (stable) |
| **Template Variables** | Pas de fallback | Fallbacks avec `{{ if }}` |
| **Email Styles** | Flex (incompatible) | Tables (✅ compatible) |
| **Button Style** | Box-shadow inline | Gradient background |
| **Expiration Notice** | Manquant | ⚠️ Ajouté (24h warning) |

---

## 🎯 Template Final - Points Forts

✅ **Responsive** : Largeur fixe 600px (standard email)  
✅ **Compatible** : Tables au lieu de flexbox  
✅ **Professionnel** : Gradient, emojis, structure claire  
✅ **Sécurisé** : Mention expiration 24h  
✅ **Informatif** : Étapes claires + aide  
✅ **Variables Supabase** : Toutes présentes avec fallbacks  

Votre template est **excellent** ! Appliquez simplement ces corrections et testez. 🚀
