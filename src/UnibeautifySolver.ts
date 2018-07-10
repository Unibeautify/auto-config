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

// import beautifiers from "./beautifiers";

export interface Entity {
  options: OptionValues;
}

export interface UserData {
  // beautifiers: string[];
  beautifiers: Beautifier[];
  language: string;
  originalText: string;
  desiredText: string;
}

export class UnibeautifyGenetic extends Genetic.Genetic<Entity, UserData> {
  optimize = Genetic.Optimize.Minimize;
  // select1 = Genetic.Select1.Fittest;
  // select2 = Genetic.Select2.FittestRandom;
  select1 = Genetic.Select1.Tournament3;
  select2 = Genetic.Select2.Tournament3;

  private readonly unibeautify: Unibeautify;
  // private readonly beautifiers: Beautifier[];

  constructor({
    // beautifiers,
    configuration,
    userData,
  }: {
    // beautifiers: Beautifier[];
    configuration: Partial<Genetic.Configuration>;
    userData: UserData;
  }) {
    super(configuration, userData);
    // this.beautifiers = beautifiers;
    this.unibeautify = newUnibeautify();
    this.initializeUnibeautify();
  }

  private initializeUnibeautify() {
    this.unibeautify.loadBeautifiers(this.beautifiers);
  }

  private get beautifiers(): Beautifier[] {
    return this.userData.beautifiers;
  }

  seed() {
    // const options: Entity["options"] = this.optionKeys.reduce(
    //   (options: Entity["options"], optionKey: string) => ({
    //     ...options,
    //     [optionKey]: this.randomValue(this.optionsRegistry[optionKey]),
    //   }),
    //   {
    //     // beautifiers: _.shuffle(this.supportedBeautifierNames),
    //     beautifiers: _.sampleSize(
    //       this.supportedBeautifierNames,
    //       _.random(1, this.supportedBeautifierNames.length)
    //     ),
    //   } as any
    // );
    const beautifiers = _.sampleSize(
      this.supportedBeautifierNames,
      _.random(1, this.supportedBeautifierNames.length)
    );
    const options: Entity["options"] = this.optionKeysForBeautifiers(
      beautifiers
    ).reduce(
      (options: Entity["options"], optionKey: string) => ({
        ...options,
        [optionKey]: this.randomValue(this.optionsRegistry[optionKey]),
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
    return this.cleanEntity2(entity);
    // return entity;
  }

  private cleanEntity2(entity: Entity): Entity {
    // this.doesSupportOption;
    // return entity;
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
    // return true;
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

  mutate(entity: Entity) {
    const enabledBeautifiers = (<any>entity.options).beautifiers;
    const hasMultipleBeautifiers = enabledBeautifiers.length > 1;

    const extraOperations = 3;
    const chosenOperation = Math.floor(
      Math.random() * (this.optionKeys.length + extraOperations)
    );

    switch (chosenOperation) {
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
        // Shuffle Beautifier
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
    }

    const optionKey = this.randomOptionKeyForBeautifiers(enabledBeautifiers);
    const option = this.optionsRegistry[optionKey];
    return this.cleanEntity({
      ...entity,
      options: {
        ...entity.options,
        [optionKey]: this.randomValue(option),
      },
    });
  }

  private randomOptionKeyForBeautifiers(
    beautifierNames: string[]
  ): BeautifierOptionName {
    return this.randomItemFromArray(
      this.optionKeysForBeautifiers(beautifierNames)
    );
  }

  private optionKeysForBeautifiers(
    beautifierNames: string[]
  ): BeautifierOptionName[] {
    return this.optionKeys.filter(optionName =>
      this.doesSupportOption(optionName, beautifierNames)
    );
  }

  // private randomOptionKey(): string {
  //   const optionKeys = this.optionKeys;
  //   return this.randomItemFromArray(optionKeys);
  // }

  private randomItemFromArray<T>(arr: T[]): T {
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
  }

  private randomValue(option: Option): any {
    const values = this.exampleValues(option);
    const valuesWithUndefined = [...values, undefined];
    // if (Math.random() < 0.1) {
    //   return undefined;
    // }
    return this.randomItemFromArray(valuesWithUndefined);
    // const valueIndex = Math.floor(Math.random() * valuesWithUndefined.length);
    // return valuesWithUndefined[valueIndex];
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

  crossover(mother: Entity, father: Entity): [Entity, Entity] {
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

  // private language: Language = this.getLanguage();
  // private getLanguage(): Language {
  private get language(): Language {
    return this.unibeautify.findLanguages({
      name: this.languageName,
    })[0];
  }

  private get languageName(): string {
    return this.userData.language;
  }

  fitness(entity: Entity): Promise<number> {
    // console.log("fitness", entity);
    return this.beautify(entity).then((beautifiedText: string) => {
      // console.log("beautifiedText", beautifiedText);
      const diffCount = fastLevenshtein.get(this.desiredText, beautifiedText);
      const numOfBeautifiers = (<any>entity.options).beautifiers.length;
      const diffFitness: number = diffCount * 10000;
      const beautifierFitness: number =
        Math.max(0, numOfBeautifiers - 1) * 1000;
      const optionsFitness: number = Math.max(
        0,
        _.keys(entity.options).length - 2
      );
      return diffFitness + beautifierFitness + optionsFitness;
      // const fitness: number =
      //   diffCount * 1000 +
      //   Math.max(0, numOfBeautifiers - 1) +
      //   Math.max(0, _.keys(entity.options).length - 2);
      // return fitness;
    });
  }

  private beautify(entity: Entity) {
    const cleanEntity = this.cleanEntity2(entity);
    return this.dataloader.load(cleanEntity);
  }

  private dataloader = new DataLoader<Entity, string>(
    entities => Promise.all(entities.map(entity => this._beautify(entity))),
    {
      cacheKeyFn: stringify,
    }
  );

  private _beautify(entity: Entity) {
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

  shouldContinue({
    population,
    generation,
    stats,
  }: Genetic.GeneticState<Entity>) {
    const bestFitness = population[0].fitness;
    const isPerfect = bestFitness === 0;
    if (isPerfect) {
      return false;
    }
    // const allowedBeautifiers = 2;
    const textIsTheSame = Math.floor(bestFitness / 10000) === 0;
    // const numOfBeautifiers = Math.floor(bestFitness / 1000);
    // if (textIsTheSame && numOfBeautifiers <= allowedBeautifiers) {
    //   return false;
    // }
    if (textIsTheSame) {
      const bestEntities = population.filter(
        entity => entity.fitness === bestFitness
      );
      if (bestEntities.length > 10) {
        // if (bestEntities.length > 50) {
        //   return false;
        // }
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
        // console.log(
        //   "Solution",
        //   generation,
        //   stats,
        //   this.desiredText,
        //   beautifiedText,
        //   JSON.stringify(population[0], null, 2)
        // );

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

// const configuration: Partial<Genetic.Configuration> = {
//   iterations: 200,
//   size: 100,
//   crossover: 0.3,
//   mutation: 0.3,
//   skip: 10,
//   // iterations: 4000,
//   // size: 250,
//   // crossover: 0.3,
//   // mutation: 0.3,
//   // skip: 20,
// };

// const userData: UserData = {
//   // beautifiers: ["Prettier", "JS-Beautify"],
//   beautifiers,
//   language: "JavaScript",

//   // originalText: `if(true){console.log({ hello: "world" });}`,
//   // desiredText: `if(true){console.log({ hello: "world" });}`,
//   // desiredText: `if (true) {\n  console.log({hello: 'world'})\n}\n`,
//   // desiredText: `if (true) {\n   console.log({hello: 'world'})\n}\n`,

//   // originalText: `if(true){console.log("hello world");}`,
//   // desiredText: `if (true) {\n  console.log('hello world')\n}\n`,

//   // object_curly_spacing
//   // originalText: `var obj = { foo: "bar" };`,
//   // desiredText: `var obj = {foo: "bar"};\n`,

//   // comma_first
//   // originalText: `const a = "a", b = "b", c = "c";`,
//   // desiredText: `const a = "a"\n  , b = "b"\n  , c = "c";`,

//   // end_with_comma
//   // originalText: `var bar = {bar: "baz", qux: "quux"};`,
//   // desiredText: `var bar = {\n     bar: "baz",\n    qux: "quux",\n};\n`,

//   // break_chained_methods
//   // originalText: `this.$("#fileName").val().addClass("disabled")\n  .prop("disabled", true)`,
//   // desiredText: `this.$("#fileName")\n  .val()\n  .addClass("disabled")\n  .prop("disabled", true)\n`,
//   // desiredText: `this.$("#fileName").val().addClass("disabled")\n  .prop("disabled", true)`,

//   // arrow_parens
//   // originalText: `a => {};`,
//   // desiredText: `(a) => {};`,
//   // desiredText: `a => {};`,

//   // pragma_insert
//   originalText: `console.log("hello world");`,
//   desiredText: `/** @format */\nconsole.log('hello world')\n`,
// };
// const genetic = new UnibeautifyGenetic({
//   configuration,
//   userData,
// });
// genetic.evolve();
