import { z } from 'zod';

/** Premier et dernier jour des Jeux, inclus ; l'agenda n'existe que pour ces dates. */
export const GAMES_FIRST_DAY = '2026-10-31';
export const GAMES_LAST_DAY = '2026-11-13';

/**
 * Requête de `GET /api/activities?date=AAAA-MM-JJ` : une date qui existe au calendrier.
 * La période des Jeux est une règle métier, vérifiée par le domaine.
 */
export const dailyAgendaQuerySchema = z.object({ date: z.iso.date() });
export type DailyAgendaQuery = z.infer<typeof dailyAgendaQuerySchema>;

/** Une animation telle que l'API la renvoie. */
export const activitySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  venue: z.string(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
});
export type ActivityResponse = z.infer<typeof activitySchema>;

/** L'agenda d'un jour, trié par heure de début puis par titre. */
export const activityListSchema = z.array(activitySchema);
