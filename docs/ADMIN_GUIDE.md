# Guide Administrateur - INF Platform 2.0

## 👋 Bienvenue, Admin !

Ce guide vous accompagne dans la gestion quotidienne de la plateforme INF. Il couvre toutes les opérations administratives, de la configuration initiale au jour de l'événement.

---

## 🎯 Vos Responsabilités

En tant qu'administrateur, vous êtes responsable de :

1. **Configuration de l'événement** (dates, horaires, phases)
2. **Vérification des entreprises** partenaires
3. **Gestion des étudiants** (liste deprioritized)
4. **Génération des créneaux** d'entretien
5. **Monitoring** du système pendant l'événement
6. **Support** en cas de problème

---

## 🔐 Connexion

1. Rendez-vous sur [https://inf-platform.vercel.app/login](https://inf-platform.vercel.app/login)
2. Connectez-vous avec votre email d'admin
3. Vous serez redirigé vers le **Dashboard Administrateur**

---

## 📊 Dashboard Administrateur

Le dashboard affiche :

### Vue d'ensemble
- **Total d'étudiants** inscrits
- **Entreprises vérifiées** / en attente
- **Créneaux générés** / créneaux réservés
- **Taux de remplissage** global

### Raccourcis
- Vérifier les entreprises
- Gérer les étudiants deprioritized
- Configurer l'événement
- Générer les créneaux
- Voir les statistiques en temps réel

---

## 📅 Configuration de l'Événement

### Accès
**Dashboard Admin → Configuration de l'Événement**

### Champs à Configurer

#### 1. Informations Générales
- **Nom de l'événement** : `INF 2025` (changez chaque année)
- **Date de l'événement** : La date du speed-recruiting
- **Horaires** :
  - Début : `09:00`
  - Fin : `13:00`

#### 2. Configuration des Créneaux
- **Durée d'un créneau** : `10 minutes` (recommandé)
- **Temps de buffer** : `5 minutes` (pour que les entreprises respirent)
- **Capacité par créneau** : `2 étudiants` (max)

> 💡 **Exemple** : Avec ces paramètres, les créneaux seront :
> - 09:00 - 09:10 (2 étudiants)
> - 09:15 - 09:25 (2 étudiants)
> - 09:30 - 09:40 (2 étudiants)
> - ...

#### 3. Gestion des Phases

**Phase 1 : Priorité aux étudiants sans stage**
- Date de début : `16/11/2025 à 09:00`
- Date de fin : `17/11/2025 à 23:59`
- Limite de réservations : `3 entretiens max`

**Phase 2 : Ouvert à tous**
- Date de début : `18/11/2025 à 09:00`
- Date de fin : `19/11/2025 à 08:00` (avant l'événement)
- Limite de réservations : `6 entretiens max` (total)

#### 4. État du Système
- **Phase actuelle** : 1 ou 2
- **Réservations ouvertes** : Oui/Non (interrupteur)

### Sauvegarder

Cliquez sur **"Sauvegarder la Configuration"**. Un message de confirmation apparaîtra.

---

## 🏢 Vérification des Entreprises

### Pourquoi Vérifier ?
Pour éviter que des entreprises non-partenaires ne créent des offres et reçoivent des étudiants.

### Processus

#### 1. Accéder à la Liste
**Dashboard Admin → Entreprises → En Attente de Vérification**

Vous verrez :
- Nom de l'entreprise
- Email de contact
- Date d'inscription
- Bouton "Vérifier" ou "Rejeter"

#### 2. Vérifier une Entreprise

**Critères de vérification** :
- L'entreprise est bien partenaire officielle de l'INF
- Les informations sont correctes
- Le contact est légitime

**Actions** :
1. Cliquez sur le nom pour voir les détails
2. Si tout est OK : cliquez sur **"Vérifier"**
3. Si problème : cliquez sur **"Rejeter"** (avec raison)

#### 3. Résultat

Une fois vérifiée :
- L'entreprise peut créer des offres
- Elle apparaîtra dans la liste des entreprises pour la génération de créneaux
- Les étudiants pourront voir ses offres

### Vérification en Masse (Optionnel)

Si vous avez une liste Excel des entreprises partenaires :
1. Cliquez sur **"Importer depuis CSV"**
2. Sélectionnez le fichier (format : `nom,email`)
3. Toutes les entreprises correspondantes seront vérifiées automatiquement

---

## 👥 Gestion des Étudiants

### Liste "Deprioritized" (IMPORTANT !)

Chaque année, vous recevez une liste officielle des étudiants qui ont **déjà trouvé un stage**. Ces étudiants ne peuvent réserver qu'en Phase 2 (fairness).

### Comment Gérer

#### 1. Accéder à la Liste
**Dashboard Admin → Étudiants**

Vous verrez tous les étudiants inscrits avec :
- Nom complet
- Email
- Statut "A déjà un stage" (Oui/Non)

#### 2. Marquer un Étudiant

**Manuellement** :
1. Chercher l'étudiant par nom ou email
2. Cocher la case **"A déjà trouvé son stage"**
3. Sauvegarder

**En masse (recommandé)** :
1. Cliquez sur **"Importer depuis CSV"**
2. Sélectionnez le fichier avec la liste (format : `email`)
3. Tous les étudiants de la liste seront marqués automatiquement

### Vérifier

Après import, vérifiez :
```
Dashboard Admin → Statistiques → Étudiants Deprioritized
```

Vous devriez voir le nombre correct d'étudiants marqués.

---

## 📅 Génération des Créneaux

### Quand Générer ?
**2-3 semaines avant l'événement**, une fois que :
- Toutes les entreprises partenaires sont vérifiées
- Les entreprises ont créé leurs offres
- La configuration de l'événement est finalisée

### Comment Générer

#### 1. Accéder au Générateur
**Dashboard Admin → Créneaux → Générer**

#### 2. Vérifier la Configuration Affichée
Le système affiche automatiquement :
- Date de l'événement : `20/11/2025`
- Horaires : `09:00 - 13:00`
- Durée des créneaux : `10 min` + `5 min buffer`
- Capacité : `2 étudiants/créneau`

#### 3. Sélectionner les Entreprises

Vous verrez la liste des **entreprises vérifiées uniquement**.

**Options** :
- **Tout sélectionner** : Génère pour toutes les entreprises
- **Sélection manuelle** : Cochez celles qui participent

> 💡 **Conseil** : Si une entreprise n'a pas encore créé d'offres, vous pouvez quand même générer ses créneaux. Elle pourra créer les offres après.

#### 4. Lancer la Génération

Cliquez sur **"Générer les Créneaux"**.

Le système va :
1. Calculer tous les créneaux (ex: 09:00-09:10, 09:15-09:25, ...)
2. Les créer pour chaque entreprise sélectionnée
3. Afficher un résumé

**Exemple de résultat** :
```
✅ 120 créneaux créés pour 5 entreprises
- TechCorp : 24 créneaux
- Innovation Labs : 24 créneaux
- Global Finance : 24 créneaux
- EcoGreen : 24 créneaux
- HealthTech : 24 créneaux
```

#### 5. Vérifier

Allez dans **Dashboard Admin → Créneaux → Voir Tous** pour vérifier que :
- Les horaires sont corrects
- Il n'y a pas de chevauchement
- Chaque créneau dure bien 10 minutes
- Il y a bien 5 minutes entre chaque créneau

---

## 🚀 Ouverture des Réservations

### Timeline

#### Phase 1 : Ouverture Prioritaire
**Date** : Selon votre config (ex: 16/11 à 09:00)

**Actions** :
1. **Dashboard Admin → Configuration**
2. Vérifiez que **"Phase Actuelle"** = `1`
3. Activez **"Réservations Ouvertes"** (interrupteur)
4. Cliquez sur **"Sauvegarder"**

**Résultat** :
- Seuls les étudiants **sans stage** (non-deprioritized) peuvent réserver
- Limite : **3 entretiens max** par étudiant

#### Phase 2 : Ouverture Complète
**Date** : Selon votre config (ex: 18/11 à 09:00)

**Actions** :
1. **Dashboard Admin → Configuration**
2. Changez **"Phase Actuelle"** de `1` à `2`
3. Cliquez sur **"Sauvegarder"**

**Résultat** :
- **Tous les étudiants** (y compris ceux avec stage) peuvent réserver
- Nouvelle limite : **6 entretiens max** (total)

#### Fermeture
**Date** : La veille de l'événement (ex: 19/11 à 23:00)

**Actions** :
1. **Dashboard Admin → Configuration**
2. Désactivez **"Réservations Ouvertes"**
3. Cliquez sur **"Sauvegarder"**

**Résultat** :
- Plus aucune nouvelle réservation possible
- Les étudiants peuvent toujours consulter leur planning

---

## 📊 Monitoring en Temps Réel

### Pendant les Phases de Réservation

Allez dans **Dashboard Admin → Monitoring** pour voir :

#### 1. Statistiques Globales
- **Nombre de réservations** (temps réel)
- **Taux de remplissage** (% de créneaux remplis)
- **Dernières réservations** (live feed)

#### 2. Par Entreprise
- Tableau avec chaque entreprise
- Nombre de créneaux total / réservés / disponibles
- Taux de remplissage

**Exemple** :
| Entreprise | Créneaux Total | Réservés | Disponibles | Taux |
|------------|----------------|----------|-------------|------|
| TechCorp | 24 | 42/48 | 6 | 87% |
| Innovation Labs | 24 | 35/48 | 13 | 73% |

#### 3. Alertes

Le système affiche des alertes si :
- ⚠️ Une entreprise a 0 réservation (problème ?)
- ⚠️ Trop d'erreurs de réservation (problème technique ?)
- ✅ Tout va bien

### Rafraîchissement

La page se rafraîchit automatiquement toutes les **10 secondes**.

---

## 🐛 Résolution de Problèmes

### "Un étudiant ne peut pas réserver"

**Causes possibles** :
1. ❌ Réservations fermées → Vérifiez l'interrupteur
2. ❌ Il a atteint sa limite (3 en Phase 1, 6 total)
3. ❌ Il est deprioritized et on est en Phase 1
4. ❌ Le créneau est plein (2/2)

**Solution** :
1. Allez dans **Dashboard Admin → Étudiants**
2. Cherchez l'étudiant par email
3. Vérifiez :
   - Nombre de réservations actuelles
   - Statut "deprioritized"
4. Si nécessaire, ajustez manuellement

### "Une entreprise ne voit pas ses créneaux"

**Causes** :
1. ❌ Entreprise pas vérifiée
2. ❌ Créneaux pas générés pour cette entreprise

**Solution** :
1. **Dashboard Admin → Entreprises**
2. Vérifiez que l'entreprise est **Vérifiée** (badge vert)
3. **Dashboard Admin → Créneaux → Générer**
4. Re-générez les créneaux pour cette entreprise

### "Un créneau a 3 réservations au lieu de 2"

**⚠️ Problème critique (race condition)**

**Solution immédiate** :
1. Notez les détails (entreprise, heure, étudiants)
2. Contactez le développeur
3. En attendant, annulez manuellement 1 réservation :
   - **Dashboard Admin → Créneaux → [Créneau] → Réservations**
   - Cliquez sur "Annuler" pour l'une des réservations

### "Le site est lent pendant l'ouverture de Phase 1"

**Normal** : Beaucoup d'étudiants se connectent en même temps.

**Actions** :
1. Patience, le système est conçu pour gérer la charge
2. Surveillez le **Dashboard Monitoring** pour voir le trafic
3. Si vraiment bloqué (>5 min), contactez le support technique

---

## 📞 Support

### Auto-Diagnostic

Avant de contacter le support, vérifiez :
- [ ] Les réservations sont ouvertes (`Configuration`)
- [ ] On est dans la bonne phase (1 ou 2)
- [ ] Les créneaux sont générés
- [ ] Les entreprises sont vérifiées

### Contact Support Technique

**Email** : [support-technique@inf.fr]
**Téléphone** : [XX XX XX XX XX] (uniquement urgences)

**Informations à fournir** :
- Votre nom et rôle (admin)
- Description du problème
- Captures d'écran si possible
- Actions que vous avez déjà tentées

---

## ✅ Checklist Jour de l'Événement

### Veille de l'Événement (J-1)
- [ ] Fermer les réservations (`Configuration`)
- [ ] Vérifier le taux de remplissage global
- [ ] Exporter les plannings pour les entreprises (PDF)

### Matin de l'Événement (J)
- [ ] Imprimer les badges étudiants (si nécessaire)
- [ ] Vérifier que chaque entreprise a son planning
- [ ] Avoir accès au Dashboard Admin sur place (pour dépannage)

### Pendant l'Événement
- [ ] Disponible pour questions des entreprises/étudiants
- [ ] Consulter le planning en cas de confusion

### Après l'Événement
- [ ] Collecter les retours
- [ ] Archiver les données (voir `YEARLY_RESET.md`)

---

## 📚 Ressources Supplémentaires

- **Guide de Maintenance Annuelle** : `docs/YEARLY_RESET.md`
- **Architecture Technique** : `PROJECT_ARCHITECTURE.md`
- **FAQ Développeur** : `docs/FAQ.md`

---

**Vous avez une question ?** Consultez la [FAQ](#) ou contactez-nous\!

**Dernière mise à jour** : Novembre 2025
