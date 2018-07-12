import { testGenetic } from "../testGenetic";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

testGenetic("indent_size=2", {
  beautifiers: [prettier, jsBeautify],
  language: "JavaScript",
  originalText: `if (true) { helloWorld(); }`,
  desiredText: `if (true) {\n  helloWorld();\n}`,
});

testGenetic(
  "indent_size=4",
  {
    beautifiers: [prettier, jsBeautify],
    language: "JavaScript",
    originalText: `if (true) { helloWorld(); }`,
    desiredText: `if (true) {\n    helloWorld();\n}`,
  },
  true
);

testGenetic("indent_size=3", {
  beautifiers: [prettier, jsBeautify],
  language: "JavaScript",
  originalText: `if (true) { helloWorld(); }`,
  desiredText: `if (true) {\n   helloWorld();\n}`,
});

testGenetic("indent_size=5", {
  beautifiers: [prettier, jsBeautify],
  language: "JavaScript",
  originalText: `if (true) { helloWorld(); }\nif (true) { helloWorld(); }`,
  desiredText: `if (true) {\n     helloWorld();\n}\nif (true) {\n     helloWorld();\n}\n`,
});
