import * as Genetic from "@glavin001/genetic-js";
import {
  Unibeautify,
  newUnibeautify,
  OptionValues,
  OptionsRegistry,
  Language,
  LanguageOptionValues,
  Option,
  Beautifier,
  BeautifierOptionName,
} from "unibeautify";
import * as _ from "lodash";
import * as fastLevenshtein from "fast-levenshtein";
import * as DataLoader from "dataloader";
import * as stringify from "json-stable-stringify";

import { Select1, Select2 } from "./Selection";
import { ImportantOptionsRegistryBuilder } from "./OptionImportance";

export interface Entity {
  options: OptionValues;
}

export interface UserData {
  beautifiers: Beautifier[];
  language: string;
  originalText: string;
  desiredText: string;
}

export class UnibeautifyGenetic extends Genetic.Genetic<Entity, UserData> {
  optimize = Genetic.Optimize.Minimize;
  // select1 = Genetic.Select1.Fittest;
  // select1 = Genetic.Select1.Tournament3;
  // select2 = Genetic.Select2.FittestRandom;
  // select2 = Genetic.Select2.Tournament3;
  // select1 = Select1.Tournament3;
  select1 = Select1.RandomLinearRank;
  // select2 = Select2.DistinctPair;
  // select2 = Select2.RandomFittestAndTournament3;
  select2 = Select2.DifferentPair;

  public readonly unibeautify: Unibeautify;
  private readonly language: Language;
  private readonly beautifyDataloaderCacheMap: Map<string, Promise<string>>;
  private readonly beautifyDataloader: DataLoader<BeautifyRequest, string>;
  private readonly fitnessDataloaderCacheMap: Map<string, Promise<number>>;
  private readonly fitnessDataloader: DataLoader<Entity, number>;
  public readonly optionsImportance: ImportantOptionsRegistryBuilder;
  public optionsRegistry: OptionsRegistry;
  private history: number[] = [];

  constructor({ configuration, userData }: Options) {
    super(configuration, userData);
    this.unibeautify = newUnibeautify();
    this.initializeUnibeautify();
    this.language = this.getLanguage();
    this.optionsRegistry = this.unibeautify.getOptionsSupportedForLanguage(
      this.language
    );
    this.beautifyDataloaderCacheMap = new Map();
    this.beautifyDataloader = new DataLoader<BeautifyRequest, string>(
      entities =>
        Promise.all(entities.map(entity => this.internalBeautify(entity))),
      {
        cacheMap: this.beautifyDataloaderCacheMap as Map<any, Promise<string>>,
        cacheKeyFn: stringify,
      }
    );

    this.fitnessDataloaderCacheMap = new Map();
    this.fitnessDataloader = new DataLoader<Entity, number>(
      entities =>
        Promise.all(entities.map(entity => this.internalFitness(entity))),
      {
        cacheMap: this.fitnessDataloaderCacheMap as Map<any, Promise<number>>,
        cacheKeyFn: stringify,
      }
    );

    this.optionsImportance = new ImportantOptionsRegistryBuilder(this);
  }

  private initializeUnibeautify() {
    this.unibeautify.loadBeautifiers(this.beautifiers);
  }

  private getLanguage(): Language {
    return this.unibeautify.findLanguages({
      name: this.languageName,
    })[0];
  }

  // private get language(): Language {
  //   return this.unibeautify.findLanguages({
  //     name: this.languageName,
  //   })[0];
  // }

  private get beautifiers(): Beautifier[] {
    return this.userData.beautifiers;
  }

  public seed(): Entity {
    return this.createUniqueEntity(() => this.createEntity());
    // let entity = this.createEntity();
    // while (this.alreadyEntity(entity)) {
    //   entity = this.createEntity();
    // }
    // return entity;
  }

  private createUniqueEntity(createFn: () => Entity): Entity {
    return createFn();
    // let entity = createFn();
    // let count = 0;
    // const max = 10;
    // while (this.alreadyEntity(entity) && count <= max) {
    //   entity = createFn();
    //   count++;
    // }
    // return entity;
  }

  // private alreadyEntity(entity: Entity): boolean {
  //   const entityJson = stringify(entity);
  //   const entities: Entity[] = (<any>this).entities;
  //   const entityInPopulation =
  //     _.findIndex(entities, curr => stringify(curr) === entityJson) !== -1;
  //   if (entityInPopulation) {
  //     return true;
  //   }
  //   // const entityInHistory =
  //   //   Object.keys(this.dataloaderCacheMap).indexOf(entityJson) !== -1;
  //   // if (entityInHistory) {
  //   //   return true;
  //   // }
  //   return false;
  // }

  private createEntity() {
    const beautifiers = _.sampleSize(
      this.supportedBeautifierNames,
      _.random(1, this.supportedBeautifierNames.length)
    );
    const options: Entity["options"] = this.optionKeysForBeautifiers(
      beautifiers
    ).reduce(
      (options: Entity["options"], optionKey: string) => ({
        ...options,
        [optionKey]: this.randomValueIncludingUndefined(
          this.optionsRegistry[optionKey]
        ),
      }),
      {
        beautifiers,
      } as any
    );
    return this.cleanEntity({
      options,
    });
  }

  private cleanEntity(entity: Entity): Entity {
    const { options } = entity;
    const { beautifiers } = options as any;
    const cleanOptions: OptionValues = _.mapValues(
      options,
      (value, optionName: BeautifierOptionName) => {
        if (<any>optionName === "beautifiers") {
          // return value;
          return _.sortBy(
            value as string[],
            beautifierName => (beautifierName === "File" ? Infinity : 0)
          );
        }
        const doesSupportOption = this.doesSupportOption(
          optionName,
          beautifiers
        );
        return doesSupportOption ? value : undefined;
      }
    ) as any;
    return {
      options: cleanOptions,
    };
  }

  private doesSupportOption(
    optionName: BeautifierOptionName,
    beautifierNames: string[]
  ): boolean {
    if (beautifierNames.length === this.supportedBeautifierNames.length) {
      return true;
    }
    return this.beautifiers.some(beautifier => {
      if (beautifierNames.indexOf(beautifier.name) === -1) {
        return false;
      }
      return this.unibeautify.doesBeautifierSupportOptionForLanguage({
        beautifier,
        language: this.language,
        optionName,
      });
    });
  }

  private get supportedBeautifierNames(): string[] {
    return this.userData.beautifiers.map(beautifier => beautifier.name);
  }

  public mutate(entity: Entity) {
    return this.createUniqueEntity(() => this.internalMutate(entity));
  }

  private internalMutate(entity: Entity) {
    const enabledBeautifiers = (<any>entity.options).beautifiers;
    const hasMultipleBeautifiers = enabledBeautifiers.length > 1;

    const numOfMutations = 10;
    const chosenMutation = Math.floor(Math.random() * numOfMutations);

    switch (chosenMutation) {
      case 0: {
        // Remove Beautifier
        if (hasMultipleBeautifiers) {
          const removeBeautifier = this.randomItemFromArray(enabledBeautifiers);
          return this.cleanEntity({
            ...entity,
            options: {
              ...entity.options,
              beautifiers: _.without(enabledBeautifiers, removeBeautifier),
            } as any,
          });
        }
      }
      case 1: {
        // Add Beautifier
        const missingBeautifiers: string[] = _.difference(
          enabledBeautifiers,
          this.supportedBeautifierNames
        );
        if (missingBeautifiers.length > 0) {
          const addBeautifier = this.randomItemFromArray(missingBeautifiers);
          return this.cleanEntity({
            ...entity,
            options: {
              ...entity.options,
              beautifiers: [...enabledBeautifiers, addBeautifier],
            } as any,
          });
        }
      }
      case 2: {
        // Shuffle Beautifiers
        return this.cleanEntity({
          ...entity,
          options: {
            ...entity.options,
            beautifiers: _.shuffle((<any>entity.options).beautifiers),
          } as any,
        });
      }
      case 3: {
        // Remove Enabled Option
        const originalOptions = entity.options;
        const enabledOptions = _.omitBy(
          { ...originalOptions, beautifiers: undefined },
          value => value == undefined
        );
        const enabledOptionNames = Object.keys(enabledOptions);
        if (enabledOptionNames.length > 0) {
          const removeOptionName = this.randomItemFromArray(enabledOptionNames);
          return this.cleanEntity({
            ...entity,
            options: {
              ...entity.options,
              [removeOptionName]: undefined,
            } as any,
          });
        }
      }
      case 4: {
        // Add Disabled Option
        return this.addDisabledOption(entity);
      }
      case 5:
      default: {
        // Change Enabled Option
        return this.changeEnabledOption(entity);
      }
    }
  }

  private addDisabledOption(entity: Entity): Entity {
    const originalOptions = entity.options;
    const enabledOptions = _.omitBy(
      { ...originalOptions, beautifiers: undefined },
      value => value == undefined
    );
    const enabledOptionNames = Object.keys(enabledOptions);
    const disabledOptionNames = _.difference(
      this.optionKeys,
      enabledOptionNames
    );
    if (disabledOptionNames.length > 0) {
      const addOptionName = this.randomItemFromArray(disabledOptionNames);
      const option = this.optionsRegistry[addOptionName];
      return this.cleanEntity({
        ...entity,
        options: {
          ...entity.options,
          [addOptionName]: this.randomValue(option),
        } as any,
      });
    }
    return this.changeEnabledOption(entity);
  }

  private changeEnabledOption(entity: Entity) {
    const originalOptions = entity.options;
    const enabledOptions: OptionValues = _.omitBy(
      { ...originalOptions, beautifiers: undefined },
      value => value == undefined
    );
    const enabledOptionNames: Array<BeautifierOptionName> = Object.keys(
      enabledOptions
    ) as any[];
    const hasNoEnabledOptions = enabledOptionNames.length === 0;
    if (hasNoEnabledOptions) {
      return this.addDisabledOption(entity);
    }
    const optionKey: keyof OptionValues = this.randomItemFromArray(
      enabledOptionNames
    );
    const option = this.optionsRegistry[optionKey];
    if (!option) {
      throw new Error(
        `Option for key not found: ${optionKey}\n ${JSON.stringify(
          enabledOptionNames
        )}`
      );
    }
    const currValue: any = originalOptions[optionKey];
    // const allValues = this.exampleValues(option);
    // const values = _.without(allValues, currValue);
    // const newValue = this.randomItemFromArray(values);
    const newValue = this.nextRandomValueForOption(option, currValue);
    return this.cleanEntity({
      ...entity,
      options: {
        ...entity.options,
        [optionKey]: newValue,
      },
    });
  }

  // private randomOptionKeyForBeautifiers(
  //   beautifierNames: string[]
  // ): BeautifierOptionName {
  //   return this.randomItemFromArray(
  //     this.optionKeysForBeautifiers(beautifierNames)
  //   );
  // }

  private optionKeysForBeautifiers(
    beautifierNames: string[]
  ): BeautifierOptionName[] {
    return this.optionKeys.filter(optionName =>
      this.doesSupportOption(optionName, beautifierNames)
    );
  }

  private randomItemFromArray<T>(arr: T[]): T {
    if (arr.length === 0) {
      throw new Error(
        "randomItemFromArray expects an array with 1 or more items."
      );
    }
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
  }

  private randomValue(option: Option): any {
    const values = this.exampleValues(option);
    return this.randomItemFromArray(values);
  }

  private randomValueIncludingUndefined(option: Option): any {
    const values = this.exampleValues(option);
    const valuesWithUndefined = [...values, undefined];
    return this.randomItemFromArray(valuesWithUndefined);
  }

  public nextRandomValueForOption(option: Option, currValue: any): any {
    // const allValues = this.exampleValues(option);
    // const values = _.without(allValues, currValue);
    // const newValue = this.randomItemFromArray(values);
    if (currValue === undefined) {
      return this.randomItemFromArray(this.exampleValues(option));
    }
    switch (option.type) {
      case "boolean":
        return !currValue;
      case "integer": {
        const step = option.multipleOf || 1;
        const min = option.minimum || 0;
        if (currValue <= min) {
          return min + step;
        }
        const max = option.maximum || 10 * step;
        if (currValue >= max) {
          return max - step;
        }
        return step * Math.floor(_.random(min / step, max / step));
      }
    }
    const values = _.without(this.exampleValues(option), currValue);
    return this.randomItemFromArray(values);
  }

  public exampleValues(option: Option): any[] {
    if (option.enum) {
      return option.enum;
    }
    switch (option.type) {
      case "boolean":
        return [true, false];
      case "integer": {
        const min = option.minimum || 0;
        const max = option.maximum || option.default * 2;
        return [option.default, min, max].sort();
      }
      case "array": {
        return [[], option.default];
      }
      default:
        return [option.default];
    }
  }

  public crossover(mother: Entity, father: Entity): [Entity, Entity] {
    // two-point crossover
    const optionKeys = this.optionKeys;
    const len = optionKeys.length;
    let ca = Math.floor(Math.random() * len);
    let cb = Math.floor(Math.random() * len);
    if (ca > cb) {
      const tmp = cb;
      cb = ca;
      ca = tmp;
    }

    const fatherOptions = father.options;
    const motherOptions = mother.options;

    const beautifiers = _.union(
      (<any>motherOptions)["beautifiers"],
      (<any>fatherOptions)["beautifiers"]
    );

    const sonOptions: Entity["options"] = {
      beautifiers,
      ..._.pick(fatherOptions, optionKeys.slice(0, ca)),
      ..._.pick(motherOptions, optionKeys.slice(ca, cb - ca)),
      ..._.pick(fatherOptions, optionKeys.slice(cb)),
    } as any;
    const daughterOptions: Entity["options"] = {
      beautifiers,
      ..._.pick(fatherOptions, optionKeys.slice(0, ca)),
      ..._.pick(motherOptions, optionKeys.slice(ca, cb - ca)),
      ..._.pick(fatherOptions, optionKeys.slice(cb)),
    } as any;
    const son: Entity = this.cleanEntity({
      options: sonOptions,
    });
    const daughter: Entity = this.cleanEntity({
      options: daughterOptions,
    });
    return [son, daughter];
  }

  protected get optionKeys(): BeautifierOptionName[] {
    return Object.keys(this.optionsRegistry).sort() as any[];
  }

  // public get optionsRegistry(): OptionsRegistry {
  //   return this.unibeautify.getOptionsSupportedForLanguage(this.language);
  // }

  private get languageName(): string {
    return this.userData.language;
  }

  public fitness(entity: Entity): Promise<number> {
    const cleanEntity = this.cleanEntity(entity);
    // if (this.fitnessDataloaderCacheMap.has(stringify(cleanEntity))) {
    //   console.info("Fitness cache hit");
    // }
    return this.fitnessDataloader.load(cleanEntity);
    // return this.internalFitness(entity);
  }

  protected internalFitness(entity: Entity): Promise<number> {
    return this.beautify(this.originalText, entity).then(
      (beautifiedText: string) => {
        const diffCount = fastLevenshtein.get(this.desiredText, beautifiedText);
        const numOfBeautifiers = (<any>entity.options).beautifiers.length;
        const diffFitness: number = diffCount * 10000;
        if (diffCount !== 0) {
          return diffFitness;
        }
        const beautifierFitness: number =
          Math.max(0, numOfBeautifiers - 1) * 1000;
        const ignoreOptionKeys = [
          "beautifiers",
          //   "indent_size",
          //   "indent_style",
        ];
        const optionsFitness: number = Math.max(
          0,
          _.without(_.keys(entity.options), ...ignoreOptionKeys).length - 1
        );
        return beautifierFitness + optionsFitness;
      }
    );
  }

  public beautify(text: string, entity: Entity) {
    const cleanEntity = this.cleanEntity(entity);
    // if (this.beautifyDataloaderCacheMap.has(stringify(cleanEntity))) {
    //   console.info("Beautify cache hit");
    // }
    return this.beautifyDataloader.load({
      entity: cleanEntity,
      text,
    });
  }

  private internalBeautify({ entity, text }: BeautifyRequest) {
    const options: LanguageOptionValues = {
      [this.languageName]: entity.options,
    };
    const data = {
      languageName: this.languageName,
      options,
      text,
    };
    return this.unibeautify.beautify(data);
  }

  public get desiredText(): string {
    return this.userData.desiredText;
  }

  public get originalText(): string {
    return this.userData.originalText;
  }

  public shouldContinue({
    generation,
    population,
  }: Genetic.GeneticState<Entity>) {
    const bestFitness = population[0].fitness;
    this.history.push(bestFitness);
    const isPerfect = bestFitness === 0;
    if (isPerfect) {
      return false;
    }
    const textIsTheSame = Math.floor(bestFitness / 10000) === 0;
    if (textIsTheSame) {
      const percThreshold = 0.3;
      if (
        generation > this.configuration.iterations / 4 &&
        generation / this.lastGenWithSameFitness(bestFitness) - 1 >=
          percThreshold
      ) {
        return false;
      }
      const bestEntities = population.filter(
        entity => entity.fitness === bestFitness
      );
      const threshold = this.configuration.size * 0.5;
      if (bestEntities.length > threshold) {
        const entityJson = stringify(population[0].entity);
        const bestAreSame = bestEntities.every(
          ({ entity }) => stringify(entity) === entityJson
        );
        if (bestAreSame) {
          return false;
        }
      }
    }
    return true;
  }

  public lastGenWithSameFitness(fitness: number): number {
    const index = this.history.findIndex(f => f <= fitness);
    if (index === -1) {
      return Math.max(0, this.history.length - 1);
    }
    return index;
  }

  notification({
    population,
    isFinished,
    generation,
    stats,
  }: Genetic.Notification<Entity>) {
    console.log(generation, population[0].fitness, isFinished);
    if (isFinished) {
      this.beautify(this.originalText, population[0].entity).then(
        beautifiedText => {
          console.log(`Solution after ${generation} generations:`);
          console.log(JSON.stringify(population[0], null, 2));
          console.log(JSON.stringify(stats, null, 2));
          console.log("-".repeat(20));
          console.log(this.desiredText);
          console.log("-".repeat(20));
          console.log(beautifiedText);
          console.log("-".repeat(20));
        }
      );
    }
  }

  public trimOptions(options: OptionValues): Promise<OptionValues> {
    return this.generateOptionsRegistry(options).then(optionsRegistry => {
      const includeOptionKeys: string[] = Object.keys(optionsRegistry);
      return _.pick(options, includeOptionKeys) as OptionValues;
    });
  }

  public evolve(): Promise<void> {
    return this.generateOptionsRegistry().then(optionsRegistry => {
      this.optionsRegistry = optionsRegistry;
      return super.evolve();
    });
  }

  private generateOptionsRegistry(
    optionValues: OptionValues = {}
  ): Promise<OptionsRegistry> {
    return this.optionsImportance
      .buildImportantOptionsRegistry(optionValues)
      .then(optionsRegistry => {
        // console.log(JSON.stringify(optionsRegistry, null, 2));
        const importantOptionKeys = Object.keys(optionsRegistry);
        const allOptionKeys = Object.keys(this.optionsRegistry);

        console.log(
          `${importantOptionKeys.length} of ${
            allOptionKeys.length
          } keys are important`
        );
        console.log(importantOptionKeys.join(", "));

        return optionsRegistry;
      });
  }
}

export interface BeautifyRequest {
  entity: Entity;
  text: string;
}

export interface Options {
  configuration: Partial<Genetic.Configuration>;
  userData: UserData;
}
