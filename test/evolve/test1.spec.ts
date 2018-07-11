import { testGenetic } from "../testGenetic";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

testGenetic("test1", {
  beautifiers: [prettier, jsBeautify],
  language: "JavaScript",
  originalText: `if(true){console.log({ hello: "world" });}`,
  desiredText: `if(true){console.log({ hello: "world" });}`,
});
