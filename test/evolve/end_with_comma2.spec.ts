import { testGenetic } from "../testGenetic";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

testGenetic("end_with_comma2", {
  beautifiers: [jsBeautify],
  language: "JavaScript",
  originalText: `var bar = {bar: "baz", qux: "quux"};\nvar foo = {bar: "baz", qux: "quux"};`,
  desiredText: `var bar = {\n  bar: "baz",\n  qux: "quux",\n};\nvar foo = {\n  bar: "baz",\n  qux: "quux",\n};`,
});
