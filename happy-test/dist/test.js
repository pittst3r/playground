"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vm_1 = require("./vm");
const opcodes_1 = require("./opcodes");
const jherkin_1 = require("./jherkin");
const vm = new vm_1.VM(c => {
    opcodes_1.base(c);
    opcodes_1.browser(c);
});
const logStringAndNumber = [
    opcodes_1.Base.Push,
    1234567890,
    opcodes_1.Base.Push,
    "henlo world 👯",
    opcodes_1.Base.Log,
    opcodes_1.Base.Log,
    opcodes_1.Base.Halt
];
const feat = jherkin_1.feature("browser works", jherkin_1.scenario("base case", jherkin_1.given((_, offset) => {
    const setup = [opcodes_1.Browser.NewBrowser, opcodes_1.Browser.NewPage];
    const teardown = () => [opcodes_1.Browser.ClosePage, opcodes_1.Browser.CloseBrowser];
    const [teardownDeclaration, fnIndex] = jherkin_1.declareFns(offset, [teardown]);
    const teardownAddr = fnIndex.get(teardown);
    return [...teardownDeclaration, opcodes_1.Base.Push, teardownAddr, ...setup];
}), jherkin_1.when(([url]) => [opcodes_1.Base.Push, url, opcodes_1.Browser.VisitUrl], "https://www.example.com"), jherkin_1.then(() => [opcodes_1.Browser.Screenshot])), jherkin_1.scenario("operating on the DOM", jherkin_1.given((_, offset) => {
    const teardown = () => [];
    const [teardownDeclaration, fnIndex] = jherkin_1.declareFns(offset, [teardown]);
    const teardownAddr = fnIndex.get(teardown);
    return [...teardownDeclaration, opcodes_1.Base.Push, teardownAddr];
})));
function runTests() {
    return __awaiter(this, void 0, void 0, function* () {
        vm.load(logStringAndNumber);
        yield vm.run();
        vm.load(feat);
        yield vm.run();
    });
}
runTests().catch(err => {
    console.error(err);
});
//# sourceMappingURL=test.js.map