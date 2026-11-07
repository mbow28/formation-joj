export interface ActivityProps {
  id: string;
  title: string;
  venue: string;
  startsAt: Date;
  endsAt: Date;
}

/**
 * Une animation ouverte aux visiteurs. Créer une animation est hors périmètre : on ne fait que
 * relire celles de la base, d'où l'absence de `create()`.
 */
export class Activity {
  private constructor(private readonly props: ActivityProps) {}

  /** Reconstruit une animation depuis la persistance. */
  static restore(props: ActivityProps): Activity {
    return new Activity({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get venue(): string {
    return this.props.venue;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return this.props.endsAt;
  }
}
