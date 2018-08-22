import { testGenetic } from "../testGenetic";
import prettier from "@unibeautify/beautifier-prettier";
import jsBeautify from "@unibeautify/beautifier-js-beautify";

describe("break_chained_methods", () => {
  testGenetic("break_chained_methods=true", {
    beautifiers: [jsBeautify],
    language: "JavaScript",
    originalText: `foo.bar().baz();`,
    desiredText: `foo.bar()\n  .baz();`,
  });

  testGenetic(
    "break_chained_methods1",
    {
      beautifiers: [prettier, jsBeautify],
      language: "JavaScript",
      originalText: `this.$("#fileName").val().addClass("disabled")\n  .prop("disabled", true)`,
      desiredText: `this.$("#fileName")\n  .val()\n  .addClass("disabled")\n  .prop("disabled", true)\n`,
    },
    true
  );

  testGenetic(
    "break_chained_methods2",
    {
      beautifiers: [prettier, jsBeautify],
      language: "JavaScript",
      originalText: `this.$("#fileName").val().addClass("disabled")\n  .prop("disabled", true)`,
      desiredText: `this.$("#fileName").val().addClass("disabled")\n  .prop("disabled", true)`,
    },
    true
  );
});
