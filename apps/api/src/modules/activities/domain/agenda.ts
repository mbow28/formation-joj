import { GAMES_FIRST_DAY, GAMES_LAST_DAY } from '@joj/shared';
import { activityDateOutsideGames } from './activities.errors';
import type { Activity } from './activity';

/**
 * L'agenda n'existe que pendant les Jeux, premier et dernier jour inclus. La date est au format
 * AAAA-MM-JJ (validée en amont) : l'ordre des chaînes est celui du calendrier.
 */
export function assertDuringGames(date: string): void {
  if (date < GAMES_FIRST_DAY || date > GAMES_LAST_DAY) throw activityDateOutsideGames(date);
}

/** L'agenda se lit dans l'ordre où les animations commencent ; à égalité, par titre. */
export function sortAgenda(activities: readonly Activity[]): Activity[] {
  return [...activities].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.title.localeCompare(b.title, 'fr'),
  );
}
