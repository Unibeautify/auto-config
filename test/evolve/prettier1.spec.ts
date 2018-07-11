import { testGenetic } from "../testGenetic";
import prettier from "@unibeautify/beautifier-prettier";

testGenetic("prettier1", {
  beautifiers: [prettier],
  language: "JavaScript",
  originalText: `var foo = {
    bar: "baz",
    qux: "quux",
};

var bar = {
    bar: "baz",
    qux: "quux"
};
`,
  desiredText: `/** @format */

var foo = {
  bar: "baz",
  qux: "quux",
}

var bar = {
  bar: "baz",
  qux: "quux",
}
`,
});
