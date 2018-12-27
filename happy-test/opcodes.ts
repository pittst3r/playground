import { IConfig } from "./vm";
import * as puppeteer from "puppeteer";
import { Browser as IBrowser, Page, ElementHandle } from "puppeteer";
import { join } from "path";

export enum Browser {
  NewBrowser = "NEWBROWSER",
  CloseBrowser = "CLOSEBROWSER",
  NewPage = "NEWPAGE",
  ClosePage = "CLOSEPAGE",
  VisitUrl = "VISITURL",
  Screenshot = "SCREENSHOT",
  Select = "SELECT",
  TextContent = "TEXTCONTENT",
  FindText = "FINDTEXT",
  ClickLink = "CLICK"
}

export function browser(c: IConfig) {
  c.addRegister("browser");
  c.addRegister("page");
  c.addOp(Browser.NewBrowser, async function({ pc, registers }) {
    const browser = await puppeteer.launch();
    registers.set("browser", browser);
    pc.advance();
  });
  c.addOp(Browser.CloseBrowser, async function({ pc, registers }) {
    const browser = registers.get("browser") as IBrowser;
    await browser.close();
    registers.set("browser", null);
    pc.advance();
  });
  c.addOp(Browser.NewPage, async function({ pc, registers }) {
    const browser = registers.get("browser") as IBrowser;
    const page = await browser.newPage();
    registers.set("page", page);
    pc.advance();
  });
  c.addOp(Browser.ClosePage, async function({ pc, registers }) {
    const page = registers.get("page") as Page;
    await page.close();
    pc.advance();
  });
  c.addOp(Browser.VisitUrl, async function({
    pc,
    frame: { stack },
    registers
  }) {
    const url = stack.pop() as string;
    const page = registers.get("page") as Page;
    await page.goto(url);
    pc.advance();
  });
  c.addOp(Browser.Screenshot, async function({ pc, registers }) {
    const page = registers.get("page") as Page;
    await page.screenshot({ path: join(process.cwd(), "screenshot.png") });
    pc.advance();
  });
  c.addOp(Browser.Select, async function({ pc, registers, frame: { stack } }) {
    const page = registers.get("page") as Page;
    const selector = stack.pop() as string;
    stack.push(await page.$(selector));
    pc.advance();
  });
  c.addOp(Browser.TextContent, async function({
    pc,
    registers,
    frame: { stack }
  }) {
    const page = registers.get("page") as Page;
    const handle = stack.pop();
    const text = await page.evaluate(node => node.textContent, handle);
    stack.push(text);
    pc.advance();
  });
  c.addOp(Browser.FindText, async function({
    pc,
    registers,
    frame: { stack }
  }) {
    const page = registers.get("page") as Page;
    const selector = stack.pop();
    const text = stack.pop();
    // TODO: This xpath selector is wrong
    const elements = await page.$x(`//${selector}[text() = "${text}"]`);
    stack.push(elements[0]);
    pc.advance();
  });
  c.addOp(Browser.ClickLink, async function({
    pc,
    frame: { stack },
    registers
  }) {
    const page = registers.get("page") as Page;
    const handle = stack.pop() as ElementHandle;
    await Promise.all([page.waitForNavigation(), handle.click()]);
    pc.advance();
  });
}

export enum Assert {
  Equal = "EQUAL"
}

export function assert(c: IConfig) {
  c.addOp(Assert.Equal, async function({ pc, frame: { stack } }) {
    const expected = stack.pop();
    const actual = stack.pop();

    stack.push(`Expected "${actual}" to equal "${expected}"`);
    stack.push(actual === expected);

    pc.advance();
  });
}
