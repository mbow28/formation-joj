// Prouve par l'API ce que l'appelant observe : statuts, codes d'erreur et nombre d'inscrits (spec 001).
import type { INestApplication } from '@nestjs/common';
import { disciplineSchema, registrationSchema, slotSchema, type SlotResponse } from '@joj/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-test-app';

const UNKNOWN_ID = '0199f5c2-0000-7000-8000-00000000ffff';
const SLOT = {
  startsAt: '2026-11-03T09:00:00.000Z',
  endsAt: '2026-11-03T12:00:00.000Z',
  capacity: 2,
};
const awa = { name: 'Awa Diop', email: 'awa.diop@example.sn' };
const moussa = { name: 'Moussa Fall', email: 'moussa.fall@example.sn' };
const fatou = { name: 'Fatou Sow', email: 'fatou.sow@example.sn' };

describe('slots and registrations (e2e)', () => {
  let app: INestApplication;
  let disciplineId: string;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    const response = await api()
      .post('/api/disciplines')
      .send({ name: 'Lutte', category: 'sports-de-combat' })
      .expect(201);
    disciplineId = disciplineSchema.parse(response.body).id;
  });

  afterAll(() => app?.close());

  async function openSlot(capacity = 2): Promise<SlotResponse> {
    const response = await api()
      .post(`/api/disciplines/${disciplineId}/slots`)
      .send({ ...SLOT, capacity })
      .expect(201);
    return slotSchema.parse(response.body);
  }

  const register = (slotId: string, body: object) =>
    api().post(`/api/slots/${slotId}/registrations`).send(body);

  it('001-AS1: opens a slot (201) with its schedule, its capacity and no registration', async () => {
    const slot = await openSlot();
    expect(slot).toMatchObject({ disciplineId, ...SLOT, registeredCount: 0 });
  });

  it.each([
    { body: { ...SLOT, capacity: 0 }, path: 'capacity' },
    { body: { ...SLOT, capacity: -1 }, path: 'capacity' },
    { body: { ...SLOT, capacity: 1.5 }, path: 'capacity' },
    { body: { ...SLOT, endsAt: SLOT.startsAt }, path: 'endsAt' },
    { body: { ...SLOT, endsAt: '2026-11-03T08:00:00.000Z' }, path: 'endsAt' },
  ])('001-AS2: rejects an invalid slot (400 VALIDATION_FAILED, $path)', async ({ body, path }) => {
    const response = await api()
      .post(`/api/disciplines/${disciplineId}/slots`)
      .send(body)
      .expect(400);

    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path })]);
  });

  it('001-AS2: rejects a capacity above the largest storable value (400 VALIDATION_FAILED)', async () => {
    const response = await api()
      .post(`/api/disciplines/${disciplineId}/slots`)
      .send({ ...SLOT, capacity: 2_147_483_648 })
      .expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path: 'capacity' })]);
  });

  it('001-AS2: accepts a capacity of 1', async () => {
    expect((await openSlot(1)).capacity).toBe(1);
  });

  it('001-AS3: refuses a slot in an unknown discipline (404 DISCIPLINE_NOT_FOUND)', async () => {
    const response = await api()
      .post(`/api/disciplines/${UNKNOWN_ID}/slots`)
      .send(SLOT)
      .expect(404);
    expect(response.body).toMatchObject({ status: 404, code: 'DISCIPLINE_NOT_FOUND' });
  });

  it('001-AS4: registers a volunteer (201), and the slot counts 1 registered out of 2', async () => {
    const slot = await openSlot();

    const response = await register(slot.id, awa).expect(201);

    expect(registrationSchema.parse(response.body)).toMatchObject({
      slotId: slot.id,
      ...awa,
      slot: { capacity: 2, registeredCount: 1 },
    });
  });

  it.each([
    { body: { ...awa, name: '' }, path: 'name' },
    { body: { ...awa, name: '   ' }, path: 'name' },
    { body: { ...awa, email: 'awa.diop' }, path: 'email' },
  ])(
    '001-AS5: rejects an incomplete registration (400 VALIDATION_FAILED, $path) and keeps the count',
    async ({ body, path }) => {
      const slot = await openSlot();

      const response = await register(slot.id, body).expect(400);
      expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
      expect(response.body.errors).toEqual([expect.objectContaining({ path })]);

      const next = await register(slot.id, awa).expect(201);
      expect(next.body.slot).toEqual({ capacity: 2, registeredCount: 1 });
    },
  );

  it('001-AS6: refuses a third volunteer on a slot of capacity 2 (409 SLOT_FULL)', async () => {
    const slot = await openSlot(2);
    await register(slot.id, awa).expect(201);
    // Le deuxième prend la dernière place : accepté.
    const second = await register(slot.id, moussa).expect(201);
    expect(second.body.slot).toEqual({ capacity: 2, registeredCount: 2 });

    const response = await register(slot.id, fatou).expect(409);
    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({ status: 409, code: 'SLOT_FULL' });
  });

  it('001-AS6: refuses the second volunteer on a slot of capacity 1 (409 SLOT_FULL)', async () => {
    const slot = await openSlot(1);
    await register(slot.id, awa).expect(201);

    const response = await register(slot.id, moussa).expect(409);
    expect(response.body).toMatchObject({ status: 409, code: 'SLOT_FULL' });
  });

  it('001-AS7: refuses a registration on an unknown slot (404 SLOT_NOT_FOUND)', async () => {
    const response = await register(UNKNOWN_ID, awa).expect(404);
    expect(response.body).toMatchObject({ status: 404, code: 'SLOT_NOT_FOUND' });
  });
});
