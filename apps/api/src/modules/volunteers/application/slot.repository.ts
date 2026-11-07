import type { Registration } from '../domain/registration';
import type { Slot } from '../domain/slot';

/**
 * Port de persistance : ce dont les cas d'usage ont besoin, rien de plus.
 * Implémenté par DrizzleSlotRepository (infra) et InMemorySlotRepository (tests).
 */
export abstract class SlotRepository {
  /** Le créneau avec son nombre d'inscrits, ou null. */
  abstract findById(id: string): Promise<Slot | null>;
  abstract insert(slot: Slot): Promise<void>;
  /**
   * Écrit l'inscription. Revérifie la capacité au moment d'écrire : lève SLOT_FULL si une
   * autre inscription a pris la dernière place depuis la lecture du créneau.
   */
  abstract addRegistration(slot: Slot, registration: Registration): Promise<void>;
}
