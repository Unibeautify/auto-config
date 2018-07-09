import * as Genetic from "@glavin001/genetic-js";
import Unibeautify, {
  OptionValues,
  OptionsRegistry,
  Language,
  LanguageOptionValues,
  Option,
} from "unibeautify";
import * as _ from "lodash";
import * as fastLevenshtein from "fast-levenshtein";

import beautifiers from "./beautifiers";

Unibeautify.loadBeautifiers(beautifiers);

interface Entity {
  options: OptionValues;
}

interface UserData {
  beautifiers: string[];
  language: string;
  originalText: string;
  desiredText: string;
}

class PhraseGenetic extends Genetic.Genetic<Entity, UserData> {
  optimize = Genetic.Optimize.Minimize;
  select1 = Genetic.Select1.Tournament2;
  select2 = Genetic.Select2.Tournament2;

  seed() {
    // const beautifierNames: string[] = beautifiers.map(b => b.name);
    const options: Entity["options"] = this.optionKeys.reduce(
      (options: Entity["options"], optionKey: string) => ({
        ...options,
        [optionKey]: this.randomValue(this.optionsRegistry[optionKey]),
      }),
      {
        beautifiers: _.shuffle(this.beautifierNames),
      } as any
    );
    return {
      options,
    };
  }

  private get beautifierNames(): string[] {
    return this.userData.beautifiers;
  }

  mutate(entity: Entity) {
    const shouldShuffleBeautifiers =
      Math.floor(Math.random() * (this.optionKeys.length + 1)) < 1;
    if (shouldShuffleBeautifiers) {
      return {
        ...entity,
        options: {
          ...entity.options,
          beautifiers: _.shuffle((<any>entity.options).beautifiers),
        },
      };
    }
    // console.log("mutate");
    const optionKey = this.randomOptionKey();
    const option = this.optionsRegistry[optionKey];
    return {
      ...entity,
      options: {
        ...entity.options,
        [optionKey]: this.randomValue(option),
      },
    };
  }

  private randomOptionKey(): string {
    const optionKeys = this.optionKeys;
    const len = optionKeys.length;
    const optionIndex = Math.floor(Math.random() * len);
    return optionKeys[optionIndex];
  }

  private randomValue(option: Option): any {
    if (Math.random() < 0.5) {
      return undefined;
    }
    const values = this.exampleValues(option);
    const valueIndex = Math.floor(Math.random() * values.length);
    return values[valueIndex];
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
    // console.log("crossover");
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

    const beautifiers = _.uniq([
      ...(<any>motherOptions)["beautifiers"],
      ...(<any>fatherOptions)["beautifiers"],
    ]);

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
    const son: Entity = {
      options: sonOptions,
    };
    const daughter: Entity = {
      options: daughterOptions,
    };
    return [son, daughter];
  }

  private get optionKeys(): string[] {
    return Object.keys(this.optionsRegistry).sort();
  }

  private get optionsRegistry(): OptionsRegistry {
    return Unibeautify.getOptionsSupportedForLanguage(this.language);
  }

  private get language(): Language {
    return Unibeautify.findLanguages({
      name: this.languageName,
    })[0];
  }

  private get languageName(): string {
    return this.userData.language;
  }

  fitness(entity: Entity): Promise<number> {
    return this.beautify(entity).then(beautifiedText => {
      const diffCount = fastLevenshtein.get(this.desiredText, beautifiedText);
      // console.log("fitness after", fitness, this.desiredText, beautifiedText);
      const fitness: number =
        diffCount * 100 + Math.max(0, _.keys(entity.options).length - 1);
      return fitness;
    });
  }

  private beautify(entity: Entity) {
    const options: LanguageOptionValues = {
      [this.languageName]: entity.options,
    };
    return Unibeautify.beautify({
      languageName: this.languageName,
      options,
      text: this.text,
    });
  }

  private get desiredText(): string {
    return this.userData.desiredText;
  }

  private get text(): string {
    return this.userData.originalText;
  }

  shouldContinue({ population, generation }: Genetic.GeneticState<Entity>) {
    // console.log("population", generation, population.length, population[0]);
    return population[0].fitness !== 0;
  }

  notification({
    population,
    isFinished,
    generation,
    stats,
  }: Genetic.Notification<Entity>) {
    console.log(generation, population[0].fitness, isFinished);
    if (isFinished) {
      // console.log(
      //   JSON.stringify({ solution: population[0], generation, stats }, null, 2)
      // );
      this.beautify(population[0].entity).then(beautifiedText => {
        console.log(
          "Solution",
          generation,
          stats,
          this.desiredText,
          beautifiedText,
          JSON.stringify(population[0], null, 2)
        );
      });
    } else {
    }
  }
}

const config: Partial<Genetic.Configuration> = {
  iterations: 100,
  size: 100,
  crossover: 0.3,
  mutation: 0.3,
  skip: 10,
  // iterations: 4000,
  // size: 250,
  // crossover: 0.3,
  // mutation: 0.3,
  // skip: 20,
};

const userData: UserData = {
  beautifiers: [
    "Prettier",
    "JS-Beautify"
  ],
  language: "JavaScript",

  originalText: `if(true){console.log({ hello: "world" });}`,
  // desiredText: `if(true){console.log({ hello: "world" });}`,
  desiredText: `if (true) {\n  console.log({hello: 'world'})\n}\n`,

  // originalText: `if(true){console.log("hello world");}`,
  // desiredText: `if (true) {\n  console.log('hello world')\n}\n`,

  // object_curly_spacing
  // originalText: `var obj = { foo: "bar" };`,
  // desiredText: `var obj = {foo: "bar"};\n`,

  // break_chained_methods
  // originalText: `this.$("#fileName").val().addClass("disabled")\n  .prop("disabled", true)\n`,
  // desiredText: `this.$("#fileName")\n  .val()\n  .addClass("disabled")\n  .prop("disabled", true)\n`,

};
const genetic = new PhraseGenetic(config, userData);
genetic.evolve();
