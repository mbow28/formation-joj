import { z } from 'zod';

export const VOLUNTEER_NAME_MAX_LENGTH = 100;
export const VOLUNTEER_EMAIL_MAX_LENGTH = 254;

/** Corps de `POST /api/disciplines/:disciplineId/slots`. */
export const openSlotSchema = z
  .object({
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    capacity: z.int().min(1),
  })
  .refine((slot) => Date.parse(slot.endsAt) > Date.parse(slot.startsAt), {
    message: 'A slot ends after it starts',
    path: ['endsAt'],
  });
export type OpenSlotInput = z.infer<typeof openSlotSchema>;

/** Paramètre `:disciplineId` de la route qui ouvre un créneau. */
export const slotDisciplineParamsSchema = z.object({ disciplineId: z.uuid() });

/** Paramètre `:slotId` des routes d'un créneau. */
export const slotIdParamsSchema = z.object({ slotId: z.uuid() });

/** Un créneau tel que l'API le renvoie. */
export const slotSchema = z.object({
  id: z.uuid(),
  disciplineId: z.uuid(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  capacity: z.int(),
  registeredCount: z.int(),
});
export type SlotResponse = z.infer<typeof slotSchema>;

/** Corps de `POST /api/slots/:slotId/registrations`. */
export const registerVolunteerSchema = z.object({
  name: z.string().trim().min(1).max(VOLUNTEER_NAME_MAX_LENGTH),
  email: z.email().max(VOLUNTEER_EMAIL_MAX_LENGTH),
});
export type RegisterVolunteerInput = z.infer<typeof registerVolunteerSchema>;

/** Une inscription telle que l'API la renvoie, avec l'état du créneau après l'inscription. */
export const registrationSchema = z.object({
  id: z.uuid(),
  slotId: z.uuid(),
  name: z.string(),
  email: z.string(),
  createdAt: z.iso.datetime(),
  slot: z.object({ capacity: z.int(), registeredCount: z.int() }),
});
export type RegistrationResponse = z.infer<typeof registrationSchema>;
