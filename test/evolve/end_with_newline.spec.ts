import { testGenetic } from "../testGenetic";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";
import fileBeautifier from "@unibeautify/beautifier-file";

testGenetic("end_with_newline1", {
  beautifiers: [prettier, jsBeautify, fileBeautifier],
  language: "JavaScript",
  originalText: `if (true) { helloWorld();\n helloWorld();\n}`,
  desiredText: `if (true) {\r\nhelloWorld();\r\nhelloWorld();\r\n}\r\n`,
});

testGenetic("end_with_newline2", {
  beautifiers: [prettier, jsBeautify, fileBeautifier],
  language: "JavaScript",
  originalText: `if (true) { helloWorld();\n helloWorld();\n}`,
  desiredText: `if (true) {\nhelloWorld();\nhelloWorld();\n}\n`,
});

testGenetic("end_with_newline3", {
  beautifiers: [prettier, jsBeautify, fileBeautifier],
  language: "JavaScript",
  originalText: `if (true) { helloWorld();\n helloWorld();\n}`,
  desiredText: `if (true) {\nhelloWorld();\nhelloWorld();\n}`,
});
