import { Beautifier } from "unibeautify";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";
// import prettyDiff from "@unibeautify/beautifier-prettydiff";
// import eslint from "@unibeautify/beautifier-eslint";

const beautifiers: Beautifier[] = <any[]>[
  prettier,
  jsBeautify,
  // prettyDiff,
  // eslint,
];

export default beautifiers;
