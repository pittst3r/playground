export type Opaque = unknown;

export type InstructionList = Array<Opaque>;

export type Opcode = number;

export interface IOpBuilder {
  frame: Frame;
  pc: ProgramCounter;
  program: Program;
  registers: Map<string, Opaque>;
  stack: Stack<Frame>;
}

export type Op = (opBuilder: IOpBuilder) => Promise<void>;

export interface IConfig {
  addOp: (opcode: string, operation: Op) => void;
  addRegister: (name: string) => void;
}

export class Stack<T> implements Iterable<T> {
  protected inner: T[] = [];

  constructor(initialValues: Iterable<T> = []) {
    for (const value of initialValues) this.inner.push(value);
  }

  [Symbol.iterator]() {
    return this.inner[Symbol.iterator]();
  }

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
  PushVar = "PUSHVAR",
  Log = "LOG"
}

export function builtins(c: IConfig) {
  c.addOp(Builtin.Halt, async function({ pc }) {
    pc.halt();
  });
  c.addOp(Builtin.Push, async function({ frame, program, pc }) {
    pc.advance();
    frame.stack.push(program.next().value);
    pc.advance();
  });
  c.addOp(Builtin.Pop, async function({ pc, frame }) {
    frame.stack.pop();
    pc.advance();
  });
  c.addOp(Builtin.Call, async function({ frame, pc, program, stack }) {
    pc.advance();
    const addr = program.next().value as number;
    pc.push(addr);
    const newFrame = new Frame();
    for (let arg of frame.stack) newFrame.variables.push(arg);
    stack.push(newFrame);
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
  c.addOp(Builtin.JumpIf, async function({ pc, frame, program }) {
    let predicate = frame.stack.pop();
    pc.advance();
    if (predicate == true) {
      const addr = program.next().value as number;
      pc.jump(addr);
    }
  });
  c.addOp(Builtin.Concat, async function({ pc, frame }) {
    const left = frame.stack.pop();
    const right = frame.stack.pop();

    if (hasConcat(left) && hasConcat(right)) {
      frame.stack.push(left.concat(right));
      pc.advance();
    } else {
      throw new Error(
        `Cannot concat "${(left as object).toString()}"` +
          ` with "${(right as object).toString()}"`
      );
    }
  });
  c.addOp(Builtin.PushVar, async function({ pc, frame, program }) {
    pc.advance();
    const varAddr = program.next().value as number;
    frame.stack.push(frame.variables[varAddr]);
    pc.advance();
  });
  c.addOp(Builtin.Log, async function({ pc, frame }) {
    console.log(frame.stack.pop());
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

export class Frame {
  stack = new Stack<Opaque>();
  variables = new Array<Opaque>();
}

export class VM implements AsyncIterableIterator<void> {
  private program: Program;
  private stack = new Stack<Frame>([new Frame()]);
  private pc = new ProgramCounter();
  private ops = new Map<string, Op>();
  private registers = new Map<string, Opaque>();

  constructor(config: (config: IConfig) => void) {
    this.program = new Program(this.pc, []);
    builtins({
      addOp: (opcode, operation) => {
        this.ops.set(opcode, operation);
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

  get currentFrame() {
    return this.stack.peek();
  }

  async next() {
    const instruction = this.program.next().value as string;
    const op = this.ops.get(instruction)!;

    if (op === undefined) {
      throw new Error(
        `Could not find op "${instruction}" with pc @ ${this.pc.peek()}`
      );
    }

    await op({
      frame: this.currentFrame,
      pc: this.pc,
      program: this.program,
      registers: this.registers,
      stack: this.stack
    });

    return { done: this.pc.peek() === -1, value: undefined };
  }

  async run(): Promise<void> {
    // console.log("========instructions========");
    // this.program["instructions"].forEach((ins, i) => {
    //   console.log(i, ins);
    // });

    // console.log("========TICK========");
    // console.log("INSTRUCTION:", this.program.next().value);
    for await (let _ of this) {
      // console.log("========TICK========");
      // console.log("FRAME:", this.currentFrame);
      // console.log("INSTRUCTION:", this.program.next().value);
    }
  }
}
