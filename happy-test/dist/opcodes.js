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
var Base;
(function (Base) {
    Base["Halt"] = "HALT";
    Base["Push"] = "PUSH";
    Base["Pop"] = "POP";
    Base["Jump"] = "JUMP";
    Base["Call"] = "CALL";
    Base["Return"] = "RETURN";
    Base["Log"] = "LOG";
})(Base = exports.Base || (exports.Base = {}));
var Browser;
(function (Browser) {
    Browser["NewBrowser"] = "NEWBROWSER";
    Browser["CloseBrowser"] = "CLOSEBROWSER";
    Browser["NewPage"] = "NEWPAGE";
    Browser["ClosePage"] = "CLOSEPAGE";
    Browser["VisitUrl"] = "VISITURL";
    Browser["Screenshot"] = "SCREENSHOT";
})(Browser = exports.Browser || (exports.Browser = {}));
function base(c) {
    c.addOp(Base.Halt, function ({ pc }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.halt();
        });
    });
    c.addOp(Base.Push, function ({ stack, program, pc }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.advance();
            stack.push(program.next().value);
            pc.advance();
        });
    });
    c.addOp(Base.Pop, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            stack.pop();
            pc.advance();
        });
    });
    c.addOp(Base.Call, function ({ pc, program }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.advance();
            pc.push(program.next().value);
        });
    });
    c.addOp(Base.Return, function ({ pc }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.pop();
            pc.advance();
        });
    });
    c.addOp(Base.Jump, function ({ pc, program }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.advance();
            pc.jump(program.next().value);
        });
    });
    c.addOp(Base.Log, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(stack.pop());
            pc.advance();
        });
    });
}
exports.base = base;
function browser(c) {
    c.addOp(Browser.NewBrowser, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer.launch();
            stack.push(browser);
            pc.advance();
        });
    });
    c.addOp(Browser.CloseBrowser, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = stack.pop();
            yield browser.close();
            pc.advance();
        });
    });
    c.addOp(Browser.NewPage, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = stack.peek();
            const page = yield browser.newPage();
            stack.push(page);
            pc.advance();
        });
    });
    c.addOp(Browser.ClosePage, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = stack.pop();
            yield page.close();
            pc.advance();
        });
    });
    c.addOp(Browser.VisitUrl, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = stack.pop();
            const page = stack.peek();
            yield page.goto(url);
            pc.advance();
        });
    });
    c.addOp(Browser.Screenshot, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = stack.peek();
            yield page.screenshot({ path: "screenshot.png" });
            pc.advance();
        });
    });
}
exports.browser = browser;
//# sourceMappingURL=opcodes.js.map