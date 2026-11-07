import { Injectable } from '@nestjs/common';
import type { Discipline } from '../../domain/discipline';
import { disciplineNotFound } from '../../domain/disciplines.errors';
import { DisciplineRepository } from '../discipline.repository';

/** Les autres disciplines de la même catégorie, triées par nom, sans la discipline elle-même. */
@Injectable()
export class ListSimilarDisciplines {
  constructor(private readonly disciplines: DisciplineRepository) {}

  async execute(id: string): Promise<Discipline[]> {
    const discipline = await this.disciplines.findById(id);
    if (!discipline) throw disciplineNotFound(id);
    // list() est déjà triée par nom : le filtre garde cet ordre.
    return (await this.disciplines.list()).filter(
      (other) => other.category === discipline.category && other.id !== discipline.id,
    );
  }
}
