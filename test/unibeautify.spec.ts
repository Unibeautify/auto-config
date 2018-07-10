import * as Genetic from "@glavin001/genetic-js";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

import { raw } from "./raw-serializer";
import { UnibeautifyGenetic, UserData, Entity } from "../src/index";

describe("evolve", () => {
  testGenetic("pragma_insert", {
    beautifiers: [prettier, jsBeautify],
    language: "JavaScript",
    originalText: `console.log("hello world");`,
    desiredText: `/** @format */\n\nconsole.log('hello world')\n`,
  });

  testGenetic("arrow_parens", {
    beautifiers: [prettier, jsBeautify],
    language: "JavaScript",
    originalText: `a => {};`,
    desiredText: `(a) => {};`,
  });

  testGenetic("comma_first", {
    beautifiers: [prettier, jsBeautify],
    language: "JavaScript",
    originalText: `const a = "a", b = "b", c = "c";`,
    desiredText: `const a = "a"\n  , b = "b"\n  , c = "c";`,
  });

  testGenetic("test1", {
    beautifiers: [prettier, jsBeautify],
    language: "JavaScript",
    originalText: `if(true){console.log({ hello: "world" });}`,
    desiredText: `if(true){console.log({ hello: "world" });}`,
  });

  testGenetic("quotes + object_curly_spacing", {
    beautifiers: [prettier, jsBeautify],
    language: "JavaScript",
    originalText: `if(true){console.log({ hello: "world" });}`,
    desiredText: `if (true) {\n  console.log({hello: 'world'})\n}\n`,
  });

  testGenetic("indent_size + quotes + object_curly_spacing", {
    beautifiers: [prettier, jsBeautify],
    language: "JavaScript",
    originalText: `if(true){console.log({ hello: "world" });}`,
    desiredText: `if (true) {\n  console.log({hello: 'world'})\n}\n`,
  });

  testGenetic("quotes", {
    beautifiers: [prettier, jsBeautify],
    language: "JavaScript",
    originalText: `if(true){console.log("hello world");}`,
    desiredText: `if (true) {\n  console.log('hello world')\n}\n`,
  });

  testGenetic("object_curly_spacing", {
    beautifiers: [prettier, jsBeautify],
    language: "JavaScript",
    originalText: `var obj = { foo: "bar" };`,
    desiredText: `var obj = {foo: "bar"};\n`,
  });

  // testGenetic("end_with_comma", {
  //   beautifiers: [jsBeautify],
  //   language: "JavaScript",
  //   originalText: `var bar = {bar: "baz", qux: "quux"};`,
  //   desiredText: `var bar = {\n    bar: "baz",\n    qux: "quux",\n};`,
  // });

  // testGenetic("end_with_comma2", {
  //   beautifiers: [jsBeautify],
  //   language: "JavaScript",
  //   originalText: `var bar = {bar: "baz", qux: "quux"};\nvar foo = {bar: "baz", qux: "quux"};`,
  //   desiredText: `var bar = {\n  bar: "baz",\n  qux: "quux",\n};\nvar foo = {\n  bar: "baz",\n  qux: "quux",\n};`,
  // });

  testGenetic("break_chained_methods=true", {
    beautifiers: [jsBeautify],
    language: "JavaScript",
    originalText: `foo.bar().baz();`,
    desiredText: `foo.bar()\n  .baz();`,
  });

  // testGenetic("break_chained_methods=false", {
  //   beautifiers: [jsBeautify],
  //   language: "JavaScript",
  //   originalText: `foo.bar().baz();`,
  //   desiredText: `foo.bar().baz();`,
  // });

  testGenetic("break_chained_methods1", {
    beautifiers: [prettier, jsBeautify],
    language: "JavaScript",
    originalText: `this.$("#fileName").val().addClass("disabled")\n  .prop("disabled", true)`,
    desiredText: `this.$("#fileName")\n  .val()\n  .addClass("disabled")\n  .prop("disabled", true)\n`,
  });

  testGenetic("break_chained_methods2", {
    beautifiers: [prettier, jsBeautify],
    language: "JavaScript",
    originalText: `this.$("#fileName").val().addClass("disabled")\n  .prop("disabled", true)`,
    desiredText: `this.$("#fileName").val().addClass("disabled")\n  .prop("disabled", true)`,
  });
});

function testGenetic(title: string, userData: UserData) {
  const configuration: Partial<Genetic.Configuration> = {
    iterations: 100,
    size: 50,
    crossover: 0.8,
    mutation: 0.8,
    skip: 100,
  };
  test(title, done => {
    expect.hasAssertions();
    const genetic = new UnibeautifyGenetic({
      configuration,
      userData,
    });
    genetic.notification = function({
      population,
      isFinished,
    }: Genetic.Notification<Entity>) {
      if (isFinished) {
        this.beautify(population[0].entity).then((beautifiedText: string) => {
          expect(raw(beautifiedText)).toMatchSnapshot("beautifiedText");
          expect(population[0].entity).toMatchSnapshot("entity");
          expect(population[0].fitness).toMatchSnapshot("fitness");
          // expect(population[0]).toMatchSnapshot('');
          // expect(population[0].entity).toMatchSnapshot("entity");
          done();
        });
      }
    };
    return genetic.evolve().catch(error => {
      console.error(error);
      done();
    });
  });
}
