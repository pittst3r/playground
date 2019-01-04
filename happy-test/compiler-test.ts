import compile from "./compiler";
import { VM } from "./vm";
import { browser, assert } from "./opcodes";
import { readFileSync } from "fs";

const program = readFileSync("./test.foo").toString();
const instance = new VM(conf => {
  browser(conf);
  assert(conf);
});
const compiled = compile(program);

instance.load(compiled);
instance.run();
