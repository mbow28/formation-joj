// Prouve que les schémas partagés refusent un créneau ou une inscription invalides (spec 001).
import { describe, expect, it } from 'vitest';
import { openSlotSchema, registerVolunteerSchema } from './volunteers.ts';

const slot = {
  startsAt: '2026-11-03T09:00:00.000Z',
  endsAt: '2026-11-03T12:00:00.000Z',
  capacity: 2,
};

describe('openSlotSchema', () => {
  it.each([0, -1, 1.5])(
    '001-AS2: rejects a capacity below 1 or not an integer (%j)',
    (capacity) => {
      const result = openSlotSchema.safeParse({ ...slot, capacity });
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['capacity']);
    },
  );

  it.each([slot.startsAt, '2026-11-03T08:00:00.000Z'])(
    '001-AS2: rejects an end equal to or before the start (%s)',
    (endsAt) => {
      const result = openSlotSchema.safeParse({ ...slot, endsAt });
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['endsAt']);
    },
  );

  it('001-AS2: rejects a capacity above the largest storable value', () => {
    const result = openSlotSchema.safeParse({ ...slot, capacity: 2_147_483_648 });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['capacity']);
    expect(openSlotSchema.parse({ ...slot, capacity: 2_147_483_647 }).capacity).toBe(2_147_483_647);
  });

  it('001-AS2: accepts a capacity of 1', () => {
    expect(openSlotSchema.parse({ ...slot, capacity: 1 })).toEqual({ ...slot, capacity: 1 });
  });
});

describe('registerVolunteerSchema', () => {
  it.each([
    { name: '', email: 'awa.diop@example.sn', path: 'name' },
    { name: '   ', email: 'awa.diop@example.sn', path: 'name' },
    { name: 'Awa Diop', email: 'awa.diop', path: 'email' },
  ])('001-AS5: rejects an empty name or a malformed email ($path)', ({ path, ...body }) => {
    const result = registerVolunteerSchema.safeParse(body);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual([path]);
  });

  it('001-AS5: accepts a name and an email, and trims the name', () => {
    expect(
      registerVolunteerSchema.parse({ name: ' Awa Diop ', email: 'awa.diop@example.sn' }),
    ).toEqual({ name: 'Awa Diop', email: 'awa.diop@example.sn' });
  });
});
