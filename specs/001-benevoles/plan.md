# 001 — Bénévoles : ouvrir un créneau et s'y inscrire : plan

**Statut** : Validé

## 1. Résumé

On construit le module `volunteers` de l'API : il permet d'ouvrir un créneau d'accueil dans une discipline et d'y inscrire un bénévole. À la fin des tâches, un responsable peut ouvrir un créneau avec une capacité, un bénévole peut s'y inscrire avec son nom et son email, et l'API refuse l'inscription de trop avec un `409 SLOT_FULL`, y compris quand deux demandes arrivent en même temps pour la dernière place. Le travail tient en cinq tâches, une par couche : schémas partagés, domaine, cas d'usage, persistance, puis routes HTTP avec leurs tests e2e. Consulter un créneau et ses inscrits, refuser un email en double, se désinscrire et tout écran sont laissés aux tranches suivantes.

Les mots de la spec et leur nom dans le code :

| Dans la spec           | Dans le code         | Ce que c'est                                                       |
| ---------------------- | -------------------- | ------------------------------------------------------------------ |
| créneau                | `Slot`               | une plage horaire d'accueil dans une discipline, avec une capacité |
| capacité               | `capacity`           | le nombre maximal de bénévoles inscrits, un entier d'au moins 1    |
| heure de début, de fin | `startsAt`, `endsAt` | la date et l'heure de début et de fin du créneau                   |
| inscription            | `Registration`       | un bénévole inscrit à un créneau, avec son nom et son email        |
| nombre d'inscrits      | `registeredCount`    | le nombre d'inscriptions enregistrées sur le créneau               |
| ouvrir un créneau      | `OpenSlot`           | le cas d'usage qui crée un créneau dans une discipline existante   |
| s'inscrire             | `RegisterVolunteer`  | le cas d'usage qui inscrit un bénévole s'il reste une place        |

## 2. Fichiers par couche

On crée le module `volunteers` dans `apps/api/src/modules/volunteers/`, organisé comme le module Disciplines : un dossier par couche.

- **shared** : `packages/shared/src/volunteers.ts` contient les schémas Zod des données échangées : `openSlotSchema` (capacité entière d'au moins 1, fin strictement après le début), `slotSchema`, `slotIdParamsSchema`, `registerVolunteerSchema` (nom non vide après `trim`, 100 caractères au plus, email bien formé) et `registrationSchema`. Il est exporté par `packages/shared/src/index.ts`, et testé par `packages/shared/src/volunteers.spec.ts`.
- **domain** : `domain/slot.ts` définit l'entité `Slot` : `Slot.create()` vérifie la capacité et les horaires, `Slot.restore()` relit la base avec son nombre d'inscrits, et `slot.register()` crée une `Registration` ou lève `SLOT_FULL` quand le créneau est plein. `domain/registration.ts` définit l'entité `Registration`, qui vérifie que le nom n'est pas vide et que l'email contient un `@`. `domain/volunteers.errors.ts` définit `SlotError extends AppError` et ses codes. Le test est `domain/slot.spec.ts`.
- **application** : `application/slot.repository.ts` est le port `SlotRepository` : `insert(slot)`, `findById(id)` (le créneau avec son nombre d'inscrits) et `addRegistration(slot, registration)`, qui revérifie la capacité au moment d'écrire et lève `SLOT_FULL` si une autre inscription a pris la dernière place. `application/testing/in-memory-slot.repository.ts` est sa version en mémoire pour les tests. `application/use-cases/open-slot.ts` contient `OpenSlot`, qui vérifie que la discipline existe en appelant le cas d'usage `GetDiscipline` du module Disciplines, puis enregistre le créneau. `application/use-cases/register-volunteer.ts` contient `RegisterVolunteer`, qui charge le créneau, appelle `slot.register()` et enregistre l'inscription. Le test est `application/volunteers.application.spec.ts`.
- **infra** : `infra/volunteers.schema.ts` déclare les tables Drizzle `slots` et `registrations`. `infra/slot.mapper.ts` convertit les lignes en entités et inversement (`toDomain()`, `toRow()`, `registrationToRow()`). `infra/drizzle-slot.repository.ts` implémente le port : `addRegistration` ouvre une transaction, verrouille la ligne du créneau (`SELECT … FOR UPDATE`), recompte les inscriptions et n'insère que s'il reste une place. Son test d'intégration est `infra/drizzle-slot.repository.int.spec.ts`.
- **http** : `http/volunteers.controller.ts` valide les entrées avec les DTO Zod, appelle un cas d'usage et sérialise la réponse. Il expose deux routes :
  - `POST /api/disciplines/:disciplineId/slots` ouvre un créneau dans la discipline. Corps : `startsAt`, `endsAt`, `capacity`. Réponse `201` avec le créneau : `id`, `disciplineId`, `startsAt`, `endsAt`, `capacity`, `registeredCount` (0).
  - `POST /api/slots/:slotId/registrations` inscrit un bénévole. Corps : `name`, `email`. Réponse `201` avec l'inscription (`id`, `slotId`, `name`, `email`, `createdAt`) et l'état du créneau après l'inscription (`slot.capacity`, `slot.registeredCount`).
- **module** : `volunteers.module.ts` relie `SlotRepository` à `DrizzleSlotRepository` et importe `DisciplinesModule`. `disciplines.module.ts` exporte `GetDiscipline`. `apps/api/src/app.module.ts` importe `VolunteersModule`.
- **web** : rien. L'écran est prévu en TR3, et la fausse API du front n'a pas besoin de ces routes tant qu'aucun écran ne les appelle.

## 3. Données

On stocke les créneaux et leurs inscriptions dans deux tables. Migration : `pnpm db:generate --name=create_volunteer_slots`.

- **`slots`** : `id` (uuid, clé primaire), `discipline_id` (uuid, non nul), `starts_at` et `ends_at` (timestamp avec fuseau, précision milliseconde, non nuls), `capacity` (entier, non nul), `created_at`. La clé étrangère `discipline_id → disciplines.id` garantit qu'un créneau appartient à une discipline existante ; elle est en `ON DELETE CASCADE` pour que la suppression d'une discipline, qui existe déjà, ne soit pas bloquée par ses créneaux.
- **`registrations`** : `id` (uuid, clé primaire), `slot_id` (uuid, non nul), `name` (varchar 100), `email` (varchar 254), `created_at`. La clé étrangère `slot_id → slots.id` (`ON DELETE CASCADE`) garantit qu'une inscription vise un créneau existant. Un index sur `slot_id` sert au comptage des inscrits. Il n'y a pas d'unicité sur l'email : le refus du doublon est prévu en TR2.

La règle de capacité n'est pas une contrainte de la base : elle est vérifiée par le domaine, puis revérifiée par le repository sous verrou dans la même transaction que l'insertion.

## 4. Erreurs

Chaque refus de la spec devient une erreur métier (`AppError`) ou un refus de validation des schémas partagés, avec un code stable et un statut HTTP.

| Code                   | Catégorie  | HTTP | Quand                                                                          | Scénario |
| ---------------------- | ---------- | ---- | ------------------------------------------------------------------------------ | -------- |
| `VALIDATION_FAILED`    | VALIDATION | 400  | capacité inférieure à 1 ou non entière, fin égale ou antérieure au début (Zod) | AS2      |
| `DISCIPLINE_NOT_FOUND` | NOT_FOUND  | 404  | aucune discipline n'a cet identifiant ; code existant du module Disciplines    | AS3      |
| `VALIDATION_FAILED`    | VALIDATION | 400  | nom vide ou fait d'espaces, email mal formé (Zod)                              | AS5      |
| `SLOT_FULL`            | CONFLICT   | 409  | le créneau a déjà autant d'inscrits que sa capacité                            | AS6      |
| `SLOT_NOT_FOUND`       | NOT_FOUND  | 404  | aucun créneau n'a cet identifiant                                              | AS7      |

`VALIDATION_FAILED` est produit par `ProblemDetailsFilter` quand un DTO Zod rejette le corps, avec la liste `errors` qui nomme le champ. Le domaine revérifie les mêmes invariants avec ses propres codes (`SLOT_CAPACITY_INVALID`, `SLOT_ENDS_BEFORE_START`, `VOLUNTEER_NAME_REQUIRED`, `VOLUNTEER_EMAIL_INVALID`, catégorie VALIDATION) ; par l'API, c'est toujours le schéma Zod qui refuse en premier.

## 5. Tests par scénario

Chaque scénario de la spec est prouvé par au moins un test, au niveau le plus bas qui suffit, et par le test e2e qui vérifie le statut et le code observés par l'appelant.

| Scénario | Fichier de test                                                                                                       | Niveau                     | Ce que le test vérifie                                                                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AS1      | `domain/slot.spec.ts`, `apps/api/test/volunteers.e2e.spec.ts`                                                         | unitaire, e2e              | le créneau a la discipline, les horaires, la capacité 2 et 0 inscrit ; l'API répond 201 avec ces valeurs                                                                                                          |
| AS2      | `packages/shared/src/volunteers.spec.ts`, `domain/slot.spec.ts`, e2e                                                  | unitaire, e2e              | capacités 0, -1, 1,5 et fin égale ou antérieure au début refusées, capacité 1 acceptée ; l'API répond 400 `VALIDATION_FAILED` avec le champ dans `errors`                                                         |
| AS3      | `application/volunteers.application.spec.ts`, e2e                                                                     | unitaire, e2e              | `DISCIPLINE_NOT_FOUND` et aucun créneau dans le repository ; l'API répond 404 `DISCIPLINE_NOT_FOUND`                                                                                                              |
| AS4      | `application/volunteers.application.spec.ts`, e2e                                                                     | unitaire, e2e              | l'inscription garde le nom et l'email, le créneau compte 1 inscrit sur 2 ; l'API répond 201 avec `slot.registeredCount` à 1                                                                                       |
| AS5      | `packages/shared/src/volunteers.spec.ts`, e2e                                                                         | unitaire, e2e              | nom vide, fait d'espaces ou email mal formé refusés ; l'API répond 400 `VALIDATION_FAILED`, et l'inscription valide suivante compte 1 inscrit                                                                     |
| AS6      | `domain/slot.spec.ts`, `application/volunteers.application.spec.ts`, `infra/drizzle-slot.repository.int.spec.ts`, e2e | unitaire, intégration, e2e | le 2e inscrit est accepté et le 3e refusé (`SLOT_FULL`) avec toujours 2 inscrits ; capacité 1 refuse le 2e ; deux inscriptions simultanées sur la dernière place : une seule passe ; l'API répond 409 `SLOT_FULL` |
| AS7      | `application/volunteers.application.spec.ts`, e2e                                                                     | unitaire, e2e              | `SLOT_NOT_FOUND` et aucune inscription ; l'API répond 404 `SLOT_NOT_FOUND`                                                                                                                                        |

## 6. Tâches

Cinq tâches, dans l'ordre des couches. Chaque tâche nomme le test à écrire d'abord et cite les scénarios qu'elle couvre ; elle tient dans un commit.

- [x] T01 [001-AS2, AS5] Écrire d'abord `packages/shared/src/volunteers.spec.ts` (« 001-AS2: rejects a capacity below 1 or not an integer », « 001-AS5: rejects an empty name or a malformed email »), puis `packages/shared/src/volunteers.ts` et son export dans `index.ts`
- [x] T02 [001-AS1, AS2, AS4, AS6] Écrire d'abord `apps/api/src/modules/volunteers/domain/slot.spec.ts` (« 001-AS1: opens a slot with no registration », « 001-AS6: refuses a registration on a full slot »), puis `domain/slot.ts`, `domain/registration.ts` et `domain/volunteers.errors.ts`
- [x] T03 [001-AS1, AS3, AS4, AS6, AS7] Écrire d'abord `application/volunteers.application.spec.ts` (« 001-AS3: refuses a slot in an unknown discipline », « 001-AS7: refuses a registration on an unknown slot »), puis le port `slot.repository.ts`, `testing/in-memory-slot.repository.ts`, `use-cases/open-slot.ts`, `use-cases/register-volunteer.ts`, et l'export de `GetDiscipline` par `disciplines.module.ts`
- [x] T04 [001-AS1, AS4, AS6] Écrire d'abord `infra/drizzle-slot.repository.int.spec.ts` (« 001-AS6: accepts only one of two simultaneous registrations for the last place »), puis `infra/volunteers.schema.ts`, la migration `pnpm db:generate --name=create_volunteer_slots`, `infra/slot.mapper.ts` et `infra/drizzle-slot.repository.ts`
- [x] T05 [001-AS1, AS2, AS3, AS4, AS5, AS6, AS7] Écrire d'abord `apps/api/test/volunteers.e2e.spec.ts` (« 001-AS6: refuses a third volunteer on a slot of capacity 2 (409 SLOT_FULL) »), puis `http/volunteers.controller.ts`, `volunteers.module.ts` et son import dans `src/app.module.ts`

## 7. Corrections

### Passage 1

- [x] T06 [001-AS2] Écrire d'abord, dans `packages/shared/src/volunteers.spec.ts` et `apps/api/test/volunteers.e2e.spec.ts`, le test « 001-AS2: rejects a capacity above the largest storable value (400 VALIDATION_FAILED) » avec `capacity: 2147483648`, puis borner la capacité à 2147483647 (la valeur maximale d'une colonne `integer`) dans `openSlotSchema` et dans `Slot.create()` (`SLOT_CAPACITY_INVALID`). Preuve du relecteur : `packages/shared/src/volunteers.ts:11` n'a pas de borne haute et `infra/volunteers.schema.ts:14` est un int4 ; l'API répond `500 INTERNAL_ERROR` (« value "2147483648" is out of range for type integer ») au lieu d'un refus 400.

Écart non retenu, à trancher par l'humain : le relecteur signale comme hors périmètre le commit `215aabd` (route `GET /api/disciplines/:id/similaires`). Ce n'est pas un défaut de la spec 001 : c'est la tâche A de l'atelier A, commitée sur la branche après la spec et donc incluse dans le diff depuis la base `c9b80a1^`.

### Passage 2

- [x] T07 [001-AS2] Écrire d'abord, dans `apps/api/src/modules/volunteers/application/volunteers.application.spec.ts`, le test « 001-AS2: rejects an invalid slot and records nothing » : `openSlot.execute(lutte.id, …)` avec une capacité de 0, puis avec une fin égale au début, est rejeté (`SLOT_CAPACITY_INVALID`, `SLOT_ENDS_BEFORE_START`) et `slots.size` vaut 0 ; puis le code, si le test l'exige. Preuve du relecteur : aucun test de AS2 ne vérifie « aucun créneau n'est enregistré » (`application/volunteers.application.spec.ts` n'a pas de cas AS2, `apps/api/test/volunteers.e2e.spec.ts:50-80` ne vérifie que le refus).

Écart toujours ouvert, à trancher par l'humain : le relecteur signale de nouveau comme hors périmètre le commit `215aabd` (route `GET /api/disciplines/:id/similaires`, tâche A de l'atelier A), présent dans le diff depuis la base `c9b80a1^`.

### Décision humaine

Écart `215aabd` accepté comme exception le 2026-11-07 : la route `GET /api/disciplines/:id/similaires` est un exercice indépendant (atelier A) et reste dans l'historique de la branche ; elle ne relève pas de la spec 001.
