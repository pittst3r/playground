export type Opaque = unknown;

export type InstructionList = Array<Opaque>;

export type Opcode = number;

export interface IOpBuilder {
  stack: Stack<Opaque>;
  pc: ProgramCounter;
  registers: Map<string, Opaque>;
}

export type Op = (opBuilder: IOpBuilder) => Promise<void>;

export interface IBuiltinOpBuilder {
  stack: Stack<Opaque>;
  program: Program;
  pc: ProgramCounter;
  registers: Map<string, Opaque>;
}

export type BuiltinOp = (opBuilder: IBuiltinOpBuilder) => Promise<void>;

export interface IConfig {
  addOp: (opcode: string, operation: Op) => void;
  addRegister: (name: string) => void;
}

export interface IBuiltinConfig {
  addOp: (opcode: string, operation: BuiltinOp) => void;
  addRegister: (name: string) => void;
}

export class Stack<T> {
  protected inner: T[] = [];

  get length() {
    return this.inner.length;
  }

  push(data: T) {
    if (this.inner.length > 63) {
      throw new Error("Stack overflow");
    }
    this.inner.push(data);
  }

  pop() {
    const value = this.inner.pop();

    if (value === undefined) {
      throw new Error("Stack is empty");
    }

    return value;
  }

  peek() {
    return this.inner[this.inner.length - 1];
  }
}

export class ProgramCounter extends Stack<number> {
  constructor() {
    super();
    this.push(0);
  }

  halt(): void {
    this.push(-1);
  }

  advance(distance = 1): void {
    const last = this.pop();

    if (last === undefined) {
      throw new Error("No pc on the pc stack to advance from");
    }

    this.push(last + distance);
  }

  jump(addr: number) {
    this.pop();
    this.push(addr);
  }
}

export class FramePointer extends Stack<number> {
  constructor() {
    super();
    this.push(0);
  }

  return() {
    this.pop();
  }
}

export enum Builtin {
  Halt = "HALT",
  Push = "PUSH",
  Pop = "POP",
  Jump = "JUMP",
  JumpIf = "JUMPIF",
  Call = "CALL",
  Return = "RETURN",
  Concat = "CONCAT",
  Log = "LOG"
}

export function builtins(c: IBuiltinConfig) {
  c.addOp(Builtin.Halt, async function({ pc }) {
    pc.halt();
  });
  c.addOp(Builtin.Push, async function({ stack, program, pc }) {
    pc.advance();
    stack.push(program.next().value);
    pc.advance();
  });
  c.addOp(Builtin.Pop, async function({ pc, stack }) {
    stack.pop();
    pc.advance();
  });
  c.addOp(Builtin.Call, async function({ pc, program }) {
    pc.advance();
    const addr = program.next().value as number;
    pc.push(addr);
  });
  c.addOp(Builtin.Return, async function({ pc }) {
    pc.pop();
    pc.advance();
  });
  c.addOp(Builtin.Jump, async function({ pc, program }) {
    pc.advance();
    const addr = program.next().value as number;
    pc.jump(addr);
  });
  c.addOp(Builtin.JumpIf, async function({ pc, stack, program }) {
    let predicate = stack.pop();
    pc.advance();
    if (predicate == true) {
      const addr = program.next().value as number;
      pc.jump(addr);
    }
  });
  c.addOp(Builtin.Concat, async function({ pc, stack }) {
    const left = stack.pop();
    const right = stack.pop();

    if (hasConcat(left) && hasConcat(right)) {
      stack.push(left.concat(right));
      pc.advance();
    } else {
      throw new Error(
        `Cannot concat "${(left as object).toString()}"` +
          ` with "${(right as object).toString()}"`
      );
    }
  });
  c.addOp(Builtin.Log, async function({ pc, stack }) {
    console.log(stack.pop());
    pc.advance();
  });
}

interface IConcatable {
  concat(other: IConcatable): IConcatable;
}

function hasConcat(thing: any): thing is IConcatable {
  return typeof thing.concat === "function";
}

export class Program implements IterableIterator<Opaque> {
  constructor(
    private pc: ProgramCounter,
    private instructions: InstructionList
  ) {}

  [Symbol.iterator]() {
    return this;
  }

  next() {
    const pc = this.pc.peek();
    return { done: pc === -1, value: this.instructions[pc] };
  }
}

export class VM implements AsyncIterableIterator<void> {
  private program: Program;
  private stack = new Stack<Opaque>();
  private pc = new ProgramCounter();
  private builtins = new Map<string, BuiltinOp>();
  private ops = new Map<string, Op>();
  private registers = new Map<string, Opaque>();

  constructor(config: (config: IConfig) => void) {
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

  load(instructions: InstructionList): void {
    this.pc = new ProgramCounter();
    this.program = new Program(this.pc, instructions);
  }

  async next() {
    const instruction = this.program.next().value as string;
    const op = this.builtins.get(instruction) || this.ops.get(instruction)!;

    if (op === undefined) {
      throw new Error(
        `Could not find op "${instruction}" with pc @ ${this.pc.peek()}`
      );
    }

    const opBuilder = {
      pc: this.pc,
      stack: this.stack,
      registers: this.registers
    };
    const builtinOpBuilder = {
      ...opBuilder,
      program: this.program
    };

    if (this.isBuiltIn(instruction)) await op(builtinOpBuilder);
    else await (op as Op)(opBuilder);

    return { done: this.pc.peek() === -1, value: undefined };
  }

  private isBuiltIn(instruction: string): boolean {
    return this.builtins.has(instruction);
  }

  async run(): Promise<void> {
    // console.log("========instructions========");
    // this.program["instructions"].forEach((ins, i) => {
    //   console.log(i, ins);
    // });
    for await (let _ of this) {
      // console.log("========TICK========");
      // console.log("STACK:", this.stack["inner"].map(i => i.toString()));
      // console.log("PC:", this.pc["inner"]);
      // console.log("FP:", this.fp["inner"]);
      // console.log("CURRENT INSTRUCTION:", this.program.next().value);
    }
  }
}
