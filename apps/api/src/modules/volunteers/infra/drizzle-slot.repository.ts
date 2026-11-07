import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { SlotRepository } from '../application/slot.repository';
import type { Registration } from '../domain/registration';
import type { Slot } from '../domain/slot';
import { slotFull, slotNotFound } from '../domain/volunteers.errors';
import { registrationToRow, toDomain, toRow } from './slot.mapper';
import { registrations, slots } from './volunteers.schema';

@Injectable()
export class DrizzleSlotRepository extends SlotRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async findById(id: string): Promise<Slot | null> {
    const [row] = await this.db
      .select({ slot: slots, registeredCount: count(registrations.id) })
      .from(slots)
      .leftJoin(registrations, eq(registrations.slotId, slots.id))
      .where(eq(slots.id, id))
      .groupBy(slots.id);
    return row ? toDomain(row.slot, row.registeredCount) : null;
  }

  async insert(slot: Slot): Promise<void> {
    await this.db.insert(slots).values(toRow(slot));
  }

  async addRegistration(slot: Slot, registration: Registration): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Verrouille le créneau : deux inscriptions simultanées comptent l'une après l'autre.
      const [locked] = await tx
        .select({ capacity: slots.capacity })
        .from(slots)
        .where(eq(slots.id, slot.id))
        .for('update');
      if (!locked) throw slotNotFound(slot.id);

      const [counted] = await tx
        .select({ registeredCount: count() })
        .from(registrations)
        .where(eq(registrations.slotId, slot.id));
      if ((counted?.registeredCount ?? 0) >= locked.capacity) {
        throw slotFull(slot.id, locked.capacity);
      }

      await tx.insert(registrations).values(registrationToRow(registration));
    });
  }
}
