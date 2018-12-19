import {
  feature,
  scenario /*, given, when, then, should, and*/
} from "./jherkin";
// import { page, select, text, be, createTextNode } from "./step-defs";

feature(
  "browser works",
  scenario(
    "base case"
    // given(page, "about:blank"),
    // when(select, "body"),
    // then(text),
    // should(be, "")
  ),
  scenario(
    "operating on the DOM"
    // given(page, "about:blank"),
    // and(select, "body"),
    // when(createTextNode, "henlo world"),
    // then(text),
    // should(be, "henlo world")
  )
);
