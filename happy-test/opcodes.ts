import { IConfig } from "./vm";
import * as puppeteer from "puppeteer";
import { Browser as IBrowser, Page } from "puppeteer";

export enum Base {
  Halt = "HALT",
  Push = "PUSH",
  Pop = "POP",
  Jump = "JUMP",
  Call = "CALL",
  Return = "RETURN",
  Log = "LOG"
}

export enum Browser {
  NewBrowser = "NEWBROWSER",
  CloseBrowser = "CLOSEBROWSER",
  NewPage = "NEWPAGE",
  ClosePage = "CLOSEPAGE",
  VisitUrl = "VISITURL",
  Screenshot = "SCREENSHOT"
}

export function base(c: IConfig) {
  c.addOp(Base.Halt, async function({ pc }) {
    pc.halt();
  });
  c.addOp(Base.Push, async function({ stack, program, pc }) {
    pc.advance();
    stack.push(program.next().value);
    pc.advance();
  });
  c.addOp(Base.Pop, async function({ pc, stack }) {
    stack.pop();
    pc.advance();
  });
  c.addOp(Base.Call, async function({ pc, program }) {
    pc.advance();
    pc.push(program.next().value);
  });
  c.addOp(Base.Return, async function({ pc }) {
    pc.pop();
    pc.advance();
  });
  c.addOp(Base.Jump, async function({ pc, program }) {
    pc.advance();
    pc.jump(program.next().value);
  });
  c.addOp(Base.Log, async function({ pc, stack }) {
    console.log(stack.pop());
    pc.advance();
  });
}

export function browser(c: IConfig) {
  c.addOp(Browser.NewBrowser, async function({ pc, stack }) {
    const browser = await puppeteer.launch();
    stack.push(browser);
    pc.advance();
  });
  c.addOp(Browser.CloseBrowser, async function({ pc, stack }) {
    const browser: IBrowser = stack.pop()!;
    await browser.close();
    pc.advance();
  });
  c.addOp(Browser.NewPage, async function({ pc, stack }) {
    const browser: IBrowser = stack.peek()!;
    const page = await browser.newPage();
    stack.push(page);
    pc.advance();
  });
  c.addOp(Browser.ClosePage, async function({ pc, stack }) {
    const page: Page = stack.pop()!;
    await page.close();
    pc.advance();
  });
  c.addOp(Browser.VisitUrl, async function({ pc, stack }) {
    const url = stack.pop()!;
    const page: Page = stack.peek()!;
    await page.goto(url);
    pc.advance();
  });
  c.addOp(Browser.Screenshot, async function({ pc, stack }) {
    const page: Page = stack.peek()!;
    await page.screenshot({ path: "screenshot.png" });
    pc.advance();
  });
}
