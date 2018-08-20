import { Beautifier } from "unibeautify";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";
// import prettyDiff from "@unibeautify/beautifier-prettydiff";
// import eslint from "@unibeautify/beautifier-eslint";
import fileBeautifier from "@unibeautify/beautifier-file";

const beautifiers: Beautifier[] = <any[]>[
  prettier,
  jsBeautify,
  fileBeautifier,
  // prettyDiff,
  // eslint,
];

export default beautifiers;
