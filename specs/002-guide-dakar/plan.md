# 002 — Guide de Dakar : voir l'agenda du jour : plan

**Statut** : Validé

## 1. Résumé

On construit le module `activities` de l'API : il lit les animations enregistrées en base et renvoie l'agenda d'un jour. À la fin des tâches, un visiteur peut demander l'agenda d'une date et recevoir les animations de ce jour triées par heure de début (puis par titre), un agenda vide s'il n'y a rien, un refus `422 ACTIVITY_DATE_OUTSIDE_GAMES` pour une date hors des Jeux et un refus `400 VALIDATION_FAILED` pour une date absente ou mal formée. Le travail tient en cinq tâches, une par couche : schémas partagés, domaine, cas d'usage, persistance avec le jeu de données de démo, puis route HTTP avec ses tests e2e. Le filtre par lieu, l'assistant, la création d'animations et tout écran sont laissés de côté.

Les mots de la spec et leur nom dans le code :

| Dans la spec           | Dans le code                        | Ce que c'est                                                              |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| animation              | `Activity`                          | un événement ouvert aux visiteurs, avec un titre, un lieu et ses horaires |
| titre                  | `title`                             | le nom de l'animation affiché au visiteur                                 |
| lieu                   | `venue`                             | le nom du lieu où se tient l'animation, en texte                          |
| heure de début, de fin | `startsAt`, `endsAt`                | la date et l'heure de début et de fin, à l'heure de Dakar (UTC+0)         |
| agenda du jour         | `ListDailyAgenda`                   | le cas d'usage qui renvoie les animations d'une date, triées              |
| dates des Jeux         | `GAMES_FIRST_DAY`, `GAMES_LAST_DAY` | le 31 octobre et le 13 novembre 2026, tous deux inclus                    |

## 2. Fichiers par couche

On crée le module `activities` dans `apps/api/src/modules/activities/`, organisé comme le module Disciplines : un dossier par couche.

- **shared** : `packages/shared/src/activities.ts` contient les constantes `GAMES_FIRST_DAY` (`2026-10-31`) et `GAMES_LAST_DAY` (`2026-11-13`), le schéma de la requête `dailyAgendaQuerySchema` (`date` obligatoire au format `AAAA-MM-JJ` et existant au calendrier, via `z.iso.date()`), `activitySchema` et `activityListSchema`. Il est exporté par `packages/shared/src/index.ts` et testé par `packages/shared/src/activities.spec.ts`. Le schéma ne vérifie pas la période des Jeux : c'est une règle métier, tenue par le domaine.
- **domain** : `domain/activity.ts` définit l'entité `Activity` : `Activity.restore()` relit une animation de la base (aucune création dans cette tranche, donc pas de `create()`), avec ses getters `id`, `title`, `venue`, `startsAt`, `endsAt`. `domain/agenda.ts` contient les deux règles de la tranche : `assertDuringGames(date)`, qui lève `ACTIVITY_DATE_OUTSIDE_GAMES` hors du 31 octobre au 13 novembre 2026, et `sortAgenda(activities)`, qui trie par heure de début puis par titre. `domain/activities.errors.ts` définit `ActivityError extends AppError` et la fabrique `activityDateOutsideGames(date)`. Le test est `domain/agenda.spec.ts`.
- **application** : `application/activity.repository.ts` est le port `ActivityRepository`, avec une seule méthode `listByDay(date)` qui renvoie les animations qui commencent ce jour-là, sans ordre garanti. `application/testing/in-memory-activity.repository.ts` est sa version en mémoire. `application/use-cases/list-daily-agenda.ts` contient `ListDailyAgenda` : `execute(date)` appelle `assertDuringGames`, puis `listByDay`, puis `sortAgenda`. Le test est `application/activities.application.spec.ts`.
- **infra** : `infra/activities.schema.ts` déclare la table Drizzle `activities`. `infra/activity.mapper.ts` convertit une ligne en entité (`toDomain()`) et inversement (`toRow()`, utilisé par les tests pour insérer). `infra/drizzle-activity.repository.ts` implémente `listByDay` : les animations dont `starts_at` est dans l'intervalle `[date 00:00 UTC, lendemain 00:00 UTC[`. Son test d'intégration est `infra/drizzle-activity.repository.int.spec.ts`. Le jeu de démo est `apps/api/data/activities.json`, chargé par `pnpm db:seed`.
- **http** : `http/activities.controller.ts` valide la requête avec le DTO Zod, appelle `ListDailyAgenda` et sérialise la réponse. Il expose une route :
  - `GET /api/activities?date=2026-11-05` renvoie `200` avec la liste des animations du jour, triée : `id`, `title`, `venue`, `startsAt`, `endsAt` (dates ISO 8601). Liste vide `[]` si le jour n'a aucune animation.
- **module** : `activities.module.ts` relie `ActivityRepository` à `DrizzleActivityRepository`. `apps/api/src/app.module.ts` importe `ActivitiesModule`.
- **web** : rien. Cette tranche s'utilise par l'API ; la fausse API du front n'a pas besoin de cette route tant qu'aucun écran ne l'appelle.

## 3. Données

On stocke les animations dans une table. Migration : `pnpm db:generate --name=create_activities`.

- **`activities`** : `id` (uuid, clé primaire), `title` (varchar 150, non nul), `venue` (varchar 150, non nul), `starts_at` et `ends_at` (timestamp avec fuseau, précision milliseconde, non nuls), `created_at`. Un index sur `starts_at` sert la recherche par jour. Le lieu reste un texte : la liste des lieux connus et le refus d'un lieu inconnu arrivent en TR2.

Une animation qui finit après minuit est rangée au jour de son début, puisque la recherche porte sur `starts_at`. Le jeu de démo `data/activities.json` contient une dizaine d'animations du 31 octobre au 13 novembre 2026, à Diamniadio, à Yoff et à la Place de l'Obélisque, dont plusieurs le même jour.

## 4. Erreurs

Chaque refus de la spec devient une erreur métier (`AppError`) ou un refus de validation du schéma partagé.

| Code                          | Catégorie     | HTTP | Quand                                                                        | Scénario |
| ----------------------------- | ------------- | ---- | ---------------------------------------------------------------------------- | -------- |
| `ACTIVITY_DATE_OUTSIDE_GAMES` | BUSINESS_RULE | 422  | la date est avant le 31 octobre ou après le 13 novembre 2026                 | AS3      |
| `VALIDATION_FAILED`           | VALIDATION    | 400  | `date` absente, mal écrite ou inexistante au calendrier (Zod sur la requête) | AS4      |

Le message de `ACTIVITY_DATE_OUTSIDE_GAMES` rappelle les dates des Jeux, et ses `details` contiennent `date`, `firstDay` et `lastDay`. `VALIDATION_FAILED` est produit par `ProblemDetailsFilter`, avec la liste `errors` qui nomme le champ `date`.

## 5. Tests par scénario

Chaque scénario est prouvé au niveau le plus bas qui suffit, puis par l'e2e qui vérifie le statut et le corps.

| Scénario | Fichier de test                                                                                                             | Niveau                     | Ce que le test vérifie                                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AS1      | `domain/agenda.spec.ts`, `application/activities.application.spec.ts`, `infra/drizzle-activity.repository.int.spec.ts`, e2e | unitaire, intégration, e2e | tri par début puis par titre ; seules les trois animations du 5 novembre, dans l'ordre Marché, Initiation, Concert ; celle du 6 exclue ; 200 avec titre, lieu, début et fin |
| AS2      | `application/activities.application.spec.ts`, e2e                                                                           | unitaire, e2e              | liste vide pour le 8 novembre ; l'API répond 200 `[]`                                                                                                                       |
| AS3      | `domain/agenda.spec.ts`, `application/activities.application.spec.ts`, e2e                                                  | unitaire, e2e              | 30 octobre et 14 novembre refusés (`ACTIVITY_DATE_OUTSIDE_GAMES`), 31 octobre et 13 novembre acceptés ; l'API répond 422 avec le code et les dates des Jeux                 |
| AS4      | `packages/shared/src/activities.spec.ts`, e2e                                                                               | unitaire, e2e              | date absente, « demain », « 2026-13-45 », « 2026-02-30 » refusées ; l'API répond 400 `VALIDATION_FAILED` avec `date` dans `errors`                                          |

## 6. Tâches

Cinq tâches, dans l'ordre des couches. Chaque tâche nomme le test à écrire d'abord et cite les scénarios qu'elle couvre ; elle tient dans un commit.

- [ ] T01 [002-AS4] Écrire d'abord `packages/shared/src/activities.spec.ts` (« 002-AS4: rejects a missing, malformed or impossible date »), puis `packages/shared/src/activities.ts` et son export dans `index.ts`
- [ ] T02 [002-AS1, AS3] Écrire d'abord `apps/api/src/modules/activities/domain/agenda.spec.ts` (« 002-AS1: sorts activities by start time then title », « 002-AS3: rejects a date outside the Games and accepts the first and last days »), puis `domain/activity.ts`, `domain/agenda.ts` et `domain/activities.errors.ts`
- [ ] T03 [002-AS1, AS2, AS3] Écrire d'abord `application/activities.application.spec.ts` (« 002-AS1: lists only the activities of the day, sorted », « 002-AS2: returns an empty agenda for a day without activity »), puis le port `activity.repository.ts`, `testing/in-memory-activity.repository.ts` et `use-cases/list-daily-agenda.ts`
- [ ] T04 [002-AS1, AS2] Écrire d'abord `infra/drizzle-activity.repository.int.spec.ts` (« 002-AS1: finds the activities starting on the given day only »), puis `infra/activities.schema.ts`, la migration `pnpm db:generate --name=create_activities`, `infra/activity.mapper.ts`, `infra/drizzle-activity.repository.ts` et `apps/api/data/activities.json`
- [ ] T05 [002-AS1, AS2, AS3, AS4] Écrire d'abord `apps/api/test/activities.e2e.spec.ts` (« 002-AS3: refuses a date outside the Games (422 ACTIVITY_DATE_OUTSIDE_GAMES) »), puis `http/activities.controller.ts`, `activities.module.ts` et son import dans `src/app.module.ts`
