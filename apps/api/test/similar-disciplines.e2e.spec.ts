import type { INestApplication } from '@nestjs/common';
import { disciplineListSchema, disciplineSchema, type DisciplineResponse } from '@joj/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-test-app';

const UNKNOWN_ID = '0199f5c2-0000-7000-8000-00000000ffff';

describe('/api/disciplines/:id/similaires (e2e)', () => {
  let app: INestApplication;
  const api = () => request(app.getHttpServer());

  async function create(name: string, category: string): Promise<DisciplineResponse> {
    const response = await api().post('/api/disciplines').send({ name, category }).expect(201);
    return disciplineSchema.parse(response.body);
  }

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(() => app?.close());

  it('lists the other disciplines of the same category, sorted by name (200)', async () => {
    const lutte = await create('Lutte', 'sports-de-combat');
    const taekwondo = await create('Taekwondo', 'sports-de-combat');
    const judo = await create('Judo', 'sports-de-combat');
    await create('Natation', 'sports-nautiques');

    const response = await api().get(`/api/disciplines/${lutte.id}/similaires`).expect(200);

    expect(disciplineListSchema.parse(response.body)).toEqual([judo, taekwondo]);
  });

  it('answers 404 for an unknown discipline', async () => {
    const response = await api().get(`/api/disciplines/${UNKNOWN_ID}/similaires`).expect(404);
    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({ status: 404, code: 'DISCIPLINE_NOT_FOUND' });
  });

  it('rejects an id that is not a UUID (400)', async () => {
    const response = await api().get('/api/disciplines/pas-un-uuid/similaires').expect(400);
    expect(response.body).toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});
