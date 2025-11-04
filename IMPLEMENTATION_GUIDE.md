# INF Platform 2.0 - Implementation Guide

## 🚀 Quick Start (Délai 2 semaines)

### Prérequis
- Compte Supabase (gratuit)
- Node.js 18+ et npm/pnpm
- Git

### Setup Initial (Jour 1 - Matin)

#### 1. Configuration Supabase

1. Créer un nouveau projet sur [supabase.com](https://supabase.com)
2. Récupérer les credentials :
   - `NEXT_PUBLIC_SUPABASE_URL` (Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon/public key)

3. Exécuter les migrations SQL (dans l'ordre) :
   - Aller dans `SQL Editor` sur Supabase Dashboard
   - Copier/coller et exécuter `001_initial_schema.sql`
   - Copier/coller et exécuter `002_core_functions.sql`
   - (Optionnel en dev) : exécuter `003_seed_data.sql`

#### 2. Setup Next.js Frontend

```bash
# Cloner ou créer le projet
cd /workspaces/inf_project

# Initialiser Next.js
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir

# Naviguer dans le dossier
cd frontend

# Installer les dépendances essentielles
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zustand react-hook-form zod @hookform/resolvers
npm install date-fns
npm install lucide-react class-variance-authority clsx tailwind-merge

# shadcn/ui (composants UI)
npx shadcn-ui@latest init
# Sélectionner : Default style, Slate color, CSS variables = yes

# Installer composants shadcn nécessaires
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add alert
```

#### 3. Configuration Environnement

Créer `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Config
NEXT_PUBLIC_APP_NAME=INF Platform 2.0
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📁 Structure du Projet Recommandée

```
inf_project/
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql          ✅ Créé
│       ├── 002_core_functions.sql          ✅ Créé
│       └── 003_seed_data.sql               ✅ Créé
│
├── frontend/                                (Next.js App)
│   ├── app/
│   │   ├── (auth)/                         [Routes d'authentification]
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   ├── student/
│   │   │   │   │   └── page.tsx            [Signup étudiant avec checkbox deprioritized]
│   │   │   │   └── company/
│   │   │   │       └── page.tsx            [Signup entreprise]
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (student)/                      [Routes étudiants - protected]
│   │   │   ├── offers/
│   │   │   │   ├── page.tsx                [Browse & filter offers]
│   │   │   │   └── [companyId]/
│   │   │   │       └── page.tsx            [Company detail + slots]
│   │   │   ├── schedule/
│   │   │   │   └── page.tsx                [My bookings]
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (company)/                      [Routes entreprises - protected]
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                [Company schedule overview]
│   │   │   ├── offers/
│   │   │   │   ├── page.tsx                [Manage offers]
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [offerId]/edit/
│   │   │   │       └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (admin)/                        [Routes admin - protected]
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                [System control panel]
│   │   │   ├── companies/
│   │   │   │   └── page.tsx                [Verify companies]
│   │   │   ├── students/
│   │   │   │   └── page.tsx                [Manage deprioritized flags]
│   │   │   ├── slots/
│   │   │   │   └── page.tsx                [Generate event slots]
│   │   │   ├── config/
│   │   │   │   └── page.tsx                [Event configuration]
│   │   │   └── layout.tsx
│   │   │
│   │   ├── api/                            [API Routes (if needed)]
│   │   │   └── webhooks/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx                      [Root layout]
│   │   └── page.tsx                        [Landing page]
│   │
│   ├── components/
│   │   ├── ui/                             [shadcn components]
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── StudentSignupForm.tsx
│   │   │   └── CompanySignupForm.tsx
│   │   │
│   │   ├── student/
│   │   │   ├── OfferCard.tsx
│   │   │   ├── OfferFilters.tsx
│   │   │   ├── SlotBookingButton.tsx
│   │   │   └── ScheduleCalendar.tsx
│   │   │
│   │   ├── company/
│   │   │   ├── CompanySlotTable.tsx
│   │   │   └── OfferForm.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── CompanyVerificationTable.tsx
│   │   │   ├── SlotGeneratorForm.tsx
│   │   │   ├── SystemStatsCards.tsx
│   │   │   └── EventConfigForm.tsx
│   │   │
│   │   └── shared/
│   │       ├── Navbar.tsx
│   │       ├── Footer.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   [Supabase client pour browser]
│   │   │   ├── server.ts                   [Supabase client pour server components]
│   │   │   └── middleware.ts               [Auth middleware]
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts                  [Auth state management]
│   │   │   ├── useBookings.ts
│   │   │   ├── useOffers.ts
│   │   │   └── useSlots.ts
│   │   │
│   │   ├── stores/
│   │   │   ├── authStore.ts                [Zustand store for auth]
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── types/
│   │   │   └── database.types.ts           [Types générés depuis Supabase]
│   │   │
│   │   └── utils.ts                        [Utility functions]
│   │
│   ├── public/
│   │   ├── logos/
│   │   └── favicon.ico
│   │
│   ├── .env.local
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── package.json
│
├── docs/
│   ├── DEPLOYMENT.md
│   ├── ADMIN_GUIDE.md                      [Guide pour l'admin event]
│   └── YEARLY_RESET.md                     [Procédure reset annuel]
│
├── scripts/
│   ├── test-concurrent-bookings.js         [Test de charge]
│   └── generate-types.sh                   [Générer types TS depuis Supabase]
│
├── PROJECT_ARCHITECTURE.md                  ✅ Créé
└── README.md
```

---

## 🎯 Planning de Développement (14 jours)

### **Semaine 1 : Fondations + Admin**

#### **Jour 1 (Lundi)**
- [ ] ✅ Setup Supabase + Migrations SQL
- [ ] ✅ Setup Next.js + dépendances
- [ ] Configurer TypeScript strict mode
- [ ] Créer structure de dossiers
- [ ] Setup Supabase clients (browser/server)

#### **Jour 2 (Mardi)**
- [ ] Système d'authentification
  - [ ] LoginForm component
  - [ ] StudentSignupForm (avec checkbox `is_deprioritized`)
  - [ ] CompanySignupForm
  - [ ] Auth middleware pour routes protégées
- [ ] Hook `useAuth` avec Zustand

#### **Jour 3 (Mercredi)**
- [ ] Dashboard Admin - Partie 1
  - [ ] Layout admin avec navigation
  - [ ] Page de vérification des entreprises
  - [ ] Fonction `fn_verify_company` UI
- [ ] Table de gestion des étudiants (toggle `is_deprioritized`)

#### **Jour 4 (Jeudi)**
- [ ] Dashboard Admin - Partie 2
  - [ ] Page Event Config (modifier `event_config`)
  - [ ] Formulaire de génération de slots
  - [ ] Appeler `fn_generate_event_slots` depuis UI
- [ ] Dashboard statistiques (stats cards)

#### **Jour 5 (Vendredi)**
- [ ] Tests Admin
  - [ ] Générer slots pour toutes les entreprises
  - [ ] Vérifier les horaires (10min + 5min buffer)
  - [ ] Tester changement de phase
- [ ] Fixes et polish

---

### **Semaine 2 : Student/Company Flow + Tests**

#### **Jour 6 (Lundi)**
- [ ] Student Flow - Partie 1
  - [ ] Page Browse Offers (galerie avec cards)
  - [ ] Filtres par `interest_tag`
  - [ ] Hook `useOffers` pour fetching

#### **Jour 7 (Mardi)**
- [ ] Student Flow - Partie 2
  - [ ] Page Company Detail
  - [ ] Affichage des slots disponibles
  - [ ] Composant `SlotBookingButton`
  - [ ] Appel `fn_book_interview` avec gestion d'erreurs

#### **Jour 8 (Mercredi)**
- [ ] Student Flow - Partie 3
  - [ ] Page "My Schedule" (liste des bookings)
  - [ ] Fonction Cancel Booking (`fn_cancel_booking`)
  - [ ] Toast notifications pour feedback
- [ ] Hook `useBookings` avec SWR (auto-refresh)

#### **Jour 9 (Jeudi)**
- [ ] Company Flow
  - [ ] Page Company Dashboard (voir tous les slots)
  - [ ] Afficher étudiants réservés par slot
  - [ ] Page Manage Offers (CRUD)
  - [ ] Formulaire création/édition offre

#### **Jour 10 (Vendredi)**
- [ ] Polish UI/UX
  - [ ] Responsive design (mobile-first)
  - [ ] Loading states partout
  - [ ] Error boundaries
  - [ ] Animations (Framer Motion si temps)

#### **Jour 11 (Lundi)**
- [ ] Tests critiques
  - [ ] Script test de concurrence (`test-concurrent-bookings.js`)
  - [ ] Valider les règles de fairness (Phase 1 gate)
  - [ ] Tester caps (3 bookings Phase 1, 6 total)
  - [ ] Tester slot full (capacity 2)

#### **Jour 12 (Mardi)**
- [ ] Optimisations
  - [ ] Refresh materialized view `slot_availability`
  - [ ] Ajouter index manquants si nécessaire
  - [ ] Optimiser requêtes lentes (via Supabase logs)
- [ ] Tests E2E (Playwright - flows critiques uniquement)

#### **Jour 13 (Mercredi)**
- [ ] Déploiement
  - [ ] Déployer sur Vercel
  - [ ] Configurer variables d'environnement
  - [ ] Tester en production
- [ ] Créer documentation admin

#### **Jour 14 (Jeudi)**
- [ ] Documentation finale
  - [ ] `ADMIN_GUIDE.md` (comment setup l'événement)
  - [ ] `YEARLY_RESET.md` (procédure reset annuel)
  - [ ] `DEPLOYMENT.md`
- [ ] Buffer pour bugs de dernière minute

---

## 🔑 Composants Critiques à Développer

### 1. StudentSignupForm.tsx (CRITIQUE - Fairness)

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

const signupSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  fullName: z.string().min(2, 'Nom complet requis'),
  isDeprioritized: z.boolean(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function StudentSignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      isDeprioritized: false, // Default: can participate in Phase 1
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // 2. Update profile with additional data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          role: 'student',
          is_deprioritized: data.isDeprioritized, // CRITICAL: Set the fairness flag
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // 3. Redirect to student dashboard
      router.push('/offers');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CRITICAL: The fairness checkbox */}
        <FormField
          control={form.control}
          name="isDeprioritized"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  J'ai déjà trouvé mon stage
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  En cochant cette case, vous ne pourrez réserver qu'à partir de la Phase 2.
                  Cela permet aux autres étudiants de réserver en priorité.
                </p>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Inscription...' : 'S\'inscrire'}
        </Button>
      </form>
    </Form>
  );
}
```

### 2. SlotBookingButton.tsx (CRITIQUE - Race Conditions)

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface SlotBookingButtonProps {
  slotId: string;
  currentBookings: number;
  capacity: number;
  onBookingSuccess?: () => void;
}

export function SlotBookingButton({ 
  slotId, 
  currentBookings, 
  capacity,
  onBookingSuccess 
}: SlotBookingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [optimisticBooked, setOptimisticBooked] = useState(false);
  const { toast } = useToast();

  const isFull = currentBookings >= capacity;
  const isAvailable = !isFull && !optimisticBooked;

  const handleBook = async () => {
    if (!isAvailable) return;

    // Optimistic update
    setOptimisticBooked(true);
    setLoading(true);

    try {
      // Call the RPC function
      const { data, error } = await supabase.rpc('fn_book_interview', {
        slot_id_to_book: slotId,
      });

      if (error) throw error;

      if (!data.success) {
        // Rollback optimistic update
        setOptimisticBooked(false);
        
        toast({
          variant: 'destructive',
          title: 'Réservation échouée',
          description: data.message,
        });
        return;
      }

      // Success!
      toast({
        title: 'Réservation confirmée !',
        description: data.message,
      });

      onBookingSuccess?.();

    } catch (err: any) {
      // Rollback on error
      setOptimisticBooked(false);
      
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message || 'Une erreur est survenue',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isFull) {
    return (
      <Button variant="outline" disabled>
        Complet
      </Button>
    );
  }

  if (optimisticBooked) {
    return (
      <Button variant="outline" disabled>
        Réservé ✓
      </Button>
    );
  }

  return (
    <Button onClick={handleBook} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Réserver
    </Button>
  );
}
```

### 3. SlotGeneratorForm.tsx (Admin - CRITIQUE)

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export function SlotGeneratorForm() {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch verified companies
  useEffect(() => {
    async function fetchCompanies() {
      const { data } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_verified', true);
      
      setCompanies(data || []);
    }
    fetchCompanies();
  }, []);

  const handleGenerate = async () => {
    if (selectedCompanies.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins une entreprise',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('fn_generate_event_slots', {
        p_company_ids: selectedCompanies,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message);
      }

      toast({
        title: 'Slots générés !',
        description: data.message,
      });

    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Générer les créneaux d'entretien</CardTitle>
        <CardDescription>
          Sélectionnez les entreprises pour lesquelles créer les créneaux.
          Les horaires seront générés selon la configuration de l'événement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Company selection checkboxes */}
        <div className="space-y-2 mb-4">
          {companies.map((company) => (
            <label key={company.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={company.id}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCompanies([...selectedCompanies, company.id]);
                  } else {
                    setSelectedCompanies(selectedCompanies.filter(id => id !== company.id));
                  }
                }}
              />
              <span>{company.name}</span>
            </label>
          ))}
        </div>

        <Button onClick={handleGenerate} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Générer les créneaux
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 🧪 Tests Critiques

### Script de test de concurrence

Créer `scripts/test-concurrent-bookings.js` :

```javascript
// Test 100 utilisateurs qui bookent le même slot simultanément
// Objectif : vérifier que seulement 2 réussissent (capacity = 2)

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'your-url';
const SUPABASE_ANON_KEY = 'your-key';

// Vous aurez besoin de tokens de différents utilisateurs
// Pour ce test, créez 100 comptes étudiants
const USER_TOKENS = [
  // Liste de tokens JWT...
];

async function testConcurrentBookings(slotId) {
  const promises = USER_TOKENS.map(token => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    return supabase.rpc('fn_book_interview', { slot_id_to_book: slotId });
  });

  const results = await Promise.allSettled(promises);

  const successful = results.filter(
    r => r.status === 'fulfilled' && r.value.data?.success
  );
  const failed = results.filter(
    r => r.status === 'rejected' || !r.value.data?.success
  );

  console.log('=== RÉSULTATS DU TEST DE CONCURRENCE ===');
  console.log(`✅ Réservations réussies : ${successful.length}`);
  console.log(`❌ Réservations échouées : ${failed.length}`);
  console.log(`📊 Attendu : Max 2 réussies (capacité du slot)`);
  
  if (successful.length === 2) {
    console.log('✅ TEST PASSÉ : Exactement 2 réservations ont réussi');
  } else {
    console.log(`❌ TEST ÉCHOUÉ : ${successful.length} réservations au lieu de 2`);
  }
}

// Exécuter
testConcurrentBookings('your-slot-id');
```

---

## 📝 Notes Importantes

### Sécurité
- **RLS est CRITIQUE** : Toutes les tables doivent avoir RLS activé
- Ne JAMAIS faire de bookings côté client sans passer par `fn_book_interview`
- Les fonctions `SECURITY DEFINER` doivent valider l'utilisateur

### Performance
- Refresh `slot_availability` toutes les 30s pendant l'événement
- Utiliser SWR/React Query côté client pour caching
- Index sur toutes les colonnes de filtrage

### Maintenance Annuelle
- Script de reset dans `003_seed_data.sql`
- Documenter TOUT dans `YEARLY_RESET.md`
- Créer un checklist pour l'admin

---

## 🚀 Déploiement Vercel

```bash
# Dans le dossier frontend
npm run build

# Vérifier qu'il n'y a pas d'erreurs

# Déployer
vercel --prod

# Configurer les variables d'environnement sur Vercel Dashboard
```

---

**Prêt à commencer ?** 

La prochaine étape est de créer les composants et hooks réutilisables. Voulez-vous que je génère le code complet pour un composant spécifique ?
