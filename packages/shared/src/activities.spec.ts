// Prouve que le schéma partagé refuse une date d'agenda absente, mal écrite ou inexistante (spec 002).
import { describe, expect, it } from 'vitest';
import { dailyAgendaQuerySchema } from './activities.ts';

describe('dailyAgendaQuerySchema', () => {
  it.each([{}, { date: '' }, { date: 'demain' }, { date: '2026-13-45' }, { date: '2026-02-30' }])(
    '002-AS4: rejects a missing, malformed or impossible date (%j)',
    (query) => {
      const result = dailyAgendaQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['date']);
    },
  );

  it('002-AS4: accepts a well-formed date, even outside the Games', () => {
    expect(dailyAgendaQuerySchema.parse({ date: '2026-11-05' })).toEqual({ date: '2026-11-05' });
    // La période des Jeux est une règle métier, vérifiée par le domaine, pas par le schéma.
    expect(dailyAgendaQuerySchema.parse({ date: '2026-10-30' })).toEqual({ date: '2026-10-30' });
  });
});
