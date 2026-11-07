// Prouve que le repository Drizzle relit un créneau avec ses inscrits et tient la capacité, même en concurrence.
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { Discipline } from '../../disciplines/domain/discipline';
import { DrizzleDisciplineRepository } from '../../disciplines/infra/drizzle-discipline.repository';
import { Slot } from '../domain/slot';
import { DrizzleSlotRepository } from './drizzle-slot.repository';

const NOW = new Date('2026-10-31T09:00:00.123Z');

describe('DrizzleSlotRepository (in-memory PGlite, migrations applied)', () => {
  let connection: DatabaseConnection;
  let repository: DrizzleSlotRepository;
  let disciplineId: string;

  beforeAll(async () => {
    connection = openDatabase({ pgliteDataDir: 'memory://' });
    await connection.migrate();
    repository = new DrizzleSlotRepository(connection.db);
    const lutte = Discipline.create({
      id: randomUUID(),
      name: 'Lutte',
      category: 'sports-de-combat',
      now: NOW,
    });
    await new DrizzleDisciplineRepository(connection.db).insert(lutte);
    disciplineId = lutte.id;
  });

  afterAll(() => connection?.close());

  async function openSlot(capacity: number): Promise<Slot> {
    const slot = Slot.create({
      id: randomUUID(),
      disciplineId,
      startsAt: new Date('2026-11-03T09:00:00.000Z'),
      endsAt: new Date('2026-11-03T12:00:00.000Z'),
      capacity,
      now: NOW,
    });
    await repository.insert(slot);
    return slot;
  }

  const volunteer = (name: string) => ({
    id: randomUUID(),
    name,
    email: `${name.toLowerCase()}@example.sn`,
    now: NOW,
  });

  it('001-AS1: reads back exactly the slot it wrote, with no registration', async () => {
    const slot = await openSlot(2);

    expect(await repository.findById(slot.id)).toEqual(slot);
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('001-AS4: counts a written registration', async () => {
    const slot = await openSlot(2);
    await repository.addRegistration(slot, slot.register(volunteer('Awa')));

    expect(await repository.findById(slot.id)).toMatchObject({ capacity: 2, registeredCount: 1 });
  });

  it('001-AS6: refuses a registration when the slot filled up since it was read', async () => {
    const slot = await openSlot(1);
    const stale = (await repository.findById(slot.id))!;
    await repository.addRegistration(slot, slot.register(volunteer('Awa')));

    await expect(
      repository.addRegistration(stale, stale.register(volunteer('Moussa'))),
    ).rejects.toMatchObject({ code: 'SLOT_FULL' });
    expect(await repository.findById(slot.id)).toMatchObject({ registeredCount: 1 });
  });

  it('001-AS6: accepts only one of two simultaneous registrations for the last place', async () => {
    const slot = await openSlot(2);
    await repository.addRegistration(slot, slot.register(volunteer('Awa')));
    const first = (await repository.findById(slot.id))!;
    const second = (await repository.findById(slot.id))!;

    const results = await Promise.allSettled([
      repository.addRegistration(first, first.register(volunteer('Moussa'))),
      repository.addRegistration(second, second.register(volunteer('Fatou'))),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: { code: 'SLOT_FULL' },
    });
    expect(await repository.findById(slot.id)).toMatchObject({ registeredCount: 2 });
  });
});
