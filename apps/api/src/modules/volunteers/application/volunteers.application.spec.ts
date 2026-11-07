// Prouve les cas d'usage des créneaux avec des repositories en mémoire : ouvrir, s'inscrire, refuser.
import { describe, expect, it } from 'vitest';
import { InMemoryDisciplineRepository } from '../../disciplines/application/testing/in-memory-discipline.repository';
import { GetDiscipline } from '../../disciplines/application/use-cases/get-discipline';
import { Discipline } from '../../disciplines/domain/discipline';
import { InMemorySlotRepository } from './testing/in-memory-slot.repository';
import { OpenSlot } from './use-cases/open-slot';
import { RegisterVolunteer } from './use-cases/register-volunteer';

const UNKNOWN_ID = '0199f5c2-0000-7000-8000-00000000ffff';
const SLOT = {
  startsAt: '2026-11-03T09:00:00.000Z',
  endsAt: '2026-11-03T12:00:00.000Z',
  capacity: 2,
};

async function setup() {
  const disciplines = new InMemoryDisciplineRepository();
  const lutte = Discipline.create({
    id: '0199f5c2-0000-7000-8000-000000000001',
    name: 'Lutte',
    category: 'sports-de-combat',
    now: new Date(),
  });
  await disciplines.insert(lutte);
  const slots = new InMemorySlotRepository();
  return {
    lutte,
    slots,
    openSlot: new OpenSlot(slots, new GetDiscipline(disciplines)),
    registerVolunteer: new RegisterVolunteer(slots),
  };
}

const awa = { name: 'Awa Diop', email: 'awa.diop@example.sn' };
const moussa = { name: 'Moussa Fall', email: 'moussa.fall@example.sn' };
const fatou = { name: 'Fatou Sow', email: 'fatou.sow@example.sn' };

describe('volunteers (application layer)', () => {
  it('001-AS1: opens a slot in a discipline, with no registration', async () => {
    const { lutte, slots, openSlot } = await setup();

    const slot = await openSlot.execute(lutte.id, SLOT);

    expect(slot).toMatchObject({
      disciplineId: lutte.id,
      startsAt: new Date(SLOT.startsAt),
      endsAt: new Date(SLOT.endsAt),
      capacity: 2,
      registeredCount: 0,
    });
    expect(await slots.findById(slot.id)).toEqual(slot);
  });

  it('001-AS2: rejects an invalid slot and records nothing', async () => {
    const { lutte, slots, openSlot } = await setup();

    await expect(openSlot.execute(lutte.id, { ...SLOT, capacity: 0 })).rejects.toMatchObject({
      code: 'SLOT_CAPACITY_INVALID',
      kind: 'VALIDATION',
    });
    await expect(
      openSlot.execute(lutte.id, { ...SLOT, endsAt: SLOT.startsAt }),
    ).rejects.toMatchObject({ code: 'SLOT_ENDS_BEFORE_START', kind: 'VALIDATION' });
    expect(slots.size).toBe(0);
  });

  it('001-AS3: refuses a slot in an unknown discipline', async () => {
    const { slots, openSlot } = await setup();

    await expect(openSlot.execute(UNKNOWN_ID, SLOT)).rejects.toMatchObject({
      code: 'DISCIPLINE_NOT_FOUND',
      kind: 'NOT_FOUND',
    });
    expect(slots.size).toBe(0);
  });

  it('001-AS4: registers a volunteer, and the slot counts 1 registered out of 2', async () => {
    const { lutte, slots, openSlot, registerVolunteer } = await setup();
    const { id } = await openSlot.execute(lutte.id, SLOT);

    const { registration, slot } = await registerVolunteer.execute(id, awa);

    expect(registration).toMatchObject({ slotId: id, ...awa });
    expect(slot).toMatchObject({ capacity: 2, registeredCount: 1 });
    expect(await slots.findById(id)).toMatchObject({ registeredCount: 1 });
  });

  it('001-AS6: refuses a third volunteer on a slot of capacity 2, which keeps 2 registered', async () => {
    const { lutte, slots, openSlot, registerVolunteer } = await setup();
    const { id } = await openSlot.execute(lutte.id, SLOT);
    await registerVolunteer.execute(id, awa);
    await registerVolunteer.execute(id, moussa);

    await expect(registerVolunteer.execute(id, fatou)).rejects.toMatchObject({
      code: 'SLOT_FULL',
      kind: 'CONFLICT',
    });
    expect(await slots.findById(id)).toMatchObject({ registeredCount: 2 });
  });

  it('001-AS6: accepts only one of two simultaneous registrations for the last place', async () => {
    const { lutte, slots, openSlot, registerVolunteer } = await setup();
    const { id } = await openSlot.execute(lutte.id, SLOT);
    await registerVolunteer.execute(id, awa);

    const results = await Promise.allSettled([
      registerVolunteer.execute(id, moussa),
      registerVolunteer.execute(id, fatou),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: { code: 'SLOT_FULL' },
    });
    expect(await slots.findById(id)).toMatchObject({ registeredCount: 2 });
  });

  it('001-AS7: refuses a registration on an unknown slot', async () => {
    const { slots, registerVolunteer } = await setup();

    await expect(registerVolunteer.execute(UNKNOWN_ID, awa)).rejects.toMatchObject({
      code: 'SLOT_NOT_FOUND',
      kind: 'NOT_FOUND',
    });
    expect(slots.registrationCount).toBe(0);
  });
});
