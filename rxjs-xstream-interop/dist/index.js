import $$observable from "symbol-observable";
import * as rxjs from "rxjs";
import xs from "xstream";
export class Foo {
    [$$observable]() {
        return this;
    }
}
rxjs.from(xs.of(1, 2, 3));
