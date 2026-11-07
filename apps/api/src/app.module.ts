import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { DisciplinesModule } from './modules/disciplines/disciplines.module';
import { VolunteersModule } from './modules/volunteers/volunteers.module';

@Module({
  imports: [CoreModule, DisciplinesModule, VolunteersModule, ActivitiesModule],
})
export class AppModule {}
