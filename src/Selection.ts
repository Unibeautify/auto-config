// tslint:disable:no-function-expression object-literal-sort-keys
import { Genetic } from "@glavin001/genetic-js";
import {
  //   SingleSelection,
  //   PairWiseSelection,
  Population,
  Select1 as BaseSelect1,
  Select2 as BaseSelect2,
} from "@glavin001/genetic-js/dist/src/Selection";
import * as _ from "lodash";
import * as stringify from "json-stable-stringify";
import { Entity as UnibeautifyEntity } from "./UnibeautifySolver";

export const Select1 = {
  ...BaseSelect1,
};

export const Select2 = {
  ...BaseSelect2,
  RandomLinearRankAndRandom: function<Entity>(
    this: Genetic<Entity, any>,
    pop: Population<Entity>
  ): [Entity, Entity] {
    return [
      Select1.RandomLinearRank.call(this, pop),
      Select1.Random.call(this, pop),
    ];
  },
  RandomLinearRankAndTournament3: function<Entity>(
    this: Genetic<Entity, any>,
    pop: Population<Entity>
  ): [Entity, Entity] {
    return [
      Select1.RandomLinearRank.call(this, pop),
      Select1.Tournament3.call(this, pop),
    ];
  },
  RandomFittestAndTournament3: function<Entity>(
    this: Genetic<Entity, any>,
    pop: Population<Entity>
  ): [Entity, Entity] {
    const bestFitness = pop[0].fitness;
    const bestEntities = pop.filter(popItem => popItem.fitness === bestFitness);
    return [
      Select1.Random.call(this, bestEntities),
      Select1.Tournament3.call(this, pop),
    ];
  },
  DistinctPair: function<Entity>(
    this: Genetic<Entity, any>,
    pop: Population<Entity>
  ): [Entity, Entity] {
    const uniqPop = _.uniqBy(pop, ({ entity }) => stringify(entity));
    const items = _.sampleSize(uniqPop, 2);
    return [items[0].entity, items[1].entity];
    // const shuffled = _.shuffle(uniqPop);
    // return [shuffled[0], shuffled[1]];
  },
  MostDifferentPair: function<Entity>(
    this: Genetic<Entity, any>,
    pop: Population<Entity>
  ): [Entity, Entity] {
    const uniqPop = _.uniqBy(pop, ({ entity }) => stringify(entity));
    const firstEntity: Entity = Select1.Tournament3.call(this, uniqPop);
    const firstOptionsKeys = enabledOptionKeys(firstEntity as any);
    const sortedPop = _.sortBy(uniqPop, popItem => {
      return _.difference(enabledOptionKeys(popItem as any), firstOptionsKeys)
        .length;
    });
    const secondEntity = sortedPop[sortedPop.length - 1].entity;
    return [firstEntity, secondEntity];
  },
  DifferentPair: function<Entity>(
    this: Genetic<Entity, any>,
    pop: Population<Entity>
  ): [Entity, Entity] {
    const uniqPop = _.uniqBy(pop, ({ entity }) => stringify(entity));
    const firstEntity: Entity = Select1.Tournament3.call(this, uniqPop);
    const firstOptionsKeys = enabledOptionKeys(firstEntity as any);
    let diffPop = _.filter(uniqPop, popItem => {
      return (
        _.difference(firstOptionsKeys, enabledOptionKeys(popItem as any))
          .length !== 0
      );
    });
    if (diffPop.length === 0) {
      diffPop = _.filter(uniqPop, popItem => {
        return _.difference(enabledOptionKeys(popItem as any)).length !== 0;
      });
    }
    if (diffPop.length === 0) {
      diffPop = uniqPop;
    }
    const secondEntity = Select1.Tournament3.call(this, diffPop);
    return [firstEntity, secondEntity];
  },
  DifferentPair2: function<Entity>(
    this: Genetic<Entity, any>,
    pop: Population<Entity>
  ): [Entity, Entity] {
    const uniqPop = _.uniqBy(pop, ({ entity }) => stringify(entity));
    const firstEntity: Entity = Select1.Tournament3.call(this, uniqPop);
    const firstOptionsKeys = enabledOptionKeys(firstEntity as any);
    let diffPop = _.filter(uniqPop, popItem => {
      return (
        _.difference(enabledOptionKeys(popItem as any), firstOptionsKeys)
          .length !== 0
      );
    });
    if (diffPop.length === 0) {
      diffPop = _.filter(uniqPop, popItem => {
        return (
          _.difference(firstOptionsKeys, enabledOptionKeys(popItem as any))
            .length !== 0
        );
      });
    }
    if (diffPop.length === 0) {
      diffPop = uniqPop;
    }
    const secondEntity = Select1.Tournament3.call(this, diffPop);
    return [firstEntity, secondEntity];
  },
};

function enabledOptionKeys(entity: UnibeautifyEntity): string[] {
  return Object.keys(enabledOptions(entity));
}

function enabledOptions(entity: UnibeautifyEntity) {
  const originalOptions = entity.options;
  return _.omitBy(
    { ...originalOptions, beautifiers: undefined },
    value => value == undefined
  );
}
