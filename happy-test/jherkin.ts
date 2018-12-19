import { InstructionList } from "./vm";
import { Base } from "./opcodes";

export interface IStep {}

export type StepDef = () => void;

export type Builder = (offset: number) => InstructionList;

export function feature(
  description: string,
  ...scenarios: Array<Builder>
): InstructionList {
  const [fnDeclarations, fnIndex] = declareFns(3, scenarios);
  const calls: InstructionList = scenarios.reduce(
    (memo, scenario) => [...memo, Base.Push, fnIndex.get(scenario), Base.Call],
    [] as InstructionList
  );

  return [
    Base.Push,
    description,
    Base.Log,
    ...fnDeclarations,
    ...calls,
    Base.Halt
  ];
}

export function scenario(
  description: string,
  ...steps: Array<Builder>
): Builder {
  return offset => {
    const [fnDeclarations, fnIndex] = declareFns(offset + 3, steps);
    const calls: InstructionList = steps.reduce(
      (memo, step) => [...memo, Base.Push, fnIndex.get(step), Base.Call],
      [] as InstructionList
    );
    const teardownCall = Base.Call;

    return [
      Base.Push,
      description,
      Base.Log,
      ...fnDeclarations,
      ...calls,
      teardownCall
    ];
  };
}

export function declareFns(
  offset: number,
  fns: Array<Builder>
): [InstructionList, WeakMap<Builder, number>] {
  const fnIndex = new WeakMap<Builder, number>();
  let instructions: InstructionList = [];

  fns.forEach(fn => {
    const fnAddr = offset + instructions.length + 3;
    const offsetFn = fn(fnAddr);
    const afterFnAddr = fnAddr + offsetFn.length + 1;

    instructions = instructions.concat([
      Base.Push,
      afterFnAddr,
      Base.Jump,
      ...offsetFn,
      Base.Return
    ]);
    fnIndex.set(fn, fnAddr);
  });

  return [instructions, fnIndex];
}

export function run(
  stepDef: (args: any[], offset: number) => InstructionList,
  ...args: any[]
): Builder {
  return offset => stepDef(args, offset);
}

export const given = run;
export const when = run;
export const then = run;
export const and = run;
export const should = run;
