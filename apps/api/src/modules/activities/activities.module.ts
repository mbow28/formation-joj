import { Module } from '@nestjs/common';
import { ActivityRepository } from './application/activity.repository';
import { ListDailyAgenda } from './application/use-cases/list-daily-agenda';
import { ActivitiesController } from './http/activities.controller';
import { DrizzleActivityRepository } from './infra/drizzle-activity.repository';

@Module({
  controllers: [ActivitiesController],
  providers: [
    // Le port (classe abstraite) est relié ici à son implémentation Drizzle.
    { provide: ActivityRepository, useClass: DrizzleActivityRepository },
    ListDailyAgenda,
  ],
})
export class ActivitiesModule {}
