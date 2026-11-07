import type { Registration } from '../../domain/registration';
import { Slot } from '../../domain/slot';
import { slotFull } from '../../domain/volunteers.errors';
import { SlotRepository } from '../slot.repository';

/** Fake fidèle au contrat du port (comptage, capacité revérifiée à l'écriture), sans base. */
export class InMemorySlotRepository extends SlotRepository {
  private readonly slots = new Map<string, Slot>();
  private readonly registrations: Registration[] = [];

  /** Nombre de créneaux enregistrés : pour vérifier qu'un refus n'a rien écrit. */
  get size(): number {
    return this.slots.size;
  }

  /** Nombre total d'inscriptions enregistrées, tous créneaux confondus. */
  get registrationCount(): number {
    return this.registrations.length;
  }

  async findById(id: string): Promise<Slot | null> {
    const found = this.slots.get(id);
    return found ? this.restore(found) : null;
  }

  async insert(slot: Slot): Promise<void> {
    this.slots.set(slot.id, this.restore(slot));
  }

  async addRegistration(slot: Slot, registration: Registration): Promise<void> {
    // Comme le verrou en base : on recompte au moment d'écrire, pas à la lecture.
    if (this.countFor(slot.id) >= slot.capacity) throw slotFull(slot.id, slot.capacity);
    // Registration est immuable : pas besoin de copie.
    this.registrations.push(registration);
  }

  private countFor(slotId: string): number {
    return this.registrations.filter((registration) => registration.slotId === slotId).length;
  }

  /** Copie avec le nombre d'inscrits réellement enregistrés. */
  private restore(slot: Slot): Slot {
    return Slot.restore({
      id: slot.id,
      disciplineId: slot.disciplineId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      capacity: slot.capacity,
      registeredCount: this.countFor(slot.id),
      createdAt: slot.createdAt,
    });
  }
}
