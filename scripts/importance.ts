import { Beautifier } from "unibeautify";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";
import fileBeautifier from "@unibeautify/beautifier-file";

import {
  ImportantOptionsRegistryBuilder,
} from "../src/OptionImportance";

const beautifiers: Beautifier[] = [prettier, jsBeautify, fileBeautifier];

const desiredText = `/** @format */\r\n\r\nif (true) {\r\n  console.log('hello world');\r\n  helloWorld();\r\n}\r\n`;

const userData: UserData = {
  beautifiers,
  language: "JavaScript",
  desiredText,
};

const builder = new ImportantOptionsRegistryBuilder(userData);
builder.buildImportantOptionsRegistry().then(registry => {
  console.log(JSON.stringify(registry, null, 2));
});
