"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
class Stack {
    constructor() {
        this.inner = [];
    }
    get length() {
        return this.inner.length;
    }
    push(data) {
        if (this.inner.length > 63) {
            throw new Error("Stack overflow");
        }
        this.inner.push(data);
    }
    pop() {
        return this.inner.pop();
    }
    peek() {
        return this.inner[this.inner.length - 1];
    }
    truncate(end) {
        this.inner.splice(end);
    }
}
exports.Stack = Stack;
class ProgramCounter extends Stack {
    constructor() {
        super();
        this.push(0);
    }
    halt() {
        this.push(-1);
    }
    advance(distance = 1) {
        const last = this.pop();
        if (last === undefined) {
            throw new Error("No pc on the pc stack to advance from");
        }
        this.push(last + distance);
    }
    jump(addr) {
        this.pop();
        this.push(addr);
    }
}
exports.ProgramCounter = ProgramCounter;
class FramePointer extends Stack {
    constructor() {
        super();
        this.push(0);
    }
    return() {
        this.pop();
    }
}
exports.FramePointer = FramePointer;
var Builtin;
(function (Builtin) {
    Builtin["Halt"] = "HALT";
    Builtin["Push"] = "PUSH";
    Builtin["Pop"] = "POP";
    Builtin["Jump"] = "JUMP";
    Builtin["JumpIf"] = "JUMPIF";
    Builtin["Call"] = "CALL";
    Builtin["Return"] = "RETURN";
    Builtin["Concat"] = "CONCAT";
    Builtin["Log"] = "LOG";
})(Builtin = exports.Builtin || (exports.Builtin = {}));
function builtins(c) {
    c.addOp(Builtin.Halt, function ({ pc }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.halt();
        });
    });
    c.addOp(Builtin.Push, function ({ stack, program, pc }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.advance();
            stack.push(program.next().value);
            pc.advance();
        });
    });
    c.addOp(Builtin.Pop, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            stack.pop();
            pc.advance();
        });
    });
    c.addOp(Builtin.Call, function ({ pc, fp, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.push(stack.pop());
            fp.push(stack.length);
        });
    });
    c.addOp(Builtin.Return, function ({ pc, fp, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            let returnValue;
            if (fp.peek() < stack.length) {
                returnValue = stack.pop();
            }
            stack.truncate(fp.pop());
            if (returnValue !== undefined)
                stack.push(returnValue);
            pc.pop();
            pc.advance();
        });
    });
    c.addOp(Builtin.Concat, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            const left = stack.pop();
            const right = stack.pop();
            stack.push(left.concat(right));
            pc.advance();
        });
    });
    c.addOp(Builtin.Jump, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            pc.jump(stack.pop());
        });
    });
    c.addOp(Builtin.JumpIf, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            let addr = stack.pop();
            let predicate = stack.pop();
            if (predicate == true) {
                pc.jump(addr);
            }
            else {
                pc.advance();
            }
        });
    });
    c.addOp(Builtin.Log, function ({ pc, stack }) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(stack.pop());
            pc.advance();
        });
    });
}
exports.builtins = builtins;
class Program {
    constructor(pc, instructions) {
        this.pc = pc;
        this.instructions = instructions;
    }
    [Symbol.iterator]() {
        return this;
    }
    next() {
        const pc = this.pc.peek();
        return { done: pc === -1, value: this.instructions[pc] };
    }
}
exports.Program = Program;
class VM {
    constructor(config) {
        this.stack = new Stack();
        this.pc = new ProgramCounter();
        this.fp = new FramePointer();
        this.builtins = new Map();
        this.ops = new Map();
        this.registers = new Map();
        this.program = new Program(this.pc, []);
        builtins({
            addOp: (opcode, operation) => {
                this.builtins.set(opcode, operation);
            },
            addRegister: name => {
                this.registers.set(name, null);
            }
        });
        config({
            addOp: (opcode, operation) => {
                this.ops.set(opcode, operation);
            },
            addRegister: name => {
                this.registers.set(name, null);
            }
        });
    }
    [Symbol.asyncIterator]() {
        return this;
    }
    load(instructions) {
        this.pc = new ProgramCounter();
        this.program = new Program(this.pc, instructions);
    }
    next() {
        return __awaiter(this, void 0, void 0, function* () {
            const instruction = this.program.next().value;
            const op = this.builtins.get(instruction) || this.ops.get(instruction);
            if (op === undefined) {
                throw new Error(`Could not find op with pc @ ${this.pc.peek()}`);
            }
            const opBuilder = {
                pc: this.pc,
                stack: this.stack,
                registers: this.registers
            };
            const builtinOpBuilder = Object.assign({}, opBuilder, { fp: this.fp, program: this.program });
            if (this.isBuiltIn(instruction))
                yield op(builtinOpBuilder);
            else
                yield op(opBuilder);
            return { done: this.pc.peek() === -1, value: undefined };
        });
    }
    isBuiltIn(instruction) {
        return this.builtins.has(instruction);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            var e_1, _a;
            console.log("========instructions========");
            this.program["instructions"].forEach((ins, i) => {
                console.log(i, ins);
            });
            try {
                for (var _b = __asyncValues(this), _c; _c = yield _b.next(), !_c.done;) {
                    let _ = _c.value;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
}
exports.VM = VM;
//# sourceMappingURL=vm.js.map