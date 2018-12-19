"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jherkin_1 = require("./jherkin");
// import { page, select, text, be, createTextNode } from "./step-defs";
jherkin_1.feature("browser works", jherkin_1.scenario("base case"
// given(page, "about:blank"),
// when(select, "body"),
// then(text),
// should(be, "")
), jherkin_1.scenario("operating on the DOM"
// given(page, "about:blank"),
// and(select, "body"),
// when(createTextNode, "henlo world"),
// then(text),
// should(be, "henlo world")
));
//# sourceMappingURL=foo-test.js.map