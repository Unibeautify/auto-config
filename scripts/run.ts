import * as Genetic from "@glavin001/genetic-js";
import { Beautifier } from "unibeautify";
import prettier from "@unibeautify/beautifier-prettier";
// import jsBeautify from "@unibeautify/beautifier-js-beautify";

import { UnibeautifyGenetic, UserData, Entity } from "../src/index";

const beautifiers: Beautifier[] = [
  prettier,
  // jsBeautify,
];
const configuration: Partial<Genetic.Configuration> = {
  iterations: 500,
  size: 50,
  crossover: 0.8,
  mutation: 0.5,
  skip: 10,
};
const userData: UserData = {
  beautifiers,
  language: "JavaScript",
  originalText: `console.log("hello world");`,
  desiredText: `/** @format */\n\nconsole.log('hello world')\n`,
  // originalText: `var bar = {bar: "baz", qux: "quux"};\nvar foo = {bar: "baz", qux: "quux"};`,
  // desiredText: `var bar = {\n  bar: "baz",\n  qux: "quux",\n};\nvar foo = {\n  bar: "baz",\n  qux: "quux",\n};\n`,
};
const genetic = new UnibeautifyGenetic({
  configuration,
  userData,
});

genetic.notification = function({
  population,
  isFinished,
  generation,
  stats,
}: Genetic.Notification<Entity>) {
  console.log(generation, population[0].fitness, isFinished, stats);
  console.log(`[ ${population.map(entity => entity.fitness).join(", ")} ]`);
  if (isFinished) {
    this.beautify(population[0].entity).then((beautifiedText: string) => {
      console.log(`Solution after ${generation} generations:`);
      console.log(JSON.stringify(population[0], null, 2));
      console.log(JSON.stringify(stats, null, 2));
      console.log(`${"-".repeat(10)} Desired Text ${"-".repeat(10)}`);
      console.log(this.desiredText);
      console.log(`${"-".repeat(10)} Beautified Text ${"-".repeat(10)}`);
      console.log(beautifiedText);
      console.log("-".repeat(20));
    });
  } else {
    population.slice(0, 5).forEach((entity, index) => {
      console.log(`${"-".repeat(10)} Config ${index + 1} ${"-".repeat(10)}`);
      console.log(JSON.stringify(entity, null, 2));
    });
  }
};
genetic.evolve().catch(console.error);
