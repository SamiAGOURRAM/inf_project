# 🔧 Configuration Supabase Storage pour CVs

## Configuration Requise

Le système de profil étudiant nécessite un bucket Supabase Storage pour stocker les CVs.

### 1. Créer le Bucket

1. Ouvrir Supabase Dashboard → **Storage**
2. Cliquer sur **"New bucket"**
3. Paramètres :
   - **Name**: `student-cvs`
   - **Public bucket**: ✅ Coché (pour accès public)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `application/pdf`

### 2. Politiques de Sécurité (RLS)

Appliquer ces politiques dans Storage → student-cvs → Policies :

#### A. Politique d'Upload (INSERT)
```sql
-- Students can upload their own CV
CREATE POLICY "Students can upload own CV"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-cvs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### B. Politique de Lecture (SELECT)
```sql
-- Public can view CVs (for companies to download)
CREATE POLICY "Public can view CVs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'student-cvs');
```

#### C. Politique de Suppression (DELETE)
```sql
-- Students can delete their own CV
CREATE POLICY "Students can delete own CV"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Vérification

Tester les opérations :

```typescript
// Upload
const { error } = await supabase.storage
  .from('student-cvs')
  .upload('cvs/test.pdf', file)

// Get URL
const { data } = supabase.storage
  .from('student-cvs')
  .getPublicUrl('cvs/test.pdf')

// Delete
const { error } = await supabase.storage
  .from('student-cvs')
  .remove(['cvs/test.pdf'])
```

### 4. Alternative: Bucket Privé (Plus Sécurisé)

Si vous préférez que seuls les étudiants et les entreprises avec qui ils ont un interview puissent voir le CV :

1. Créer bucket **privé** (Public bucket: ❌ Décoché)
2. Utiliser signed URLs :

```typescript
// Generate signed URL (expires in 1 hour)
const { data, error } = await supabase.storage
  .from('student-cvs')
  .createSignedUrl('cvs/file.pdf', 3600)
```

3. Politique de lecture personnalisée :
```sql
CREATE POLICY "Companies can view CVs of their interviewees"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'student-cvs'
  AND (
    -- Student can view their own CV
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Companies with bookings can view student CVs
    EXISTS (
      SELECT 1 FROM interview_bookings ib
      JOIN offers o ON o.id = ib.offer_id
      JOIN companies c ON c.id = o.company_id
      WHERE c.profile_id = auth.uid()
        AND ib.student_id::text = (storage.foldername(name))[1]
    )
  )
);
```

## 📋 Checklist

- [ ] Bucket `student-cvs` créé
- [ ] Public ou Privé configuré selon besoin
- [ ] Politiques RLS appliquées
- [ ] Limite de taille 5MB configurée
- [ ] Type MIME `application/pdf` autorisé
- [ ] Testé upload/download/delete

## 🔍 Troubleshooting

### Erreur: "new row violates row-level security policy"
→ Vérifier que les politiques RLS sont bien créées

### Erreur: "Bucket not found"
→ Vérifier le nom du bucket dans le code: `student-cvs`

### Erreur: "File size exceeds limit"
→ Fichier > 5MB, demander à l'étudiant de compresser

### Upload fonctionne mais URL retourne 404
→ Si bucket privé, utiliser `createSignedUrl` au lieu de `getPublicUrl`
