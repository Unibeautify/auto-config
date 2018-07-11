import { newUnibeautify, Beautifier, Option } from "unibeautify";
import prettier from "@unibeautify/beautifier-prettier";
// import jsBeautify from "@unibeautify/beautifier-js-beautify";

const beautifiers: Beautifier[] = [
  prettier,
  // jsBeautify,
];
const unibeautify = newUnibeautify();
unibeautify.loadBeautifiers(beautifiers);

const language = unibeautify.findLanguages({
  name: "JavaScript",
})[0];
const options = unibeautify.getOptionsSupportedForLanguage(language);
const finalCount = Object.keys(options).reduce((count, optionName) => {
  const option: Option = options[optionName];
  const valuesCount = exampleValues(option).length + 1;
  return count * valuesCount;
}, 1);
console.log("# of possible unique configs:", numberWithCommas(finalCount));

function exampleValues(option: Option): any[] {
  if (option.enum) {
    return option.enum;
  }
  switch (option.type) {
    case "boolean":
      return [true, false];
    case "integer": {
      const min = option.minimum || 0;
      const max = option.maximum || option.default * 2;
      return [option.default, min, max].sort();
    }
    case "array": {
      return [[], option.default];
    }
    default:
      return [option.default];
  }
}

function numberWithCommas(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
