import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { activitySchema, type ActivityResponse, dailyAgendaQuerySchema } from '@joj/shared';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';
import { ListDailyAgenda } from '../application/use-cases/list-daily-agenda';
import type { Activity } from '../domain/activity';

class DailyAgendaQueryDto extends createZodDto(dailyAgendaQuerySchema) {}
class ActivityDto extends createZodDto(activitySchema) {}

/** Couche fine : valider (DTO zod), appeler un cas d'usage, sérialiser. Aucune règle métier ici. */
@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly listDailyAgenda: ListDailyAgenda) {}

  @Get()
  @ZodSerializerDto([ActivityDto])
  async agenda(@Query() { date }: DailyAgendaQueryDto): Promise<ActivityResponse[]> {
    return (await this.listDailyAgenda.execute(date)).map(toResponse);
  }
}

function toResponse(activity: Activity): ActivityResponse {
  return {
    id: activity.id,
    title: activity.title,
    venue: activity.venue,
    startsAt: activity.startsAt.toISOString(),
    endsAt: activity.endsAt.toISOString(),
  };
}
