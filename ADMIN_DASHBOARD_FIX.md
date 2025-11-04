# Guide de Déploiement - Corrections Admin Dashboard

## Problème Résolu
- ✅ Incohérence entre le compteur de "Pending Approvals" et la page "Verify Companies"
- ✅ Ajout du champ `verification_status` dans les analytics
- ✅ Affichage correct des statuts (Pending/Verified/Rejected) dans le tableau

## Migration à Appliquer

### Migration 12: Fix Company Analytics
**Fichier:** `20251101000012_fix_company_analytics.sql`

Copier et exécuter dans **Supabase SQL Editor** :

```sql
-- Migration: Fix Company Analytics to include verification_status
-- Created: 2025-11-01
-- Description: Update fn_get_company_analytics to return verification_status

DROP FUNCTION IF EXISTS fn_get_company_analytics() CASCADE;

CREATE OR REPLACE FUNCTION fn_get_company_analytics()
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    total_offers INTEGER,
    active_offers INTEGER,
    total_bookings INTEGER,
    confirmed_bookings INTEGER,
    unique_students INTEGER,
    is_verified BOOLEAN,
    verification_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.company_name,
        COUNT(DISTINCT o.id)::INTEGER as total_offers,
        COUNT(DISTINCT CASE WHEN o.is_active THEN o.id END)::INTEGER as active_offers,
        COUNT(DISTINCT ib.id)::INTEGER as total_bookings,
        COUNT(DISTINCT CASE WHEN ib.status = 'confirmed' THEN ib.id END)::INTEGER as confirmed_bookings,
        COUNT(DISTINCT ib.student_id)::INTEGER as unique_students,
        c.is_verified,
        c.verification_status::TEXT
    FROM companies c
    LEFT JOIN offers o ON c.id = o.company_id
    LEFT JOIN interview_bookings ib ON o.id = ib.offer_id
    GROUP BY c.id, c.company_name, c.is_verified, c.verification_status
    ORDER BY total_bookings DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION fn_get_company_analytics() TO authenticated;

-- Add comment
COMMENT ON FUNCTION fn_get_company_analytics IS 'Get analytics for all companies including verification status';
```

## Changements dans le Frontend

### 1. Admin Dashboard (`/admin/page.tsx`)
- ✅ Compteur "Pending Approvals" utilise maintenant `verification_status = 'pending'`
- ✅ Tableau "Company Performance" affiche les 3 statuts (Pending/Verified/Rejected)
- ✅ Type TypeScript mis à jour pour inclure `verification_status`

### 2. Manage Companies (`/admin/companies/page.tsx`)
- ✅ Aucun changement nécessaire (déjà correct)

## Test Après Migration

1. **Appliquer la migration 12** dans Supabase SQL Editor
2. **Recharger le dashboard admin** : `http://localhost:3000/admin`
3. **Vérifier que les compteurs correspondent** :
   - Dashboard principal : "Pending Approvals"
   - Page Companies : "Pending Review"
   - Les deux doivent afficher le **même nombre**

## Statuts des Entreprises

Le système gère maintenant 3 statuts :

| Statut | Couleur | Description |
|--------|---------|-------------|
| `pending` | 🟡 Orange | En attente de vérification |
| `verified` | 🟢 Vert | Vérifiée et approuvée |
| `rejected` | 🔴 Rouge | Rejetée par l'admin |

## Ordre d'Application des Migrations

Si vous partez de zéro :

1. ✅ Migration 1-10 (déjà appliquées)
2. ✅ Migration 11 - Booking Engine Functions
3. 🆕 Migration 12 - Fix Company Analytics ← **Appliquer maintenant**

## Vérification Rapide

Testez la cohérence avec cette requête :

```sql
-- Compter les entreprises en attente
SELECT COUNT(*) as pending_count
FROM companies
WHERE verification_status = 'pending';

-- Tester la fonction analytics
SELECT * FROM fn_get_company_analytics();
```

Les deux requêtes doivent montrer les mêmes entreprises en attente.
