import { testGenetic } from "../testGenetic";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

testGenetic("pragma_insert", {
  beautifiers: [prettier, jsBeautify],
  language: "JavaScript",
  originalText: `console.log("hello world");`,
  desiredText: `/** @format */\n\nconsole.log('hello world')\n`,
});
