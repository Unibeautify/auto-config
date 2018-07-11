import { testGenetic } from "../testGenetic";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

testGenetic("arrow_parens", {
  beautifiers: [prettier, jsBeautify],
  language: "JavaScript",
  originalText: `a => {};`,
  desiredText: `(a) => {};`,
});
