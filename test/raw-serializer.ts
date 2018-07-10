const RAW = Symbol.for("raw");

export function print(val: any): any {
  return val[RAW];
}

export function test(val: any): any {
  return (
    val &&
    Object.prototype.hasOwnProperty.call(val, RAW) &&
    typeof val[RAW] === "string"
  );
}

/**
 * Wraps a string in a marker object that is used by `./raw-serializer.js` to
 * directly print that string in a snapshot without escaping all double quotes.
 * Backticks will still be escaped.
 */
export function raw(value: string) {
  if (typeof value !== "string") {
    throw new Error("Raw snapshots have to be strings.");
  }
  return { [Symbol.for("raw")]: value };
}
