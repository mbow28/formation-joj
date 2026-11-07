import type { Registration } from '../domain/registration';
import { Slot } from '../domain/slot';
import type { RegistrationRow, SlotRow } from './volunteers.schema';

/** Ligne de la table et nombre d'inscrits compté en base → entité. */
export function toDomain(row: SlotRow, registeredCount: number): Slot {
  return Slot.restore({
    id: row.id,
    disciplineId: row.disciplineId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    capacity: row.capacity,
    registeredCount,
    createdAt: row.createdAt,
  });
}

/** Entité → ligne de la table. Le nombre d'inscrits n'est pas stocké : il est compté. */
export function toRow(slot: Slot): SlotRow {
  return {
    id: slot.id,
    disciplineId: slot.disciplineId,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    capacity: slot.capacity,
    createdAt: slot.createdAt,
  };
}

/** Inscription → ligne de la table. */
export function registrationToRow(registration: Registration): RegistrationRow {
  return {
    id: registration.id,
    slotId: registration.slotId,
    name: registration.name,
    email: registration.email,
    createdAt: registration.createdAt,
  };
}
