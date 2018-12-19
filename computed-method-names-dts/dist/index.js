// The type of the value must resolve to an expression
// whose type is a literal or `unique symbol` type
export class Literals {
    ["foo"]() {
        return this;
    }
}
export class Expressions {
    ["f" + "o" + "o"]() {
        return this;
    }
}
let foo = "foo";
export class Variables {
    [foo]() {
        return this;
    }
}
const bar = "bar";
export class Constants {
    [bar]() {
        return this;
    }
}
const baz = Symbol("baz");
export class Symbols {
    [baz]() {
        return this;
    }
}
