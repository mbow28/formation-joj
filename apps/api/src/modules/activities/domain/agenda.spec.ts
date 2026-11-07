// Prouve les deux règles de l'agenda : le tri des animations et la période des Jeux (spec 002).
import { describe, expect, it } from 'vitest';
import { ActivityError } from './activities.errors';
import { Activity } from './activity';
import { assertDuringGames, sortAgenda } from './agenda';

function activity(title: string, startsAt: string, endsAt: string): Activity {
  return Activity.restore({
    id: crypto.randomUUID(),
    title,
    venue: 'Village des Jeux de Diamniadio',
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
  });
}

describe('sortAgenda', () => {
  it('002-AS1: sorts activities by start time then title', () => {
    const concert = activity('Concert de sabar', '2026-11-05T18:00:00Z', '2026-11-05T20:00:00Z');
    const marche = activity('Marché artisanal', '2026-11-05T10:00:00Z', '2026-11-05T13:00:00Z');
    const lutte = activity('Initiation à la lutte', '2026-11-05T15:00:00Z', '2026-11-05T16:30:00Z');
    const atelier = activity('Atelier de batik', '2026-11-05T15:00:00Z', '2026-11-05T17:00:00Z');

    const sorted = sortAgenda([concert, marche, lutte, atelier]);

    expect(sorted.map((a) => a.title)).toEqual([
      'Marché artisanal',
      'Atelier de batik',
      'Initiation à la lutte',
      'Concert de sabar',
    ]);
  });
});

describe('assertDuringGames', () => {
  it.each(['2026-10-30', '2026-11-14', '2025-11-05'])(
    '002-AS3: rejects a date outside the Games (%s)',
    (date) => {
      let caught: unknown;
      try {
        assertDuringGames(date);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(ActivityError);
      expect(caught).toMatchObject({
        code: 'ACTIVITY_DATE_OUTSIDE_GAMES',
        kind: 'BUSINESS_RULE',
        details: { date, firstDay: '2026-10-31', lastDay: '2026-11-13' },
      });
    },
  );

  it.each(['2026-10-31', '2026-11-05', '2026-11-13'])(
    '002-AS3: accepts the first day, the last day and the days between (%s)',
    (date) => {
      expect(() => assertDuringGames(date)).not.toThrow();
    },
  );
});
