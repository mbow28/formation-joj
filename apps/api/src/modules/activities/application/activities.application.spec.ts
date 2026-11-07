// Prouve le cas d'usage de l'agenda du jour avec le repository en mémoire (spec 002).
import { describe, expect, it } from 'vitest';
import { Activity } from '../domain/activity';
import { InMemoryActivityRepository } from './testing/in-memory-activity.repository';
import { ListDailyAgenda } from './use-cases/list-daily-agenda';

function activity(title: string, venue: string, startsAt: string, endsAt: string): Activity {
  return Activity.restore({
    id: crypto.randomUUID(),
    title,
    venue,
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
  });
}

function setup() {
  const activities = new InMemoryActivityRepository();
  activities.add(
    activity(
      'Concert de sabar',
      "Place de l'Obélisque",
      '2026-11-05T18:00:00Z',
      '2026-11-05T20:00:00Z',
    ),
    activity(
      'Marché artisanal',
      'Village des Jeux de Diamniadio',
      '2026-11-05T10:00:00Z',
      '2026-11-05T13:00:00Z',
    ),
    activity(
      'Initiation à la lutte',
      'Plage de Yoff',
      '2026-11-05T15:00:00Z',
      '2026-11-05T16:30:00Z',
    ),
    activity('Visite de Gorée', 'Île de Gorée', '2026-11-06T09:00:00Z', '2026-11-06T12:00:00Z'),
  );
  return { listDailyAgenda: new ListDailyAgenda(activities) };
}

describe('activities (application layer)', () => {
  it('002-AS1: lists only the activities of the day, sorted by start time', async () => {
    const { listDailyAgenda } = setup();

    const agenda = await listDailyAgenda.execute('2026-11-05');

    expect(
      agenda.map(({ title, venue, startsAt, endsAt }) => ({ title, venue, startsAt, endsAt })),
    ).toEqual([
      {
        title: 'Marché artisanal',
        venue: 'Village des Jeux de Diamniadio',
        startsAt: new Date('2026-11-05T10:00:00Z'),
        endsAt: new Date('2026-11-05T13:00:00Z'),
      },
      {
        title: 'Initiation à la lutte',
        venue: 'Plage de Yoff',
        startsAt: new Date('2026-11-05T15:00:00Z'),
        endsAt: new Date('2026-11-05T16:30:00Z'),
      },
      {
        title: 'Concert de sabar',
        venue: "Place de l'Obélisque",
        startsAt: new Date('2026-11-05T18:00:00Z'),
        endsAt: new Date('2026-11-05T20:00:00Z'),
      },
    ]);
  });

  it('002-AS2: returns an empty agenda for a day without activity', async () => {
    const { listDailyAgenda } = setup();

    await expect(listDailyAgenda.execute('2026-11-08')).resolves.toEqual([]);
  });

  it.each(['2026-10-30', '2026-11-14'])(
    '002-AS3: refuses the agenda of a date outside the Games (%s)',
    async (date) => {
      const { listDailyAgenda } = setup();

      await expect(listDailyAgenda.execute(date)).rejects.toMatchObject({
        code: 'ACTIVITY_DATE_OUTSIDE_GAMES',
      });
    },
  );

  it.each(['2026-10-31', '2026-11-13'])(
    '002-AS3: accepts the first and the last day of the Games (%s)',
    async (date) => {
      const { listDailyAgenda } = setup();

      await expect(listDailyAgenda.execute(date)).resolves.toEqual([]);
    },
  );
});
