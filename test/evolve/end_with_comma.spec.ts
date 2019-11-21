import { testGenetic } from "../testGenetic";
// import jsBeautify from "@unibeautify/beautifier-js-beautify";
import prettier from "@unibeautify/beautifier-prettier";

testGenetic(
  "end_with_comma",
  {
    beautifiers: [prettier],
    language: "JavaScript",
    originalText: `var bar = {bar: "baz", qux: "quux"};`,
    desiredText: `var bar = {\n  bar: "baz",\n  qux: "quux",\n};\n`,
  },
  true
);

// testGenetic("end_with_comma", {
//   beautifiers: [prettier],
//   language: "JavaScript",
//   originalText: `var bar = {\n    bar: "baz",\n    qux: "quux"\n};`,
//   desiredText: `var bar = {\n    bar: "baz",\n    qux: "quux",\n};`,
// });
