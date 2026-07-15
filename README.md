# POC — Plateforme de gestion et de suivi des marchés publics

Démonstrateur fonctionnel (proof of concept) d'une plateforme de dématérialisation et de
pilotage du cycle de vie des marchés publics, pour une entité contractante en République
du Congo. Réalisé par AFRICA LINK BUSINESS.

Le cœur du produit reproduit la logique du **Plan de Passation des Marchés (PPM)** :
chaque étape d'un marché porte une **date prévisionnelle** et une **date réalisée**, et
la plateforme calcule automatiquement les **écarts**, les **retards** et les **alertes**.

## Démarrage rapide

Prérequis : **Node.js 20+** (testé sur Node 24). Aucune base de données à installer
(SQLite, fichier local).

```bash
npm install
npx prisma migrate dev      # crée la base et le schéma
npm run seed                # jeu de démonstration déterministe
npm run dev                 # http://localhost:3000
```

Pour repartir d'une base propre : `npm run db:reset` puis `npm run seed`.

## Comptes de démonstration

Mot de passe commun : **`Passw0rd!`**

| Identifiant | Profil | Accès notable |
|-------------|--------|---------------|
| `admin` | Administrateur | Tout, y compris administration & journal |
| `sp` | Secrétaire Permanent | Validation (PPM, passation, contrats, achats) |
| `prep` | Responsable Préparation | Édition PPM, achats, fournisseurs |
| `passation` | Responsable Passation | Édition passation & PPM |
| `suivi` | Responsable Suivi des contrats | Édition contrats & évaluation fournisseurs |

> **Date de référence figée : 15/07/2026.** Pour rendre la démonstration reproductible,
> la date « aujourd'hui » est une constante (`lib/config.ts`) — écarts, retards et alertes
> sont donc identiques quel que soit le jour réel. En production, remplacer `today()` par
> `new Date()`.

## Modules

1. **Tableau de bord** — KPIs, graphiques, alertes prioritaires, activité récente.
2. **Plan de passation (PPM)** — marchés, grille Prévu/Réalisé par phase, écarts colorés, export Excel/PDF.
3. **Passation** — déroulement des procédures, validation d'étapes, historisation.
4. **Contrats & exécution** — garanties, paiements, réceptions, pénalités, avenants, ordres de service, bons de commande (contrats-cadres).
5. **Achats sous seuil** — circuit demande → approbation → commande → paiement.
6. **Fournisseurs** — base unique, historique, évaluation de performance (aide à la décision).
7. **GED** — dossier électronique par marché, versions, recherche multicritère, flux de fichiers sécurisé.
8. **Alertes** — retards de publication/étape, échéances de contrat, garanties expirant, retards de livraison, paiements en attente.
9. **Administration** — utilisateurs & droits (matrice RBAC), modèles de procédure, journal d'audit + export.

## Pile technique

- **Next.js 15** (App Router, Server Actions) · **React 19** · **TypeScript**
- **Prisma** + **SQLite** (montants FC en réel pour dépasser la limite Int 32 bits)
- **Tailwind CSS v4** · UI maison · **Recharts** (graphiques) · **lucide-react** (icônes)
- Authentification maison **jose** (JWT/cookie httpOnly) + **bcryptjs** · RBAC 4 niveaux
- **ExcelJS** (exports Excel) · **pdfkit** (exports PDF) · **Vitest** (tests)

## Scripts

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build & exécution production |
| `npm run seed` | (Re)génère les données de démonstration |
| `npm run db:reset` | Réinitialise la base |
| `npm test` | Tests unitaires (moteur d'écarts) |

## Choix & limites du POC

- Les **9 variantes** de jeux d'étapes du modèle Excel (3 natures × 3 modalités) sont
  fidèlement reproduites comme *modèles de procédure*, plus 2 procédures allégées.
- Une étape peut porter une **date** ou un **montant** (« Montant du contrat ») — géré
  par `stepKind`.
- Migration **PostgreSQL** triviale (changer `datasource` ; re-typer les montants en `Decimal`).
- Recalcul des alertes **à la demande** (bouton / route `/api/alerts/recompute`) ; en
  production, prévoir une tâche planifiée (cron).
- Hors périmètre POC (reconnus, non implémentés) : sauvegarde/restauration avancée,
  formation/manuels, interopérabilité ERP/comptabilité/plateformes nationales.

## Structure

```
app/(auth)/login          Connexion
app/(app)/…               Modules (dashboard, ppm, passation, contrats, achats,
                          fournisseurs, ged, alertes, admin)
app/api/…                 Exports, flux GED, recompute alertes
actions/…                 Server Actions par module
lib/…                     prisma, auth, rbac, ecarts, alertes, enums, exports, config
prisma/schema.prisma      Modèle de données (25+ entités)
prisma/seed.ts            Données de démonstration déterministes
components/…              UI, badges, sidebar, grille PPM, graphiques
tests/…                   Tests Vitest
```
