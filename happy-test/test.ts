import { VM, Builtin } from "./vm";
import { browser, Browser, assert, Assert } from "./opcodes";
import { feature, scenario, when, then, should, StepDef, and } from "./jherkin";

const vm = new VM(conf => {
  browser(conf);
  assert(conf);
});

const visit: StepDef<[string]> = function([url]) {
  return [Builtin.Push, url, Browser.VisitUrl];
};

const element: StepDef<[string]> = function([selector]) {
  return [Builtin.Push, selector, Browser.Select];
};

const clickLink: StepDef<[string]> = function([text]) {
  return [
    Builtin.Push,
    text,
    Builtin.Push,
    "a",
    Browser.FindText,
    Browser.ClickLink
  ];
};

const haveText: StepDef<[string]> = function([expected], offset) {
  const test = [Browser.TextContent, Builtin.Push, expected, Assert.Equal];
  const resultHandler = [
    Builtin.Push,
    offset + test.length + 8,
    Builtin.JumpIf,
    Builtin.Push,
    "    FAIL: ",
    Builtin.Push,
    offset + test.length + 10,
    Builtin.Jump,
    Builtin.Push,
    "    PASS: ",
    Builtin.Concat,
    Builtin.Log
  ];

  return [...test, ...resultHandler];
};

const feat = feature(
  "browser works",
  scenario(
    "base case",
    when(visit, "https://www.example.com"),
    then(element, "h1"),
    should(haveText, "Example Domain")
  ),
  scenario(
    "more complex",
    when(visit, "https://www.example.com"),
    and(clickLink, "More information..."),
    then(element, "h1"),
    should(haveText, "IANA-managed Reserved Domains")
  )
);

async function runTests() {
  vm.load(feat);
  await vm.run();
}

runTests().catch(err => {
  console.error(err);
});
