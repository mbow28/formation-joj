import { Activity } from '../domain/activity';
import type { ActivityRow, NewActivityRow } from './activities.schema';

/** Ligne de la table → entité. */
export function toDomain(row: ActivityRow): Activity {
  return Activity.restore({
    id: row.id,
    title: row.title,
    venue: row.venue,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
  });
}

/** Entité → ligne de la table ; `created_at` est rempli par la base. */
export function toRow(activity: Activity): NewActivityRow {
  return {
    id: activity.id,
    title: activity.title,
    venue: activity.venue,
    startsAt: activity.startsAt,
    endsAt: activity.endsAt,
  };
}
