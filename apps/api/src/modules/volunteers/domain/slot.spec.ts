// Prouve les règles du créneau : capacité, horaires, et jamais plus d'inscrits que la capacité.
import { describe, expect, it } from 'vitest';
import { Slot } from './slot';

const NOW = new Date('2026-10-31T09:00:00.000Z');
const SLOT_ID = '0199f5c2-0000-7000-8000-000000000001';
const DISCIPLINE_ID = '0199f5c2-0000-7000-8000-000000000002';
const STARTS_AT = new Date('2026-11-03T09:00:00.000Z');
const ENDS_AT = new Date('2026-11-03T12:00:00.000Z');

function openSlot(overrides: Partial<{ capacity: number; endsAt: Date }> = {}): Slot {
  return Slot.create({
    id: SLOT_ID,
    disciplineId: DISCIPLINE_ID,
    startsAt: STARTS_AT,
    endsAt: overrides.endsAt ?? ENDS_AT,
    capacity: overrides.capacity ?? 2,
    now: NOW,
  });
}

let nextId = 10;
function volunteer(name: string) {
  nextId += 1;
  return {
    id: `0199f5c2-0000-7000-8000-0000000000${nextId}`,
    name,
    email: `${name.toLowerCase()}@example.sn`,
    now: NOW,
  };
}

describe('Slot', () => {
  it('001-AS1: opens a slot with no registration', () => {
    expect(openSlot()).toMatchObject({
      id: SLOT_ID,
      disciplineId: DISCIPLINE_ID,
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      capacity: 2,
      registeredCount: 0,
      createdAt: NOW,
    });
  });

  it.each([0, -1, 1.5])(
    '001-AS2: rejects a capacity below 1 or not an integer (%j)',
    (capacity) => {
      expect(() => openSlot({ capacity })).toThrow(
        expect.objectContaining({ code: 'SLOT_CAPACITY_INVALID', kind: 'VALIDATION' }),
      );
    },
  );

  it.each([STARTS_AT, new Date('2026-11-03T08:00:00.000Z')])(
    '001-AS2: rejects an end equal to or before the start (%s)',
    (endsAt) => {
      expect(() => openSlot({ endsAt })).toThrow(
        expect.objectContaining({ code: 'SLOT_ENDS_BEFORE_START', kind: 'VALIDATION' }),
      );
    },
  );

  it('001-AS2: accepts a capacity of 1', () => {
    expect(openSlot({ capacity: 1 }).capacity).toBe(1);
  });

  it('001-AS4: registers a volunteer with a name and an email', () => {
    const slot = openSlot();
    const registration = slot.register({ ...volunteer('Awa'), name: ' Awa Diop ' });

    expect(registration).toMatchObject({
      slotId: SLOT_ID,
      name: 'Awa Diop',
      email: 'awa@example.sn',
      createdAt: NOW,
    });
    expect(slot.registeredCount).toBe(1);
  });

  it('001-AS6: refuses a registration on a full slot', () => {
    const slot = openSlot({ capacity: 2 });
    slot.register(volunteer('Awa'));
    // Le deuxième prend la dernière place : accepté.
    slot.register(volunteer('Moussa'));

    expect(() => slot.register(volunteer('Fatou'))).toThrow(
      expect.objectContaining({ code: 'SLOT_FULL', kind: 'CONFLICT' }),
    );
    expect(slot.registeredCount).toBe(2);
  });

  it('001-AS6: refuses the second volunteer on a slot of capacity 1', () => {
    const slot = openSlot({ capacity: 1 });
    slot.register(volunteer('Awa'));

    expect(() => slot.register(volunteer('Moussa'))).toThrow(
      expect.objectContaining({ code: 'SLOT_FULL' }),
    );
    expect(slot.registeredCount).toBe(1);
  });
});
