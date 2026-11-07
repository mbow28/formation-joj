import type { Activity } from '../domain/activity';

/**
 * Port de persistance : ce dont les cas d'usage ont besoin, rien de plus.
 * Implémenté par DrizzleActivityRepository (infra) et InMemoryActivityRepository (tests).
 */
export abstract class ActivityRepository {
  /**
   * Les animations qui commencent le jour `date` (AAAA-MM-JJ, heure de Dakar = UTC), sans ordre
   * garanti : le tri est une règle du domaine.
   */
  abstract listByDay(date: string): Promise<Activity[]>;
}
