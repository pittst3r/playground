import { InstructionList } from "./vm";
import { Base } from "./opcodes";

export interface IStep {}

export type StepDef = () => void;

export type Func = (offset: number) => InstructionList;

export function feature(
  description: string,
  ...scenarios: Array<Func>
): InstructionList {
  const [fnDeclarations, fnIndex] = declareFns(3, scenarios);
  const calls: InstructionList = scenarios.reduce(
    (memo, scenario) => [...memo, Base.Call, fnIndex.get(scenario)],
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

export function scenario(description: string, ...steps: Array<Func>): Func {
  return offset => {
    const [fnDeclarations, fnIndex] = declareFns(offset + 3, steps);
    const calls: InstructionList = steps.reduce(
      (memo, step) => [...memo, Base.Call, fnIndex.get(step)],
      [] as InstructionList
    );

    return [Base.Push, description, Base.Log, ...fnDeclarations, ...calls];
  };
}

export function declareFns(
  offset: number,
  fns: Array<Func>
): [InstructionList, WeakMap<Func, number>] {
  const fnIndex = new WeakMap<Func, number>();
  let instructions: InstructionList = [];

  fns.forEach(fn => {
    const fnAddr = offset + instructions.length + 2;
    const offsetFn = fn(fnAddr);
    const afterFnAddr = fnAddr + offsetFn.length + 1;

    instructions = instructions.concat([
      Base.Jump,
      afterFnAddr,
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
): Func {
  return offset => stepDef(args, offset);
}

export const given = run;
export const when = run;
export const then = run;
export const and = run;
export const should = run;

// export function macro(sequences) {
//   return (...args) => {
//     return test => {
//       sequences(...args).forEach(sequence => {
//         sequence(test);
//       });
//     };
//   };
// }
