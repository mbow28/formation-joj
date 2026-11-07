// Prouve par l'API ce que le visiteur observe : l'agenda d'un jour, ses refus et leurs codes (spec 002).
import type { INestApplication } from '@nestjs/common';
import { activityListSchema } from '@joj/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../src/core/database/database';
import { DATABASE } from '../src/core/database/database.module';
import { activities } from '../src/modules/activities/infra/activities.schema';
import { createTestApp } from './create-test-app';

// Créer une animation est hors périmètre : le test écrit directement en base, comme le seed.
const ACTIVITIES = [
  {
    id: '0199f5c3-0000-7000-8000-000000000101',
    title: 'Concert de sabar',
    venue: "Place de l'Obélisque",
    startsAt: '2026-11-05T18:00:00.000Z',
    endsAt: '2026-11-05T20:00:00.000Z',
  },
  {
    id: '0199f5c3-0000-7000-8000-000000000102',
    title: 'Marché artisanal',
    venue: 'Village des Jeux de Diamniadio',
    startsAt: '2026-11-05T10:00:00.000Z',
    endsAt: '2026-11-05T13:00:00.000Z',
  },
  {
    id: '0199f5c3-0000-7000-8000-000000000103',
    title: 'Initiation à la lutte',
    venue: 'Plage de Yoff',
    startsAt: '2026-11-05T15:00:00.000Z',
    endsAt: '2026-11-05T16:30:00.000Z',
  },
  {
    id: '0199f5c3-0000-7000-8000-000000000104',
    title: 'Visite de Gorée',
    venue: 'Île de Gorée',
    startsAt: '2026-11-06T09:00:00.000Z',
    endsAt: '2026-11-06T12:00:00.000Z',
  },
] as const;
const [concert, marche, lutte] = ACTIVITIES;

describe('daily agenda (e2e)', () => {
  let app: INestApplication;
  const agenda = (query: { date?: string }) =>
    request(app.getHttpServer()).get('/api/activities').query(query);

  beforeAll(async () => {
    app = await createTestApp();
    await app
      .get<Database>(DATABASE)
      .insert(activities)
      .values(
        ACTIVITIES.map((a) => ({
          ...a,
          startsAt: new Date(a.startsAt),
          endsAt: new Date(a.endsAt),
        })),
      );
  });

  afterAll(() => app?.close());

  it('002-AS1: returns the three activities of the day, sorted by start time (200)', async () => {
    const response = await agenda({ date: '2026-11-05' }).expect(200);

    expect(activityListSchema.parse(response.body)).toEqual([marche, lutte, concert]);
  });

  it('002-AS2: returns an empty agenda for a day without activity (200)', async () => {
    const response = await agenda({ date: '2026-11-08' }).expect(200);

    expect(response.body).toEqual([]);
  });

  it.each(['2026-10-30', '2026-11-14'])(
    '002-AS3: refuses a date outside the Games (422 ACTIVITY_DATE_OUTSIDE_GAMES, %s)',
    async (date) => {
      const response = await agenda({ date }).expect(422);

      expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(response.body).toMatchObject({
        status: 422,
        code: 'ACTIVITY_DATE_OUTSIDE_GAMES',
        details: { date, firstDay: '2026-10-31', lastDay: '2026-11-13' },
      });
      expect(response.body.detail).toContain('2026-10-31');
      expect(response.body.detail).toContain('2026-11-13');
    },
  );

  it.each(['2026-10-31', '2026-11-13'])(
    '002-AS3: accepts the first and the last day of the Games (200, %s)',
    async (date) => {
      const response = await agenda({ date }).expect(200);

      expect(activityListSchema.parse(response.body)).toEqual([]);
    },
  );

  it.each([{}, { date: 'demain' }, { date: '2026-13-45' }, { date: '2026-02-30' }])(
    '002-AS4: rejects a missing or malformed date (400 VALIDATION_FAILED, %j)',
    async (query) => {
      const response = await agenda(query).expect(400);

      expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
      expect(response.body.errors).toEqual([expect.objectContaining({ path: 'date' })]);
    },
  );
});
