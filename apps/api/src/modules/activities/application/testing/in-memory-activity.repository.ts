import { Activity } from '../../domain/activity';
import { ActivityRepository } from '../activity.repository';

/** Fake fidèle au contrat du port, sans base : jour de début en UTC, sans ordre garanti. */
export class InMemoryActivityRepository extends ActivityRepository {
  private readonly activities: Activity[] = [];

  /** Remplit le fake : la création d'animations n'existe pas dans l'application. */
  add(...activities: Activity[]): void {
    this.activities.push(...activities);
  }

  async listByDay(date: string): Promise<Activity[]> {
    return this.activities
      .filter((activity) => activity.startsAt.toISOString().slice(0, 10) === date)
      .map((activity) =>
        Activity.restore({
          id: activity.id,
          title: activity.title,
          venue: activity.venue,
          startsAt: activity.startsAt,
          endsAt: activity.endsAt,
        }),
      );
  }
}
