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
const jherkin_1 = require("./jherkin");
const assert_1 = require("assert");
exports.setup = jherkin_1.macro(() => {
    return [visitPage("about:blank"), assertBodyIsEmpty()];
});
function page(test, url) {
    test.step(() => __awaiter(this, void 0, void 0, function* () {
        const page = test.getRegister("page");
        yield page.goto(url);
    }));
}
exports.page = page;
function select(test, selector) {
    test.step(() => selector);
    evaluate(test, selector => {
        if (typeof selector !== "string") {
            throw new TypeError(`A \`selector\` should be a string but you gave \`${typeof selector}\``);
        }
        return document.querySelector(selector) && selector;
    });
}
exports.select = select;
function text(test) {
    evaluate(test, selector => {
        if (typeof selector !== "string") {
            throw new TypeError(`A \`selector\` should be a string but you gave \`${typeof selector}\``);
        }
        return document.querySelector(selector).textContent;
    });
}
exports.text = text;
function be(test, expected) {
    test.step(() => {
        const actual = test.pop();
        return actual === expected;
    });
    ok(test);
}
exports.be = be;
function createTextNode(test, text) {
    test.step(() => text);
    evaluate(test, txt => {
        document.body.appendChild(document.createTextNode(txt));
    });
}
exports.createTextNode = createTextNode;
function ok(test) {
    test.step(() => {
        assert_1.default(test.pop());
    });
}
function evaluate(test, func) {
    test.step(() => {
        const page = test.getRegister("page");
        const injection = test.pop();
        return page.evaluate(func, injection);
    });
}
//# sourceMappingURL=step-defs.js.map