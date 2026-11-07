import { AppError, type ErrorKind } from '../../../core/errors/app-error';

/** Codes stables exposés aux clients ; la catégorie décide du statut HTTP. */
const SLOT_ERROR_KINDS = {
  /** Capacité inférieure à 1, ou non entière. */
  SLOT_CAPACITY_INVALID: 'VALIDATION',
  /** Heure de fin égale ou antérieure à l'heure de début. */
  SLOT_ENDS_BEFORE_START: 'VALIDATION',
  /** Nom du bénévole vide, ou fait seulement d'espaces. */
  VOLUNTEER_NAME_REQUIRED: 'VALIDATION',
  VOLUNTEER_EMAIL_INVALID: 'VALIDATION',
  /** Aucun créneau n'a cet identifiant. */
  SLOT_NOT_FOUND: 'NOT_FOUND',
  /** Le créneau a déjà autant d'inscrits que sa capacité. */
  SLOT_FULL: 'CONFLICT',
} as const satisfies Record<string, ErrorKind>;

export type SlotErrorCode = keyof typeof SLOT_ERROR_KINDS;

export class SlotError extends AppError<SlotErrorCode> {
  constructor(code: SlotErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, SLOT_ERROR_KINDS[code], message, details);
  }
}

export function slotFull(id: string, capacity: number): SlotError {
  return new SlotError('SLOT_FULL', `Slot ${id} is full`, { id, capacity });
}

export function slotNotFound(id: string): SlotError {
  return new SlotError('SLOT_NOT_FOUND', `No slot with id ${id}`, { id });
}
