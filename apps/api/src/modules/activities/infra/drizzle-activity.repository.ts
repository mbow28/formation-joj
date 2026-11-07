import { Inject, Injectable } from '@nestjs/common';
import { and, gte, lt } from 'drizzle-orm';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { ActivityRepository } from '../application/activity.repository';
import type { Activity } from '../domain/activity';
import { activities } from './activities.schema';
import { toDomain } from './activity.mapper';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DrizzleActivityRepository extends ActivityRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async listByDay(date: string): Promise<Activity[]> {
    // Un jour à Dakar = [minuit UTC, minuit UTC du lendemain[ ; seul le début compte.
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const nextDayStart = new Date(dayStart.getTime() + DAY_MS);
    const rows = await this.db
      .select()
      .from(activities)
      .where(and(gte(activities.startsAt, dayStart), lt(activities.startsAt, nextDayStart)));
    return rows.map(toDomain);
  }
}
