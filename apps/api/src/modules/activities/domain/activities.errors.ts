import { GAMES_FIRST_DAY, GAMES_LAST_DAY } from '@joj/shared';
import { AppError, type ErrorKind } from '../../../core/errors/app-error';

/** Codes stables exposés aux clients ; la catégorie décide du statut HTTP. */
const ACTIVITY_ERROR_KINDS = {
  /** La date demandée est hors des Jeux (du 31 octobre au 13 novembre 2026). */
  ACTIVITY_DATE_OUTSIDE_GAMES: 'BUSINESS_RULE',
} as const satisfies Record<string, ErrorKind>;

export type ActivityErrorCode = keyof typeof ACTIVITY_ERROR_KINDS;

export class ActivityError extends AppError<ActivityErrorCode> {
  constructor(code: ActivityErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, ACTIVITY_ERROR_KINDS[code], message, details);
  }
}

export function activityDateOutsideGames(date: string): ActivityError {
  return new ActivityError(
    'ACTIVITY_DATE_OUTSIDE_GAMES',
    `${date} is outside the Games, which run from ${GAMES_FIRST_DAY} to ${GAMES_LAST_DAY}`,
    { date, firstDay: GAMES_FIRST_DAY, lastDay: GAMES_LAST_DAY },
  );
}
