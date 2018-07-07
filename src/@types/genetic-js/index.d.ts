// declare module "genetic-js";

declare namespace GeneticJs {
  export interface Configuration {
    size: number;
    crossover: number;
    mutation: number;
    iterations: number;
    fittestAlwaysSurvives: boolean;
    maxResults: number;
    webWorkers: boolean;
    skip: number;
  }
  export type Population<Entity> = Array<{
    fitness: number;
    entity: Entity;
  }>;
  export interface Stats {
    maximum: number;
    minimum: number;
    mean: number;
    stdev: number;
  }
  export interface Genetic<Entity> {
    optimize: OptimizeFun;
    seed: () => Entity;
    mutate: (entity: Entity) => Entity;
    crossover: (mother: Entity, father: Entity) => [Entity, Entity];
    fitness: (entity: Entity) => number;
    generation: (
      pop: Population<Entity>,
      generation: number,
      stats: Stats
    ) => boolean;
    notification: (
      pop: Population<Entity>,
      generation: number,
      stats: Stats,
      isFinished: boolean
    ) => void;
    select1: SingleSelection<Entity>;
    select2: PairWiseSelection<Entity>;
    evolve(config: Partial<Configuration>, userData: any): void;
  }

  export type SingleSelection<Entity> = (pop: Population<Entity>) => Entity;
  export type PairWiseSelection<Entity> = (
    pop: Population<Entity>
  ) => [Entity, Entity];
  export interface Select1Map<Entity> {
    Tournament2: GeneticJs.SingleSelection<Entity>;
    Tournament3: GeneticJs.SingleSelection<Entity>;
    Fittest: GeneticJs.SingleSelection<Entity>;
    Random: GeneticJs.SingleSelection<Entity>;
    RandomLinearRank: GeneticJs.SingleSelection<Entity>;
    Sequential: GeneticJs.SingleSelection<Entity>;
  }
  export interface Select2Map<Entity> {
    Tournament2: GeneticJs.PairWiseSelection<Entity>;
    Tournament3: GeneticJs.PairWiseSelection<Entity>;
    Random: GeneticJs.PairWiseSelection<Entity>;
    RandomLinearRank: GeneticJs.PairWiseSelection<Entity>;
    Sequential: GeneticJs.PairWiseSelection<Entity>;
    FittestRandom: GeneticJs.PairWiseSelection<Entity>;
  }

  export type OptimizeFun = (fitnessA: number, fitnessB: number) => boolean;
  export interface Optimize {
    Minimize: OptimizeFun;
    Maximize: OptimizeFun;
  }
}

declare module "genetic-js" {
  export function create<Entity>(): GeneticJs.Genetic<Entity>;
  export const Optimize: GeneticJs.Optimize;
  export const Select1: GeneticJs.Select1Map<any>;
  export const Select2: GeneticJs.Select2Map<any>;
  namespace cosmiconfig {

  }
}
