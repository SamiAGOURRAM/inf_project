# 🔧 Problèmes Connus & Solutions - INF Platform

## 📋 Guide de Dépannage Complet

Ce document liste tous les problèmes potentiels que vous pourriez rencontrer et leurs solutions.

---

## 🗄️ Problèmes Base de Données

### 1. "relation X does not exist"

**Symptôme :**
```
ERROR: relation "events" does not exist
ERROR: relation "interview_bookings" does not exist
```

**Cause :**
Migration pas encore appliquée.

**Solution :**
```sql
-- Vérifier quelles tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Appliquer migration manquante
-- Dans Supabase Dashboard → SQL Editor
-- Copier-coller migration correspondante
```

**Ordre des migrations :**
1. `20251101000001` - Schéma initial
2. `20251101000007` - Table events
3. `20251101000007b` - Table interview_bookings
4. etc.

---

### 2. "function X does not exist"

**Symptôme :**
```
ERROR: function fn_book_interview(uuid, uuid, uuid) does not exist
```

**Cause :**
Fonction pas créée ou signature différente.

**Solution :**
```sql
-- Vérifier fonctions existantes
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'fn_%'
ORDER BY routine_name;

-- Si manquante, appliquer migration
-- Ex: 20251101000011_booking_engine_functions.sql
```

**Liste fonctions attendues :**
- fn_book_interview
- fn_cancel_booking
- fn_check_slot_availability
- fn_check_student_booking_limit
- fn_generate_event_slots
- fn_verify_company
- quick_invite_company
- etc.

---

### 3. "column X already exists"

**Symptôme :**
```
ERROR: column "current_phase" of relation "events" already exists
```

**Cause :**
Migration déjà partiellement appliquée.

**Solution :**
```sql
-- C'est NORMAL si migration partielle
-- Ignorer cette erreur spécifique
-- Continuer avec le reste de la migration

-- Si vraiment bloquant, utiliser IF NOT EXISTS
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS current_phase INTEGER;
```

---

### 4. "permission denied for table X"

**Symptôme :**
```
ERROR: permission denied for table profiles
```

**Cause :**
RLS (Row Level Security) bloque l'accès.

**Solution A - Vérifier policies :**
```sql
-- Lister policies existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Si aucune policy → En créer
-- Voir migrations 001 pour exemples
```

**Solution B - Utiliser SECURITY DEFINER :**
```sql
-- Pour fonctions qui doivent ignorer RLS temporairement
CREATE OR REPLACE FUNCTION fn_my_function()
RETURNS void
SECURITY DEFINER  -- ← Important !
SET search_path = public
AS $$
BEGIN
  -- Votre code ici
END;
$$ LANGUAGE plpgsql;
```

---

### 5. "constraint X already exists"

**Symptôme :**
```
ERROR: constraint "single_config_row" already exists
```

**Cause :**
Migration ré-exécutée.

**Solution :**
```sql
-- Supprimer d'abord si existe
ALTER TABLE event_config 
DROP CONSTRAINT IF EXISTS single_config_row;

-- Puis recréer
ALTER TABLE event_config 
ADD CONSTRAINT single_config_row CHECK (id = 1);
```

---

## 🔐 Problèmes Authentification

### 6. "User not authorized"

**Symptôme :**
Frontend retourne erreur "User not authorized" lors d'opérations.

**Cause :**
- Token JWT expiré
- RLS bloque accès
- User pas dans bon rôle

**Solution :**
```typescript
// Vérifier token valide
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Si null → Forcer refresh
await supabase.auth.refreshSession();

// Vérifier rôle
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();

console.log('Role:', profile.role);
```

---

### 7. "Email not confirmed"

**Symptôme :**
Utilisateur ne peut pas se connecter après signup.

**Cause :**
Email pas confirmé (mode Supabase par défaut).

**Solution A - Confirmer manuellement (dev) :**
```sql
-- Dans Supabase SQL Editor
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

**Solution B - Désactiver confirmation (dev uniquement) :**
```
Supabase Dashboard → Authentication → Settings
→ "Enable email confirmations" = OFF
```

**⚠️ Production :** Toujours garder confirmation active !

---

### 8. "Invalid login credentials"

**Symptôme :**
Login échoue avec bonnes credentials.

**Cause :**
- Email pas confirmé
- Compte pas encore créé
- Mauvais mot de passe

**Solution :**
```typescript
// Vérifier compte existe
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', email)
  .single();

if (!data) {
  console.log('Compte inexistant');
} else if (!data.email_confirmed_at) {
  console.log('Email pas confirmé');
}

// Reset password si oublié
await supabase.auth.resetPasswordForEmail(email);
```

---

## 🎯 Problèmes Réservation

### 9. "Slot full" alors que places visibles

**Symptôme :**
Frontend affiche "1/2 places" mais réservation échoue.

**Cause :**
Race condition ou cache désynchronisé.

**Solution :**
```typescript
// Toujours vérifier côté serveur avant afficher
const { data } = await supabase.rpc('fn_check_slot_availability', {
  p_slot_id: slotId
});

if (!data.available) {
  // Refresh UI
  await refetchSlots();
}
```

**En base :**
```sql
-- Compter réservations actuelles
SELECT 
  es.id,
  es.capacity,
  COUNT(ib.id) FILTER (WHERE ib.status = 'confirmed') as current_count,
  es.capacity - COUNT(ib.id) as available
FROM event_slots es
LEFT JOIN interview_bookings ib ON ib.slot_id = es.id
WHERE es.id = 'slot-id'
GROUP BY es.id;
```

---

### 10. "Phase 1 booking limit reached" avec 0 bookings

**Symptôme :**
Étudiant ne peut pas réserver alors qu'il a 0 réservations.

**Cause :**
- Mauvais event_id passé
- Phase mal configurée
- is_deprioritized = true en Phase 1

**Solution :**
```sql
-- Vérifier config événement
SELECT 
  current_phase,
  phase1_max_bookings,
  phase2_max_bookings
FROM events
WHERE id = 'event-id';

-- Vérifier profil étudiant
SELECT 
  id,
  email,
  is_deprioritized
FROM profiles
WHERE id = 'student-id';

-- Vérifier comptage réservations
SELECT COUNT(*) 
FROM interview_bookings ib
JOIN event_slots es ON es.id = ib.slot_id
WHERE ib.student_id = 'student-id'
AND es.event_id = 'event-id'
AND ib.status = 'confirmed';
```

---

### 11. "Already booked this slot"

**Symptôme :**
Réservation refusée alors que pas réservé visuellement.

**Cause :**
Réservation existe avec statut différent (cancelled).

**Solution :**
```sql
-- Vérifier toutes réservations (même cancelled)
SELECT * FROM interview_bookings
WHERE student_id = 'student-id'
AND slot_id = 'slot-id';

-- Si cancelled existe, supprimer pour re-réserver
DELETE FROM interview_bookings
WHERE student_id = 'student-id'
AND slot_id = 'slot-id'
AND status = 'cancelled';
```

---

## 🎨 Problèmes Frontend

### 12. "supabase is not defined"

**Symptôme :**
```
ReferenceError: supabase is not defined
```

**Cause :**
Client Supabase pas importé.

**Solution :**
```typescript
// Créer lib/supabase/client.ts si manquant
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Dans composant
import { supabase } from '@/lib/supabase/client'
```

---

### 13. "Environment variables undefined"

**Symptôme :**
```
NEXT_PUBLIC_SUPABASE_URL is undefined
```

**Cause :**
Fichier `.env.local` manquant ou mal nommé.

**Solution :**
```bash
# Créer .env.local à la racine frontend/
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
EOF

# Redémarrer Next.js
npm run dev
```

**⚠️ Attention :**
- Fichier doit s'appeler exactement `.env.local`
- Variables doivent commencer par `NEXT_PUBLIC_`
- Redémarrer serveur après modification

---

### 14. "Hydration error"

**Symptôme :**
```
Error: Hydration failed because the initial UI does not match 
what was rendered on the server.
```

**Cause :**
- Utilisation `localStorage` dans Server Component
- Date/time différente server/client
- Condition différente SSR/CSR

**Solution :**
```typescript
// Option A : Utiliser 'use client'
'use client'

import { useState, useEffect } from 'react'

export default function MyComponent() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null  // Évite hydration mismatch
  
  return <div>{/* Votre contenu */}</div>
}

// Option B : Utiliser dynamic import
import dynamic from 'next/dynamic'

const ClientOnlyComponent = dynamic(
  () => import('./ClientComponent'),
  { ssr: false }
)
```

---

### 15. "Cannot read property 'map' of undefined"

**Symptôme :**
```
TypeError: Cannot read property 'map' of undefined
```

**Cause :**
Data pas encore chargée (async).

**Solution :**
```typescript
// Toujours vérifier data existe
const [offers, setOffers] = useState<Offer[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchOffers()
}, [])

async function fetchOffers() {
  const { data } = await supabase.from('offers').select('*')
  setOffers(data || [])  // ← Fallback []
  setLoading(false)
}

if (loading) return <div>Loading...</div>

return (
  <div>
    {offers.map(offer => (  // ← Safe maintenant
      <div key={offer.id}>{offer.title}</div>
    ))}
  </div>
)
```

---

## 📧 Problèmes Email

### 16. "Email not sent"

**Symptôme :**
Invitation envoyée mais email jamais reçu.

**Cause :**
- Email dans spam
- Template Supabase mal configuré
- Rate limit atteint

**Solution :**
```typescript
// Vérifier logs Supabase
// Dashboard → Logs → Filter "email"

// Tester avec vraie adresse (pas temporaire)
// Gmail, Outlook, etc.

// Vérifier spam/junk
```

**Configurer template (Supabase Dashboard) :**
```
Authentication → Email Templates → Invite User

Subject: Invitation to {{ .SiteURL }}

Body:
<h2>Welcome {{ .Data.company_name }}!</h2>
<p>Company Code: {{ .Data.company_code }}</p>
<p><a href="{{ .ConfirmationURL }}">Set Password</a></p>
```

---

### 17. "Confirmation link expired"

**Symptôme :**
Lien email retourne "Link expired".

**Cause :**
Token expire après 24h (défaut Supabase).

**Solution A - Renvoyer email :**
```typescript
await supabase.auth.resend({
  type: 'signup',
  email: userEmail
})
```

**Solution B - Configurer expiration :**
```
Supabase Dashboard → Authentication → Settings
→ "Email confirmation expiry" = 72h
```

---

## 📁 Problèmes Storage

### 18. "Upload failed"

**Symptôme :**
Upload CV échoue silencieusement.

**Cause :**
- Bucket pas créé
- RLS bloque upload
- Fichier trop gros
- Type MIME invalide

**Solution :**
```typescript
// Vérifier bucket existe
const { data: buckets } = await supabase.storage.listBuckets()
console.log('Buckets:', buckets)

// Si manquant, créer
await supabase.storage.createBucket('student-cvs', {
  public: false,
  fileSizeLimit: 5242880, // 5MB
  allowedMimeTypes: ['application/pdf']
})

// Vérifier RLS policies
// Dashboard → Storage → student-cvs → Policies
```

**Policy Storage exemple :**
```sql
-- Students upload leur CV
CREATE POLICY "Students upload own CV"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'student-cvs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### 19. "File too large"

**Symptôme :**
```
Error: File size exceeds maximum allowed
```

**Cause :**
Fichier > limite configurée.

**Solution :**
```typescript
// Vérifier taille avant upload
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

if (file.size > MAX_SIZE) {
  alert('Fichier trop gros (max 5MB)')
  return
}

// Ou augmenter limite bucket
// Dashboard → Storage → student-cvs → Settings
// File size limit: 10MB
```

---

## 🔄 Problèmes Génération Créneaux

### 20. "No slots generated"

**Symptôme :**
Fonction génération retourne 0 créneaux.

**Cause :**
- Aucune entreprise vérifiée
- Time ranges invalides (start > end)
- Event_id incorrect

**Solution :**
```sql
-- Vérifier entreprises vérifiées
SELECT COUNT(*) FROM companies WHERE is_verified = true;
-- Si 0 → Vérifier au moins une entreprise

-- Vérifier time ranges
SELECT * FROM speed_recruiting_sessions
WHERE event_id = 'event-id';
-- Vérifier start_time < end_time

-- Tester génération manuellement
SELECT fn_generate_event_slots('event-id');
-- Voir résultat direct
```

---

### 21. "Too many slots generated"

**Symptôme :**
1000+ créneaux générés au lieu de ~14.

**Cause :**
Fonction appelée plusieurs fois ou boucle infinie.

**Solution :**
```sql
-- Vérifier nombre créneaux
SELECT 
  e.name,
  COUNT(es.id) as total_slots,
  COUNT(DISTINCT es.company_id) as companies
FROM events e
JOIN event_slots es ON es.event_id = e.id
WHERE e.id = 'event-id'
GROUP BY e.name;

-- Si trop de créneaux, supprimer et regénérer
DELETE FROM event_slots WHERE event_id = 'event-id';
SELECT fn_generate_event_slots('event-id');
```

---

## 🚀 Problèmes Déploiement

### 22. "Build failed on Vercel"

**Symptôme :**
```
Error: Cannot find module '@supabase/supabase-js'
```

**Cause :**
Dépendances pas installées.

**Solution :**
```bash
# Vérifier package.json
cat frontend/package.json

# Installer dépendances localement
cd frontend
npm install

# Push avec lock file
git add package-lock.json
git commit -m "Add lock file"
git push
```

---

### 23. "Environment variables not set"

**Symptôme :**
App déployée mais erreurs runtime.

**Cause :**
Variables env pas configurées sur Vercel.

**Solution :**
```
Vercel Dashboard → Project → Settings → Environment Variables

Ajouter:
- NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJxxx...

Puis:
Deployments → Redeploy
```

---

## 🧪 Problèmes Tests

### 24. "Test script fails"

**Symptôme :**
```
python scripts/test_concurrent_bookings.py
ModuleNotFoundError: No module named 'supabase'
```

**Cause :**
Dépendances Python pas installées.

**Solution :**
```bash
# Installer dépendances
pip install supabase-py

# Configurer credentials
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_KEY="xxx"

# Relancer test
python scripts/test_concurrent_bookings.py
```

---

## 🎯 Problèmes Performance

### 25. "Slow queries"

**Symptôme :**
Pages lentes à charger (>2s).

**Cause :**
- Index manquants
- Requêtes non optimisées
- Trop de données

**Solution :**
```sql
-- Activer query logging
-- Dashboard → Database → Logs → Slow queries

-- Vérifier index
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Ajouter index si manquant
CREATE INDEX idx_bookings_student_event 
ON interview_bookings(student_id, event_id)
WHERE status = 'confirmed';
```

---

## 📊 Checklist Débogage

Avant de demander de l'aide, vérifier :

- [ ] **Migrations appliquées** (toutes les 25)
- [ ] **Fonctions créées** (15+ fonctions fn_*)
- [ ] **RLS policies actives** (vérifier pg_policies)
- [ ] **Variables env configurées** (.env.local + Vercel)
- [ ] **Logs Supabase** (Dashboard → Logs)
- [ ] **Browser console** (F12 → Console + Network)
- [ ] **Auth session valide** (getSession() retourne user)
- [ ] **Rôle correct** (profiles.role = attendu)

---

## 🆘 Cas Extrême : Reset Complet

**⚠️ ATTENTION : Efface TOUTES les données !**

```sql
-- Sauvegarder d'abord (optionnel)
CREATE TABLE backup_bookings AS SELECT * FROM interview_bookings;
CREATE TABLE backup_profiles AS SELECT * FROM profiles;

-- Reset complet
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Ré-appliquer TOUTES les migrations dans l'ordre
-- 001 → 025
```

**Alternative moins destructive :**
```bash
# Utiliser script reset fourni
psql -f scripts/reset_database.sql
```

---

## 📞 Support

Si problème persiste après avoir essayé solutions ci-dessus :

### Informations à fournir
1. **Message d'erreur exact** (copier-coller complet)
2. **Steps to reproduce** (comment reproduire)
3. **Logs Supabase** (Dashboard → Logs)
4. **Browser console** (F12 → copier erreurs)
5. **Migration appliquées** (SELECT * FROM migrations)
6. **Version** (Next.js, Supabase, etc.)

### Ressources Utiles
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

---

**📅 Dernière Mise à Jour** : 4 Novembre 2025  
**🔧 Version** : 2.0  
**📌 Statut** : Maintenu activement

*Ce document sera mis à jour au fur et à mesure des nouveaux problèmes identifiés.*
