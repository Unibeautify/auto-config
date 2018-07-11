import { testGenetic } from "../testGenetic";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

testGenetic("break_chained_methods=false", {
  beautifiers: [jsBeautify],
  language: "JavaScript",
  originalText: `foo.bar().baz();`,
  desiredText: `foo.bar().baz();`,
});
