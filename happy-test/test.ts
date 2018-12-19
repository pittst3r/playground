import { VM } from "./vm";
import { base, Base, browser, Browser } from "./opcodes";
import { feature, scenario, given, when, then, declareFns } from "./jherkin";

const vm = new VM(c => {
  base(c);
  browser(c);
});

const logStringAndNumber = [
  Base.Push,
  1234567890,
  Base.Push,
  "henlo world 👯",
  Base.Log,
  Base.Log,
  Base.Halt
];

const feat = feature(
  "browser works",
  scenario(
    "base case",
    given((_, offset) => {
      const setup = [Browser.NewBrowser, Browser.NewPage];
      const teardown = () => [Browser.ClosePage, Browser.CloseBrowser];
      const [teardownDeclaration, fnIndex] = declareFns(offset, [teardown]);
      const teardownAddr = fnIndex.get(teardown);
      return [...teardownDeclaration, Base.Push, teardownAddr, ...setup];
    }),
    when(
      ([url]) => [Base.Push, url, Browser.VisitUrl],
      "https://www.example.com"
    ),
    then(() => [Browser.Screenshot])
  ),
  scenario(
    "operating on the DOM",
    given((_, offset) => {
      const teardown = () => [];
      const [teardownDeclaration, fnIndex] = declareFns(offset, [teardown]);
      const teardownAddr = fnIndex.get(teardown);
      return [...teardownDeclaration, Base.Push, teardownAddr];
    })
  )
);

async function runTests() {
  vm.load(logStringAndNumber);
  await vm.run();
  vm.load(feat);
  await vm.run();
}

runTests().catch(err => {
  console.error(err);
});
