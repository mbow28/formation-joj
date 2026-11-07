// Prouve que le repository Drizzle retrouve les animations qui commencent un jour donné (spec 002).
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { Activity } from '../domain/activity';
import { activities } from './activities.schema';
import { toRow } from './activity.mapper';
import { DrizzleActivityRepository } from './drizzle-activity.repository';

function activity(title: string, startsAt: string, endsAt: string): Activity {
  return Activity.restore({
    id: randomUUID(),
    title,
    venue: 'Village des Jeux de Diamniadio',
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
  });
}

describe('DrizzleActivityRepository (in-memory PGlite, migrations applied)', () => {
  let connection: DatabaseConnection;
  let repository: DrizzleActivityRepository;

  const sameDay = [
    activity('Marché artisanal', '2026-11-05T10:00:00.000Z', '2026-11-05T13:00:00.000Z'),
    activity('Lever de soleil', '2026-11-05T00:00:00.000Z', '2026-11-05T01:00:00.000Z'),
    // Finit après minuit : appartient au jour de son début.
    activity('Soirée mbalax', '2026-11-05T23:30:00.000Z', '2026-11-06T02:00:00.000Z'),
  ];
  const otherDays = [
    activity('Veillée', '2026-11-04T23:59:59.999Z', '2026-11-05T01:00:00.000Z'),
    activity('Visite de Gorée', '2026-11-06T00:00:00.000Z', '2026-11-06T03:00:00.000Z'),
  ];

  beforeAll(async () => {
    connection = openDatabase({ pgliteDataDir: 'memory://' });
    await connection.migrate();
    repository = new DrizzleActivityRepository(connection.db);
    await connection.db.insert(activities).values([...sameDay, ...otherDays].map(toRow));
  });

  afterAll(() => connection?.close());

  it('002-AS1: finds the activities starting on the given day only, with their fields', async () => {
    const found = await repository.listByDay('2026-11-05');

    const byTitle = (a: Activity, b: Activity) => a.title.localeCompare(b.title);
    expect(
      found.sort(byTitle).map(({ id, title, venue, startsAt, endsAt }) => ({
        id,
        title,
        venue,
        startsAt,
        endsAt,
      })),
    ).toEqual(
      [...sameDay].sort(byTitle).map(({ id, title, venue, startsAt, endsAt }) => ({
        id,
        title,
        venue,
        startsAt,
        endsAt,
      })),
    );
  });

  it('002-AS2: finds nothing on a day without activity', async () => {
    await expect(repository.listByDay('2026-11-08')).resolves.toEqual([]);
  });
});
