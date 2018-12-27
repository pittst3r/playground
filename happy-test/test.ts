import { VM, Builtin, InstructionList } from "./vm";
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
  return [
    Builtin.PushVar,
    0,
    Browser.TextContent,
    Builtin.Push,
    expected,
    Assert.Equal,
    ...ifElse(
      offset + 6,
      [Builtin.Push, "    PASS: "],
      [Builtin.Push, "    FAIL: "]
    ),
    Builtin.Concat,
    Builtin.Log
  ];
};

function ifElse(
  offset: number,
  ifTrue: InstructionList,
  ifFalse: InstructionList
): InstructionList {
  return [
    Builtin.JumpIf,
    offset + ifFalse.length + 4,
    ...ifFalse,
    Builtin.Jump,
    offset + ifFalse.length + ifTrue.length + 4,
    ...ifTrue
  ];
}

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
