import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  openSlotSchema,
  registerVolunteerSchema,
  registrationSchema,
  type RegistrationResponse,
  slotDisciplineParamsSchema,
  slotIdParamsSchema,
  slotSchema,
  type SlotResponse,
} from '@joj/shared';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';
import { OpenSlot } from '../application/use-cases/open-slot';
import { RegisterVolunteer } from '../application/use-cases/register-volunteer';
import type { Registration } from '../domain/registration';
import type { Slot } from '../domain/slot';

class OpenSlotDto extends createZodDto(openSlotSchema) {}
class SlotDisciplineParamsDto extends createZodDto(slotDisciplineParamsSchema) {}
class SlotDto extends createZodDto(slotSchema) {}
class RegisterVolunteerDto extends createZodDto(registerVolunteerSchema) {}
class SlotIdParamsDto extends createZodDto(slotIdParamsSchema) {}
class RegistrationDto extends createZodDto(registrationSchema) {}

/** Couche fine : valider (DTO zod), appeler un cas d'usage, sérialiser. Aucune règle métier ici. */
@ApiTags('volunteers')
@Controller()
export class VolunteersController {
  constructor(
    private readonly openSlot: OpenSlot,
    private readonly registerVolunteer: RegisterVolunteer,
  ) {}

  @Post('disciplines/:disciplineId/slots')
  @ZodSerializerDto(SlotDto)
  async open(
    @Param() { disciplineId }: SlotDisciplineParamsDto,
    @Body() body: OpenSlotDto,
  ): Promise<SlotResponse> {
    return toSlotResponse(await this.openSlot.execute(disciplineId, body));
  }

  @Post('slots/:slotId/registrations')
  @ZodSerializerDto(RegistrationDto)
  async register(
    @Param() { slotId }: SlotIdParamsDto,
    @Body() body: RegisterVolunteerDto,
  ): Promise<RegistrationResponse> {
    const { registration, slot } = await this.registerVolunteer.execute(slotId, body);
    return toRegistrationResponse(registration, slot);
  }
}

function toSlotResponse(slot: Slot): SlotResponse {
  return {
    id: slot.id,
    disciplineId: slot.disciplineId,
    startsAt: slot.startsAt.toISOString(),
    endsAt: slot.endsAt.toISOString(),
    capacity: slot.capacity,
    registeredCount: slot.registeredCount,
  };
}

function toRegistrationResponse(registration: Registration, slot: Slot): RegistrationResponse {
  return {
    id: registration.id,
    slotId: registration.slotId,
    name: registration.name,
    email: registration.email,
    createdAt: registration.createdAt.toISOString(),
    slot: { capacity: slot.capacity, registeredCount: slot.registeredCount },
  };
}
