import * as Genetic from "@glavin001/genetic-js";
import { Beautifier } from "unibeautify";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";
import fileBeautifier from "@unibeautify/beautifier-file";
// import * as fs from "fs";
// import * as path from "path";
// import * as _ from "lodash";
// import * as stringify from "json-stable-stringify";
import * as asciichart from "asciichart";

import { UserData, Entity } from "../src/index";
import { ConfigSolver } from "../src/ConfigSolver";

// const fixtureText = fs
//   .readFileSync(path.resolve(__dirname, "../test/fixtures/ReactElement.js"))
//   .toString();

const beautifiers: Beautifier[] = [prettier, jsBeautify, fileBeautifier];
const configuration: Partial<Genetic.Configuration> = {
  iterations: 30,
  // size: 50,
  // iterations: 1000,
  // size: 100,
  size: 200,
  crossover: 0.8,
  mutation: 0.5,
  // mutation: 0.75,
  // skip: 5,
  // iterations: 20,
  // size: 5,
  // crossover: 0.8,
  // mutation: 0.5,
  skip: 1,
};
const desiredText = `/** @format */\r\n\r\nif (true) {\r\n  console.log('hello world');\r\n  helloWorld();\r\n}\r\n`;

const userData: UserData = {
  beautifiers,
  language: "JavaScript",

  originalText: desiredText,
  desiredText,

  // originalText: `console.log("hello world");`,
  // desiredText: `/** @format */\n\nconsole.log('hello world')\n`,

  // originalText: `var bar = {bar: "baz", qux: "quux"};\nvar foo = {bar: "baz", qux: "quux"};`,
  // desiredText: `var bar = {\n  bar: "baz",\n  qux: "quux",\n};\nvar foo = {\n  bar: "baz",\n  qux: "quux",\n};\n`,

  // originalText: `if (true) { helloWorld(); }\nif (true) { helloWorld(); }`,
  // desiredText: `if (true) {\n     helloWorld();\n}\nif (true) {\n     helloWorld();\n}\n`,
  // desiredText: `if (true) {\r\n     helloWorld();\r\n}\r\nif (true) {\r\n     helloWorld();\r\n}`,
  // desiredText: `if (true) {\r\n     helloWorld();\r\n}\r\nif (true) {\r\n     helloWorld();\r\n}\r\n`,

  // originalText: `if (true) { helloWorld();\n helloWorld();\n}`,
  // desiredText: `if (true) {\nhelloWorld();\nhelloWorld();\n}\n`,
  // desiredText: `if (true) {\r\nhelloWorld();\r\nhelloWorld();\r\n}\r\n`,

  // originalText: `if (true) { helloWorld();\n helloWorld();\n}`,
  // desiredText: `if (true) { helloWorld();\n helloWorld();\n}\n`,
  // desiredText: `if (true) { helloWorld();\r\n helloWorld();\r\n}\r\n`,

  // originalText: `/** @format */\n\nconsole.log('hello world')\n`,
  // desiredText: `/** @format */\n\nconsole.log('hello world')\n`,

  // originalText: `console.log('hello world')\n`,
  // desiredText: `console.log('hello world')\n`,

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
    indent_size: 2,
    // "wrap_line_length": 160
    pragma_insert: true,
    quotes: "single",
  },
};

// const genetic = new UnibeautifyGenetic({
const genetic = new ConfigSolver({
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
  if (history.length > 5) {
    // console.log(history);
    console.log(asciichart.plot(history, { height: 20 }));
  }
  // if (isFinished) {
  Promise.all([
    this.beautify(this.originalText, bestFromPop.entity),
    this.beautify(this.originalText, desiredEntity),
  ]).then(([beautifiedText, desiredText]: [string, string]) => {
    console.log(`Solution after ${generation} generations:`);
    console.log(JSON.stringify(bestFromPop, null, 2));
    console.log(JSON.stringify(stats, null, 2));
    console.log(
      JSON.stringify(
        {
          fitness: bestFromPop.fitness,
          diff: this.diffCount(beautifiedText, desiredText),
          optionsUsed: this.optionsUsed(bestFromPop.entity),
          allOptions: this.optionsCount,
        },
        null,
        2
      )
    );

    // console.log("-".repeat(20));
    // console.log(`${"-".repeat(10)} Alternative Entities ${"-".repeat(10)}`);
    // const diffCount = Math.floor(bestFromPop.fitness / 10000);
    // _.uniqBy(
    //   population.filter(({ fitness }) => {
    //     return Math.floor(fitness / 10000) === diffCount;
    //   }),
    //   stringify
    // ).forEach((entity, index) => {
    //   console.log(`${"-".repeat(10)} Config ${index + 1} ${"-".repeat(10)}`);
    //   console.log(JSON.stringify(entity, null, 2));
    // });

    console.log(`${"-".repeat(10)} Desired Text ${"-".repeat(10)}`);
    console.log(this.desiredText);
    console.log(
      `${"-".repeat(10)} Text from Desired Options ${"-".repeat(10)}`
    );
    console.log(desiredText);
    console.log(`${"-".repeat(10)} Beautified Text ${"-".repeat(10)}`);
    console.log(beautifiedText);
    console.log("-".repeat(20));
    // console.log(history);
    console.log(asciichart.plot(history, { height: 40 }));
    console.log("-".repeat(20));

    console.log(
      `${(generation / this.configuration.iterations * 100).toFixed(
        2
      )}% progress... (${generation} of ${this.configuration.iterations})`
    );
  });
  // } else {
  //   population.slice(0, 1).forEach((entity, index) => {
  //     console.log(`${"-".repeat(10)} Config ${index + 1} ${"-".repeat(10)}`);
  //     console.log(JSON.stringify(entity, null, 2));
  //   });
  // }
};
genetic.evolve().catch(console.error);
