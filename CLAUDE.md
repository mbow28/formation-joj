# CLAUDE.md

Application d'organisation des JOJ Dakar 2026 : une API NestJS (`apps/api`), un front React (`apps/web`) et des schémas partagés (`packages/shared`), dans un monorepo pnpm. Commandes et structure détaillée : `README.md`.

## Méthodologie

- Une fonctionnalité suit le cycle `/prd` → `/spec` → `/spec-plan` → `/tdd-task` → `/converge`, avec une validation humaine après le PRD, la spec et le plan (principes : `specs/constitution.md`).
- Test d'abord : écrire le test, le voir échouer pour la bonne raison (`pnpm tdd:red <fichier>`), puis le code minimal.
- Ordre des couches : schéma partagé → entité → cas d'usage → table et migration → repository Drizzle → controller et e2e → fausse API MSW → écran (détail : `README.md`, « Ajouter une fonctionnalité »).
- Une tâche = un commit ; `pnpm verify` avant de commiter, `pnpm check` avant de conclure. Jamais de `--no-verify`.
- Celui qui produit ne valide pas : faire relire la fonctionnalité par le sous-agent `relecteur`.

## Architecture

- `packages/shared` : schémas Zod d'entrée et de réponse, seul contrat entre l'API et le front. Le front n'importe jamais `apps/api`.
- API : un module par domaine dans `apps/api/src/modules/<domaine>/`, sur le modèle de `disciplines` : `domain/` (entités, règles, erreurs), `application/` (port repository, cas d'usage), `infra/` (table Drizzle, mapper, repository), `http/` (controller), `<domaine>.module.ts` (relie le port à son implémentation, importé dans `app.module.ts`).
- `domain/` reste en TypeScript pur : ni NestJS, ni Drizzle, ni `pg` (vérifié par oxlint). Ni horloge ni hasard : l'id et la date sont passés par le cas d'usage.
- Controller fin : valider (DTO `createZodDto`), appeler un cas d'usage, sérialiser (`toResponse`). Aucune règle métier, aucun accès au repository.
- Transverse dans `apps/api/src/core/` (config, base, erreurs, santé). Migrations générées par `pnpm db:generate`, jamais éditées à la main.
- Front : pages dans `apps/web/src/routes/` (un fichier = une route), code par fonctionnalité dans `src/features/<nom>/api/` et `components/`, composants shadcn dans `src/components/ui/`.

## Concepts appréciés

- Typage strict, pas de `any` ; types dérivés des schémas Zod (`z.infer`).
- Une classe `@Injectable()` par cas d'usage, avec une seule méthode `execute()`.
- Entité à constructeur privé : `create()` applique les règles, `restore()` relit la base sans les rejouer ; état dans `props`, exposé par des getters.
- Repository = classe abstraite (port) dans `application/`, implémentée en Drizzle et en mémoire (`application/testing/`).
- Mapper explicite `toDomain()` / `toRow()` entre la ligne Drizzle et l'entité.
- Commentaires courts en français qui disent le pourquoi (`/** … */` sur les règles et les ports).

## Bonnes pratiques

- Toute erreur métier est une sous-classe d'`AppError` (`domain/<domaine>.errors.ts`) : code stable + catégorie VALIDATION, NOT_FOUND, CONFLICT ou BUSINESS_RULE. Seul `ProblemDetailsFilter` la traduit en HTTP (400, 404, 409, 422, RFC 9457). Pas de `HttpException` ni de `throw new Error()` dans le code applicatif.
- Entrées validées par un schéma de `packages/shared` via le DTO ; le domaine revérifie ses invariants.
- Aucun secret dans le code : les valeurs vont dans `apps/api/.env` (ignoré par git).
- Tests API : domaine (`*.spec.ts`), cas d'usage avec le repository en mémoire, intégration Drizzle sur PGlite (`*.int.spec.ts`), e2e supertest dans `apps/api/test/` (`*.e2e.spec.ts`) qui vérifient statut et corps.
- Tests front (`*.test.tsx`, à côté du fichier testé) : la fausse API `src/mocks/` garde le contrat et les codes d'erreur de l'API ; un audit `*.a11y.test.tsx` par état d'écran.

## Nommage

- Fichiers en kebab-case, suffixés par leur rôle : `create-discipline.ts`, `discipline.mapper.ts`, `disciplines.schema.ts`, `drizzle-discipline.repository.ts`, `disciplines.controller.ts`.
- Classes en PascalCase ; cas d'usage verbe + nom : `CreateDiscipline`, `ListDisciplines` ; erreurs `<Entité>Error`.
- Codes d'erreur en SCREAMING_SNAKE_CASE préfixés par l'entité : `DISCIPLINE_NAME_TAKEN` ; fabriques en camelCase : `disciplineNotFound(id)`.
- Schémas Zod suffixés `Schema` (`createDisciplineSchema`), types `CreateDisciplineInput`, `DisciplineResponse` ; constantes en majuscules (`DISCIPLINE_CATEGORIES`).
- Titres de tests en anglais, préfixés par la spec et le scénario : `it('000-AS2: rejects a discipline without a name', …)`.
- Commits Conventional Commits en anglais, citant tâche et scénario : `feat(benevoles): T03 refuse a full slot (001-AS2)`.
- Code et identifiants en anglais ; commentaires, docs et specs en français.
