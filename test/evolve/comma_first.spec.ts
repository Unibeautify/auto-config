import { testGenetic } from "../testGenetic";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

testGenetic("comma_first", {
  beautifiers: [prettier, jsBeautify],
  language: "JavaScript",
  originalText: `const a = "a", b = "b", c = "c";`,
  desiredText: `const a = "a"\n  , b = "b"\n  , c = "c";`,
});
