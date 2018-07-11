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

  private readonly unibeautify: Unibeautify;
  private readonly language: Language;
  private readonly dataloaderCacheMap: Map<Entity, Promise<string>>;
  private readonly dataloader: DataLoader<Entity, string>;

  constructor({
    configuration,
    userData,
  }: {
    configuration: Partial<Genetic.Configuration>;
    userData: UserData;
  }) {
    super(configuration, userData);
    this.unibeautify = newUnibeautify();
    this.initializeUnibeautify();
    this.language = this.getLanguage();
    this.dataloaderCacheMap = new Map();
    this.dataloader = new DataLoader<Entity, string>(
      entities =>
        Promise.all(entities.map(entity => this.internalBeautify(entity))),
      {
        cacheMap: this.dataloaderCacheMap,
        cacheKeyFn: stringify,
      }
    );
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
          return value;
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

    const numOfMutations = 6;
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
    const allValues = this.exampleValues(option);
    const values = _.without(allValues, currValue);
    const newValue = this.randomItemFromArray(values);
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

  private exampleValues(option: Option): any[] {
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

  private get optionKeys(): BeautifierOptionName[] {
    return Object.keys(this.optionsRegistry).sort() as any[];
  }

  private get optionsRegistry(): OptionsRegistry {
    return this.unibeautify.getOptionsSupportedForLanguage(this.language);
  }

  private get languageName(): string {
    return this.userData.language;
  }

  public fitness(entity: Entity): Promise<number> {
    return this.beautify(entity).then((beautifiedText: string) => {
      const diffCount = fastLevenshtein.get(this.desiredText, beautifiedText);
      const numOfBeautifiers = (<any>entity.options).beautifiers.length;
      const diffFitness: number = diffCount * 10000;
      if (diffCount !== 0) {
        return diffFitness;
      }
      const beautifierFitness: number =
        Math.max(0, numOfBeautifiers - 1) * 1000;
      const ignoreOptionKeys = ["beautifiers", "indent_size", "indent_style"];
      const optionsFitness: number = Math.max(
        0,
        _.without(_.keys(entity.options), ...ignoreOptionKeys).length
      );
      return beautifierFitness + optionsFitness;
    });
  }

  private beautify(entity: Entity) {
    const cleanEntity = this.cleanEntity(entity);
    return this.dataloader.load(cleanEntity);
  }

  private internalBeautify(entity: Entity) {
    const options: LanguageOptionValues = {
      [this.languageName]: entity.options,
    };
    const data = {
      languageName: this.languageName,
      options,
      text: this.text,
    };
    return this.unibeautify.beautify(data);
  }

  private get desiredText(): string {
    return this.userData.desiredText;
  }

  private get text(): string {
    return this.userData.originalText;
  }

  public shouldContinue({ population }: Genetic.GeneticState<Entity>) {
    const bestFitness = population[0].fitness;
    const isPerfect = bestFitness === 0;
    if (isPerfect) {
      return false;
    }
    const textIsTheSame = Math.floor(bestFitness / 10000) === 0;
    if (textIsTheSame) {
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

  notification({
    population,
    isFinished,
    generation,
    stats,
  }: Genetic.Notification<Entity>) {
    console.log(generation, population[0].fitness, isFinished);
    if (isFinished) {
      this.beautify(population[0].entity).then(beautifiedText => {
        console.log(`Solution after ${generation} generations:`);
        console.log(JSON.stringify(population[0], null, 2));
        console.log(JSON.stringify(stats, null, 2));
        console.log("-".repeat(20));
        console.log(this.desiredText);
        console.log("-".repeat(20));
        console.log(beautifiedText);
        console.log("-".repeat(20));
      });
    }
  }
}
