// import * as Genetic from "@glavin001/genetic-js";
import * as fastLevenshtein from "fast-levenshtein";
import * as _ from "lodash";
// import * as stringify from "json-stable-stringify";

import { UnibeautifyGenetic, Options, Entity } from "./UnibeautifySolver";

export class ConfigSolver extends UnibeautifyGenetic {
  private readonly optionsCount: number;
  private readonly originalTextVariations: Promise<string>[];

  constructor(options: Options) {
    const { userData } = options;
    if (userData.originalText !== userData.desiredText) {
      throw new Error(
        "This solver should only be used when original and desired text are the same."
      );
    }
    super(options);
    this.optionsCount = this.optionKeys.length;
    console.log(JSON.stringify(this.optionKeys, null, 2));
    const variationsCount = 30;
    this.originalTextVariations = [];
    for (let currSeed = 0; currSeed < variationsCount; ++currSeed) {
      this.originalTextVariations.push(
        this.beautify(this.originalText, this.seed())
      );
    }
  }

  protected internalFitness(entity: Entity): Promise<number> {
    return Promise.all(this.originalTextVariations)
      .then(originalTextVariations => {
        return Promise.all(
          originalTextVariations.map(text =>
            this.internalIndividualFitness(text, entity)
          )
        );
      })
      .then(
        scores => scores.reduce((sum, curr) => sum + curr, 0) / scores.length
      );
  }

  protected internalIndividualFitness(
    originalText: string,
    entity: Entity
  ): Promise<number> {
    // Minimize diff count
    // Maximum # of options used ==> more options used then smaller score (smaller is better)
    return this.beautify(originalText, entity).then(
      (beautifiedText: string) => {
        // const diffCount = fastLevenshtein.get(this.desiredText, beautifiedText);
        const diffCount = this.diffCount(beautifiedText, this.desiredText);
        // const diffFitness: number = diffCount * 10000;
        // const numOfBeautifiers = (<any>entity.options).beautifiers.length;
        // if (diffCount !== 0) {
        //   return diffFitness;
        // }
        // const beautifierFitness: number =
        //   Math.max(0, numOfBeautifiers - 1) * 1000;

        // const ignoreOptionKeys = [
        //   "beautifiers",
        //   //   "indent_size",
        //   //   "indent_style",
        // ];
        // const optionsCount: number = Math.max(
        //   0,
        //   _.without(_.keys(entity.options), ...ignoreOptionKeys).length - 1
        // );
        const optionsCount = this.optionsUsed(entity);

        // return beautifierFitness + optionsFitness;
        // const optionsFitness = optionsCount >= this.optionsCount ? 0 : 1 / (this.optionsCount - optionsCount);
        // const optionsFitness = 1 / (optionsCount + 1);
        // const optionsFitness = 1 / (this.optionsCount / (optionsCount + 1) + 1) * 100;
        // if (optionsCount <= 0) {
        //   // return Infinity;
        //   return 10000000;
        // }

        const diffPerc: number =
          diffCount / Math.max(this.desiredText.length, beautifiedText.length);
        const diffFitness: number = diffPerc * 10000;

        // const optionsPerc: number = optionsCount / this.optionsCount;
        // const optionsFitness: number = 1 / optionsPerc * 100;

        // const optionsFitness = Math.max(0, this.optionsCount - optionsCount);

        const optionsPerc: number =
          Math.max(0, this.optionsCount - optionsCount) / this.optionsCount;
        const optionsFitness: number = optionsPerc * 100;

        return diffFitness + optionsFitness;
      }
    );
  }

  protected diffCount(src: string, dest: string): number {
    return fastLevenshtein.get(src, dest);
  }

  protected optionsUsed(entity: Entity): number {
    const ignoreOptionKeys = [
      "beautifiers",
      //   "indent_size",
      //   "indent_style",
    ];
    const optionsCount: number = Math.max(
      0,
      _.without(_.keys(entity.options), ...ignoreOptionKeys).length - 1
    );
    return optionsCount;
  }

  // public shouldContinue({ population }: Genetic.GeneticState<Entity>) {
  //   const bestFitness = population[0].fitness;
  //   const isPerfect = bestFitness === 0;
  //   if (isPerfect) {
  //     return false;
  //   }
  //   // const textIsTheSame = Math.floor(bestFitness / 10000) === 0;
  //   // if (textIsTheSame) {
  //   //   const bestEntities = population.filter(
  //   //     entity => entity.fitness === bestFitness
  //   //   );
  //   //   const threshold = this.configuration.size * 0.5;
  //   //   if (bestEntities.length > threshold) {
  //   //     const entityJson = stringify(population[0].entity);
  //   //     const bestAreSame = bestEntities.every(
  //   //       ({ entity }) => stringify(entity) === entityJson
  //   //     );
  //   //     if (bestAreSame) {
  //   //       return false;
  //   //     }
  //   //   }
  //   // }
  //   return true;
  // }
}
