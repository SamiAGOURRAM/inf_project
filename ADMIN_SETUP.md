# Configuration du Compte Administrateur

## Méthode 1 : Créer un Admin via Supabase Dashboard (Recommandé)

### Étape 1 : Créer un utilisateur
1. Allez dans votre **Supabase Dashboard**
2. Cliquez sur **Authentication** → **Users**
3. Cliquez sur **Add user** → **Create new user**
4. Remplissez :
   - Email : `admin@yourschool.edu` (ou votre email)
   - Password : Créez un mot de passe sécurisé
   - ✅ Cochez "Auto Confirm User"
5. Cliquez sur **Create user**
6. **Notez l'UUID de l'utilisateur** créé

### Étape 2 : Définir le rôle admin dans la base de données
1. Allez dans **SQL Editor** dans Supabase
2. Exécutez cette requête (remplacez `USER_UUID` par l'UUID de l'étape 1) :

```sql
-- Mettre à jour le profil pour définir le rôle admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'USER_UUID';

-- Vérifier que ça a fonctionné
SELECT id, email, full_name, role 
FROM profiles 
WHERE role = 'admin';
```

### Étape 3 : Se connecter
- Allez sur votre application : `http://localhost:3000/login`
- Utilisez les identifiants créés à l'étape 1
- Vous serez redirigé vers `/admin` automatiquement

---

## Méthode 2 : Créer un Admin via SQL (Plus rapide)

Exécutez ce script dans **SQL Editor** de Supabase :

```sql
-- 1. Créer un utilisateur admin dans auth.users
-- ATTENTION: Remplacez l'email et le mot de passe ci-dessous
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Insérer dans auth.users (Supabase Auth)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@yourschool.edu',  -- ⚠️ CHANGEZ CET EMAIL
        crypt('Admin123!', gen_salt('bf')),  -- ⚠️ CHANGEZ CE MOT DE PASSE
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"admin"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO admin_user_id;

    -- 2. Créer le profil correspondant
    INSERT INTO profiles (
        id,
        email,
        full_name,
        role
    ) VALUES (
        admin_user_id,
        'admin@yourschool.edu',  -- ⚠️ MÊME EMAIL
        'Administrateur',
        'admin'
    );

    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
END $$;
```

**⚠️ IMPORTANT :** 
- Remplacez `admin@yourschool.edu` par votre email
- Remplacez `Admin123!` par un mot de passe sécurisé
- Gardez ces identifiants en sécurité !

---

## Méthode 3 : Promouvoir un utilisateur existant

Si vous avez déjà créé un compte (par exemple en tant qu'étudiant), vous pouvez le promouvoir en admin :

```sql
-- Remplacez 'votre@email.com' par votre email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'votre@email.com';

-- Vérifier
SELECT id, email, full_name, role 
FROM profiles 
WHERE email = 'votre@email.com';
```

---

## Vérification

Après avoir créé l'admin, vérifiez avec cette requête :

```sql
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at
FROM profiles p
WHERE p.role = 'admin';
```

Vous devriez voir votre compte admin listé.

---

## Accès au Dashboard Admin

Une fois le compte admin créé :

1. **Connexion** : `http://localhost:3000/login`
2. **Dashboard Admin** : `http://localhost:3000/admin`

### Pages disponibles pour l'admin :
- `/admin` - Dashboard principal avec statistiques
- `/admin/events` - Gestion des événements et créneaux
- `/admin/companies` - Vérification et gestion des entreprises
- `/admin/analytics` - Analytics détaillées avec exports CSV

---

## Sécurité

### RLS (Row Level Security)
Les politiques RLS vérifient automatiquement que `profiles.role = 'admin'` pour :
- ✅ Créer/modifier des événements
- ✅ Vérifier les entreprises
- ✅ Accéder aux analytics
- ✅ Voir toutes les réservations

### Recommandations :
1. **Utilisez un mot de passe fort** pour le compte admin
2. **Limitez le nombre d'admins** (1-3 maximum)
3. **Ne partagez jamais** les identifiants admin
4. **Activez 2FA** dans Supabase si disponible
5. **Surveillez les logs** dans Supabase Dashboard

---

## Dépannage

### "Access denied" lors de la connexion
```sql
-- Vérifiez que le rôle est bien 'admin'
SELECT id, email, role FROM profiles WHERE email = 'votre@email.com';

-- Si le rôle n'est pas admin, corrigez-le
UPDATE profiles SET role = 'admin' WHERE email = 'votre@email.com';
```

### Le profil n'existe pas
```sql
-- Vérifiez dans auth.users
SELECT id, email FROM auth.users WHERE email = 'votre@email.com';

-- Si l'utilisateur existe mais pas le profil, créez-le
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, email, 'admin'
FROM auth.users 
WHERE email = 'votre@email.com'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.users.id);
```

### Redirection incorrecte après login
Le middleware vérifie le rôle et redirige automatiquement :
- `admin` → `/admin`
- `company` → `/company`
- `student` → `/student`

Si ça ne fonctionne pas, vérifiez `/frontend/middleware.ts`.

---

## Créer des Admins Supplémentaires

Pour ajouter un autre admin, répétez la **Méthode 1** ou exécutez :

```sql
-- Promouvoir un utilisateur existant
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'nouvel-admin@school.edu';
```

---

## Révoquer les Droits Admin

Pour retirer les droits admin à un utilisateur :

```sql
-- Rétrograder en étudiant
UPDATE profiles 
SET role = 'student' 
WHERE email = 'ancien-admin@school.edu';

-- OU rétrograder en entreprise
UPDATE profiles 
SET role = 'company' 
WHERE email = 'ancien-admin@school.edu';
```

---

## Identifiants par Défaut (Développement)

Pour le développement/test, vous pouvez créer :

**Email:** `admin@test.com`  
**Mot de passe:** `Admin123!`

```sql
-- Script rapide pour dev/test
DO $$
DECLARE
    test_admin_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO auth.users (
        instance_id, id, aud, role, email,
        encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        test_admin_id, 'authenticated', 'authenticated',
        'admin@test.com',
        crypt('Admin123!', gen_salt('bf')), NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"admin"}', NOW(), NOW()
    );

    INSERT INTO profiles (id, email, full_name, role)
    VALUES (test_admin_id, 'admin@test.com', 'Test Admin', 'admin');
END $$;
```

**⚠️ NE PAS UTILISER EN PRODUCTION !**
