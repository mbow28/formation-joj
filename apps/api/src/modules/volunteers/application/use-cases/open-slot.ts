import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { OpenSlotInput } from '@joj/shared';
import { GetDiscipline } from '../../../disciplines/application/use-cases/get-discipline';
import { Slot } from '../../domain/slot';
import { SlotRepository } from '../slot.repository';

@Injectable()
export class OpenSlot {
  constructor(
    private readonly slots: SlotRepository,
    private readonly getDiscipline: GetDiscipline,
  ) {}

  async execute(disciplineId: string, input: OpenSlotInput): Promise<Slot> {
    // Lève DISCIPLINE_NOT_FOUND, le code du module Disciplines.
    const discipline = await this.getDiscipline.execute(disciplineId);
    const slot = Slot.create({
      id: randomUUID(),
      disciplineId: discipline.id,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      capacity: input.capacity,
      now: new Date(),
    });
    await this.slots.insert(slot);
    return slot;
  }
}
