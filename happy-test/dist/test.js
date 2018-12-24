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
const vm = new vm_1.VM(conf => {
    opcodes_1.browser(conf);
    opcodes_1.assert(conf);
});
const visit = function ([url]) {
    return [vm_1.Builtin.Push, url, opcodes_1.Browser.VisitUrl];
};
const element = function ([selector]) {
    return [vm_1.Builtin.Push, selector, opcodes_1.Browser.Select];
};
const clickLink = function ([text]) {
    return [
        vm_1.Builtin.Push,
        text,
        vm_1.Builtin.Push,
        "a",
        opcodes_1.Browser.FindText,
        opcodes_1.Browser.ClickLink
    ];
};
const haveText = function ([expected], offset) {
    return [
        opcodes_1.Browser.TextContent,
        vm_1.Builtin.Push,
        expected,
        opcodes_1.Assert.Equal,
        ...ifElse(offset + 4, [vm_1.Builtin.Push, "    PASS: "], [vm_1.Builtin.Push, "    FAIL: "]),
        vm_1.Builtin.Concat,
        vm_1.Builtin.Log
    ];
};
function ifElse(offset, ifTrue, ifFalse) {
    return [
        vm_1.Builtin.JumpIf,
        offset + ifFalse.length + 4,
        ...ifFalse,
        vm_1.Builtin.Jump,
        offset + ifFalse.length + ifTrue.length + 4,
        ...ifTrue
    ];
}
const feat = jherkin_1.feature("browser works", jherkin_1.scenario("base case", jherkin_1.when(visit, "https://www.example.com"), jherkin_1.then(element, "h1"), jherkin_1.should(haveText, "Example Domain")), jherkin_1.scenario("more complex", jherkin_1.when(visit, "https://www.example.com"), jherkin_1.and(clickLink, "More information..."), jherkin_1.then(element, "h1"), jherkin_1.should(haveText, "IANA-managed Reserved Domains")));
function runTests() {
    return __awaiter(this, void 0, void 0, function* () {
        vm.load(feat);
        yield vm.run();
    });
}
runTests().catch(err => {
    console.error(err);
});
//# sourceMappingURL=test.js.map