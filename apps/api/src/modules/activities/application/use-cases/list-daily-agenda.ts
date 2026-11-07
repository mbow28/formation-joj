import { Injectable } from '@nestjs/common';
import type { Activity } from '../../domain/activity';
import { assertDuringGames, sortAgenda } from '../../domain/agenda';
import { ActivityRepository } from '../activity.repository';

/** L'agenda d'un jour des Jeux : ses animations, dans l'ordre où elles commencent. */
@Injectable()
export class ListDailyAgenda {
  constructor(private readonly activities: ActivityRepository) {}

  async execute(date: string): Promise<Activity[]> {
    assertDuringGames(date);
    return sortAgenda(await this.activities.listByDay(date));
  }
}
