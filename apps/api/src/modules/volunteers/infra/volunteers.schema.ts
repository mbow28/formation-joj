// Lu par drizzle-kit pour générer les migrations : ce fichier n'importe que drizzle-orm et des schémas.
import { index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { disciplines } from '../../disciplines/infra/disciplines.schema';

export const slots = pgTable('slots', {
  id: uuid('id').primaryKey(),
  // Un créneau appartient à une discipline existante ; il disparaît avec elle.
  disciplineId: uuid('discipline_id')
    .notNull()
    .references(() => disciplines.id, { onDelete: 'cascade' }),
  startsAt: timestamp('starts_at', { withTimezone: true, precision: 3 }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true, precision: 3 }).notNull(),
  // La règle « au moins 1 » et la capacité maximale sont tenues par le domaine et le repository.
  capacity: integer('capacity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
});

export const registrations = pgTable(
  'registrations',
  {
    id: uuid('id').primaryKey(),
    slotId: uuid('slot_id')
      .notNull()
      .references(() => slots.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    // Pas d'unicité de l'email par créneau : prévue en TR2.
    email: varchar('email', { length: 254 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
  },
  // Sert au comptage des inscrits d'un créneau.
  (table) => [index('registrations_slot_id_idx').on(table.slotId)],
);

export type SlotRow = typeof slots.$inferSelect;
export type RegistrationRow = typeof registrations.$inferSelect;
