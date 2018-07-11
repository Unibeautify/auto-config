import { testGenetic } from "../testGenetic";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

testGenetic("object_curly_spacing", {
  beautifiers: [prettier, jsBeautify],
  language: "JavaScript",
  originalText: `var obj = { foo: "bar" };`,
  desiredText: `var obj = {foo: "bar"};\n`,
});
