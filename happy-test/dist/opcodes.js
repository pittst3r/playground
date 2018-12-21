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
const puppeteer = require("puppeteer");
const path_1 = require("path");
var Browser;
(function (Browser) {
    Browser["NewBrowser"] = "NEWBROWSER";
    Browser["CloseBrowser"] = "CLOSEBROWSER";
    Browser["NewPage"] = "NEWPAGE";
    Browser["ClosePage"] = "CLOSEPAGE";
    Browser["VisitUrl"] = "VISITURL";
    Browser["Screenshot"] = "SCREENSHOT";
    Browser["Select"] = "SELECT";
    Browser["TextContent"] = "TEXTCONTENT";
    Browser["FindText"] = "FINDTEXT";
    Browser["ClickLink"] = "CLICK";
})(Browser = exports.Browser || (exports.Browser = {}));
function browser(c) {
    c.addRegister("browser");
    c.addRegister("page");
    c.addOp(Browser.NewBrowser, function ({ pc, registers }) {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer.launch();
            registers.set("browser", browser);
            pc.advance();
        });
    });
    c.addOp(Browser.CloseBrowser, function ({ pc, registers }) {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = registers.get("browser");
            yield browser.close();
            registers.set("browser", null);
            pc.advance();
        });
    });
    c.addOp(Browser.NewPage, function ({ pc, registers }) {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = registers.get("browser");
            const page = yield browser.newPage();
            registers.set("page", page);
            pc.advance();
        });
    });
    c.addOp(Browser.ClosePage, function ({ pc, registers }) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = registers.get("page");
            yield page.close();
            pc.advance();
        });
    });
    c.addOp(Browser.VisitUrl, function ({ pc, stack, registers }) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = stack.pop();
            const page = registers.get("page");
            yield page.goto(url);
            pc.advance();
        });
    });
    c.addOp(Browser.Screenshot, function ({ pc, registers }) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = registers.get("page");
            yield page.screenshot({ path: path_1.join(process.cwd(), "screenshot.png") });
            pc.advance();
        });
    });
    c.addOp(Browser.Select, function ({ pc, registers, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = registers.get("page");
            const selector = stack.pop();
            stack.push(yield page.$(selector));
            pc.advance();
        });
    });
    c.addOp(Browser.TextContent, function ({ pc, registers, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = registers.get("page");
            const handle = stack.pop();
            const textHandle = yield page.evaluateHandle(node => node.textContent, handle);
            const text = yield textHandle.jsonValue();
            stack.push(text);
            pc.advance();
        });
    });
    c.addOp(Browser.FindText, function ({ pc, registers, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = registers.get("page");
            const selector = stack.pop();
            const text = stack.pop();
            // TODO: This selector is wrong
            const elements = yield page.$x(`//${selector}[text() = "${text}"]`);
            stack.push(elements[0]);
            pc.advance();
        });
    });
    c.addOp(Browser.ClickLink, function ({ pc, stack, registers }) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = registers.get("page");
            const handle = stack.pop();
            yield Promise.all([page.waitForNavigation(), handle.click()]);
            pc.advance();
        });
    });
}
exports.browser = browser;
var Assert;
(function (Assert) {
    Assert["Equal"] = "EQUAL";
})(Assert = exports.Assert || (exports.Assert = {}));
function assert(c) {
    c.addOp(Assert.Equal, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const expected = stack.pop();
            const actual = stack.pop();
            stack.push(`Expected "${actual}" to equal "${expected}"`);
            stack.push(expected === actual);
            pc.advance();
        });
    });
}
exports.assert = assert;
//# sourceMappingURL=opcodes.js.map