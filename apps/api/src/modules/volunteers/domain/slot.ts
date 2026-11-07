import { Registration } from './registration';
import { SlotError, slotFull } from './volunteers.errors';

export interface SlotProps {
  id: string;
  disciplineId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  registeredCount: number;
  createdAt: Date;
}

export interface NewSlot {
  id: string;
  disciplineId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  now: Date;
}

export interface NewVolunteer {
  id: string;
  name: string;
  email: string;
  now: Date;
}

/** Un créneau d'accueil dans une discipline : jamais plus d'inscrits que sa capacité. */
export class Slot {
  private constructor(private props: SlotProps) {}

  /** L'existence de la discipline est vérifiée par le cas d'usage. */
  static create({ id, disciplineId, startsAt, endsAt, capacity, now }: NewSlot): Slot {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new SlotError('SLOT_CAPACITY_INVALID', 'A slot capacity is an integer of at least 1', {
        capacity,
      });
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new SlotError('SLOT_ENDS_BEFORE_START', 'A slot ends after it starts');
    }
    return new Slot({
      id,
      disciplineId,
      startsAt,
      endsAt,
      capacity,
      registeredCount: 0,
      createdAt: now,
    });
  }

  /** Reconstruit un créneau depuis la persistance, avec son nombre d'inscrits. */
  static restore(props: SlotProps): Slot {
    return new Slot({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get disciplineId(): string {
    return this.props.disciplineId;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return this.props.endsAt;
  }

  get capacity(): number {
    return this.props.capacity;
  }

  get registeredCount(): number {
    return this.props.registeredCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /** Inscrit un bénévole s'il reste une place ; lève SLOT_FULL sinon. */
  register({ id, name, email, now }: NewVolunteer): Registration {
    if (this.props.registeredCount >= this.props.capacity) {
      throw slotFull(this.props.id, this.props.capacity);
    }
    const registration = Registration.create({ id, slotId: this.props.id, name, email, now });
    this.props = { ...this.props, registeredCount: this.props.registeredCount + 1 };
    return registration;
  }
}
