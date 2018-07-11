import { testGenetic } from "../testGenetic";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

testGenetic("indent_size + quotes + object_curly_spacing", {
  beautifiers: [prettier, jsBeautify],
  language: "JavaScript",
  originalText: `if(true){console.log({ hello: "world" });}`,
  desiredText: `if (true) {\n  console.log({hello: 'world'})\n}\n`,
});
