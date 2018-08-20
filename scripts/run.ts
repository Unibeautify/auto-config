import * as Genetic from "@glavin001/genetic-js";
import { Beautifier } from "unibeautify";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";
import fileBeautifier from "@unibeautify/beautifier-file";
// import * as fs from "fs";
// import * as path from "path";
import * as _ from "lodash";
import * as stringify from "json-stable-stringify";
import * as asciichart from "asciichart";

import { UnibeautifyGenetic, UserData, Entity } from "../src/index";

// const fixtureText = fs
//   .readFileSync(path.resolve(__dirname, "../test/fixtures/ReactElement.js"))
//   .toString();

const beautifiers: Beautifier[] = [prettier, jsBeautify, fileBeautifier];
const configuration: Partial<Genetic.Configuration> = {
  iterations: 200,
  size: 50,
  crossover: 0.8,
  mutation: 0.5,
  // skip: 10,
  // iterations: 20,
  // size: 5,
  // crossover: 0.8,
  // mutation: 0.5,
  skip: 1,
};
const userData: UserData = {
  beautifiers,
  language: "JavaScript",

  // originalText: `console.log("hello world");`,
  // desiredText: `/** @format */\n\nconsole.log('hello world')\n`,

  // originalText: `var bar = {bar: "baz", qux: "quux"};\nvar foo = {bar: "baz", qux: "quux"};`,
  // desiredText: `var bar = {\n  bar: "baz",\n  qux: "quux",\n};\nvar foo = {\n  bar: "baz",\n  qux: "quux",\n};\n`,

  originalText: `if (true) { helloWorld(); }\nif (true) { helloWorld(); }`,
  // desiredText: `if (true) {\n     helloWorld();\n}\nif (true) {\n     helloWorld();\n}\n`,
  // desiredText: `if (true) {\r\n     helloWorld();\r\n}\r\nif (true) {\r\n     helloWorld();\r\n}`,
  desiredText: `if (true) {\r\n     helloWorld();\r\n}\r\nif (true) {\r\n     helloWorld();\r\n}\r\n`,

  // originalText: `if (true) { helloWorld();\n helloWorld();\n}`,
  // desiredText: `if (true) {\nhelloWorld();\nhelloWorld();\n}\n`,
  // desiredText: `if (true) {\r\nhelloWorld();\r\nhelloWorld();\r\n}\r\n`,

  // originalText: `if (true) { helloWorld();\n helloWorld();\n}`,
  // desiredText: `if (true) { helloWorld();\n helloWorld();\n}\n`,
  // desiredText: `if (true) { helloWorld();\r\n helloWorld();\r\n}\r\n`,

  // originalText: fixtureText,
  // desiredText: fixtureText,
};
const desiredEntity: Entity = {
  options: {
    ...({
      beautifiers: [
        // "JS-Beautify",
        "Prettier",
        "File",
      ],
    } as any),
    // "arrow_parens": "always",
    // "comma_first": true,
    end_with_newline: true,
    end_of_line: "CRLF",
    // "end_with_semicolon": true,
    indent_size: 0,
    // "wrap_line_length": 160
  },
};

const genetic = new UnibeautifyGenetic({
  configuration,
  userData,
});

const history: number[] = [];
genetic.notification = function({
  population,
  isFinished,
  generation,
  stats,
}: Genetic.Notification<Entity>) {
  const bestFromPop = population[0];
  console.log(generation, bestFromPop.fitness, isFinished, stats);
  console.log(`[ ${population.map(entity => entity.fitness).join(", ")} ]`);
  history.push(bestFromPop.fitness);
  if (history.length > 3) {
    console.log(asciichart.plot(history, { height: 20 }));
  }
  if (isFinished) {
    Promise.all([
      this.beautify(bestFromPop.entity),
      this.beautify(desiredEntity),
    ]).then(([beautifiedText, desiredText]: [string, string]) => {
      console.log(`Solution after ${generation} generations:`);
      console.log(JSON.stringify(bestFromPop, null, 2));
      console.log(JSON.stringify(stats, null, 2));

      console.log("-".repeat(20));
      console.log(`${"-".repeat(10)} Alternative Entities ${"-".repeat(10)}`);
      const diffCount = Math.floor(bestFromPop.fitness / 10000);
      _.uniqBy(
        population.filter(({ fitness }) => {
          return Math.floor(fitness / 10000) === diffCount;
        }),
        stringify
      ).forEach((entity, index) => {
        console.log(`${"-".repeat(10)} Config ${index + 1} ${"-".repeat(10)}`);
        console.log(JSON.stringify(entity, null, 2));
      });

      console.log(`${"-".repeat(10)} Desired Text ${"-".repeat(10)}`);
      console.log(this.desiredText);
      // console.log(`${"-".repeat(10)} Text from Desired Options ${"-".repeat(10)}`);
      // console.log(desiredText);
      console.log(`${"-".repeat(10)} Beautified Text ${"-".repeat(10)}`);
      console.log(beautifiedText);
      console.log("-".repeat(20));
      // console.log(history);
      console.log(asciichart.plot(history, { height: 40 }));
    });
  } else {
    population.slice(0, 1).forEach((entity, index) => {
      console.log(`${"-".repeat(10)} Config ${index + 1} ${"-".repeat(10)}`);
      console.log(JSON.stringify(entity, null, 2));
    });
  }
};
genetic.evolve().catch(console.error);
