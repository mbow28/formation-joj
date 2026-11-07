import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { RegisterVolunteerInput } from '@joj/shared';
import type { Registration } from '../../domain/registration';
import type { Slot } from '../../domain/slot';
import { slotNotFound } from '../../domain/volunteers.errors';
import { SlotRepository } from '../slot.repository';

@Injectable()
export class RegisterVolunteer {
  constructor(private readonly slots: SlotRepository) {}

  /** Renvoie l'inscription et le créneau après l'inscription, avec son nombre d'inscrits. */
  async execute(
    slotId: string,
    input: RegisterVolunteerInput,
  ): Promise<{ registration: Registration; slot: Slot }> {
    const slot = await this.slots.findById(slotId);
    if (!slot) throw slotNotFound(slotId);
    // Message clair dans le cas courant ; le repository couvre deux inscriptions simultanées.
    const registration = slot.register({ id: randomUUID(), ...input, now: new Date() });
    await this.slots.addRegistration(slot, registration);
    return { registration, slot };
  }
}
