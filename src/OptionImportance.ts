import {
  BeautifierOptionName,
  OptionsRegistry,
  newUnibeautify,
  Unibeautify,
  Beautifier,
  Language,
  Option,
  Options,
  OptionValues,
} from "unibeautify";
import { UnibeautifyGenetic, Entity } from "./UnibeautifySolver";
import * as _ from "lodash";

export class ImportantOptionsRegistryBuilder {
  private readonly supportedOptionsRegistry: OptionsRegistry;
  protected readonly optionKeys: BeautifierOptionName[];

  constructor(private solver: UnibeautifyGenetic) {
    this.supportedOptionsRegistry = this.solver.optionsRegistry;
    this.optionKeys = Object.keys(
      this.supportedOptionsRegistry
    ).sort() as any[];
  }
  //   private readonly unibeautify: Unibeautify;
  //   private readonly language: Language;

  //   constructor(private userData: UserData) {
  //     this.unibeautify = newUnibeautify();
  //     this.initializeUnibeautify();
  //     this.language = this.getLanguage();
  //   }

  //   private initializeUnibeautify() {
  //     this.unibeautify.loadBeautifiers(this.beautifiers);
  //   }
  //   private get beautifiers(): Beautifier[] {
  //     return this.userData.beautifiers;
  //   }

  //   private getLanguage(): Language {
  //     return this.unibeautify.findLanguages({
  //       name: this.languageName,
  //     })[0];
  //   }

  //   private get languageName(): string {
  //     return this.userData.language;
  //   }

  //   protected get optionKeys(): BeautifierOptionName[] {
  //     return Object.keys(this.supportedOptionsRegistry).sort() as any[];
  //   }

  //   private get optionsRegistry(): OptionsRegistry {
  //     return this.unibeautify.getOptionsSupportedForLanguage(this.language);
  //   }

  public buildImportantOptionsRegistry(
    optionValues: OptionValues = {}
  ): Promise<OptionsRegistry> {
    return Promise.all(
      this.optionKeys.map((optionKey: BeautifierOptionName) => {
        return this.optionIsImportant(optionKey, optionValues);
      })
    )
      .then(shouldIncludeOptions => {
        return this.optionKeys.filter(
          (optionKeys, index) => shouldIncludeOptions[index]
        );
      })
      .then(includedOptions => {
        return _.pick(this.supportedOptionsRegistry, includedOptions);
      });
  }

  private optionIsImportant(
    optionKey: BeautifierOptionName,
    optionValues: OptionValues
  ): Promise<boolean> {
    const option = this.supportedOptionsRegistry[optionKey];
    const values = this.valuesForOption(option);
    return Promise.all(
      values.map(value =>
        this.fitness(optionKey, value, optionValues).then(fitness => {
          console.log("fitness", optionKey, fitness);
          return fitness;
        })
      )
    ).then(fitnesses => {
      const firstVal = fitnesses[0];
      const shouldInclude = !fitnesses.every(f => f === firstVal);
      console.log(
        "fitnesses",
        optionKey,
        shouldInclude,
        _.zipObject(values, fitnesses)
      );
      return shouldInclude;
    });
  }

  private valuesForOption(option: Option): any[] {
    return this.solver.exampleValues(option);
  }

  private fitness(
    optionKey: BeautifierOptionName,
    value: any,
    optionValues: OptionValues
  ): Promise<number> {
    // FIXME: Beautifier may support option and not language
    const beautifiers = this.solver.unibeautify.getBeautifiersSupportingOption(
      optionKey
    );
    const beautifierNames: string[] = beautifiers.map(
      beautifier => beautifier.name
    );
    const entity: Entity = {
      options: {
        ...({
          beautifiers: beautifierNames,
        } as any),
        indent_size: 2,
        indent_style: "space",
        ...optionValues,
        [optionKey]: value,
      },
    };
    return this.solver.fitness(entity);
  }
}

// export interface UserData {
//   beautifiers: Beautifier[];
//   language: string;
//   desiredText: string;
// }
