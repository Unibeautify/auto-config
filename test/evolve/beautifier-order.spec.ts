import { testGenetic } from "../testGenetic";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

testGenetic("beautifier-order", {
  beautifiers: [prettier, jsBeautify],
  language: "JavaScript",
  originalText: `const fun1 = function (arg1) {
}
const fun2 = function(arg1) {
}

var foo = {
    bar: "baz",
    qux: "quux",
};

var bar = {
    bar: "baz",
    qux: "quux"
};

`,
  desiredText: `/** @format */

const fun1 = function ( arg1 ) {}
const fun2 = function ( arg1 ) {}

var foo = {
    bar: "baz"
    , qux: "quux"
, }

var bar = {
    bar: "baz"
    , qux: "quux"
, }
`,
});
