// Lu par drizzle-kit pour générer les migrations : ce fichier n'importe que drizzle-orm et des schémas.
import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey(),
    title: varchar('title', { length: 150 }).notNull(),
    // Le lieu reste un texte : la liste des lieux connus arrive en TR2.
    venue: varchar('venue', { length: 150 }).notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true, precision: 3 }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true, precision: 3 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  // Sert la recherche des animations d'un jour.
  (table) => [index('activities_starts_at_idx').on(table.startsAt)],
);

export type ActivityRow = typeof activities.$inferSelect;
export type NewActivityRow = typeof activities.$inferInsert;
