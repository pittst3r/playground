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
    c.addOp(Base.Call, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.push(stack.pop());
        });
    });
    c.addOp(Base.Return, function ({ pc }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.pop();
            pc.advance();
        });
    });
    c.addOp(Base.Jump, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.jump(stack.pop());
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
            yield page.screenshot({ path: "screenshot.png" });
            pc.advance();
        });
    });
}
exports.browser = browser;
//# sourceMappingURL=opcodes.js.map