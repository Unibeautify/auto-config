import { testGenetic } from "../testGenetic";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

testGenetic("end_with_comma", {
  beautifiers: [jsBeautify],
  language: "JavaScript",
  originalText: `var bar = {bar: "baz", qux: "quux"};`,
  desiredText: `var bar = {\n    bar: "baz",\n    qux: "quux",\n};`,
});
