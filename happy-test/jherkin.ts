import { InstructionList, Builtin } from "./vm";
import { Browser } from "./opcodes";

export interface IStep {}

export type StepDef<Args extends any[]> = (
  args: Args,
  offset: number
) => InstructionList;

export type Builder = (offset: number) => InstructionList;

export function feature(
  description: string,
  ...scenarios: Array<Builder>
): InstructionList {
  const offset = 3;
  const [fnDeclarations, fnIndex] = declare(offset, scenarios);
  const calls: InstructionList = scenarios.reduce(
    (memo, scenario) => [
      ...memo,
      Builtin.Push,
      fnIndex.get(scenario),
      Builtin.Call
    ],
    [] as InstructionList
  );

  return [
    Builtin.Push,
    `Feature: ${description}`,
    Builtin.Log,
    ...fnDeclarations,
    ...calls,
    Builtin.Halt
  ];
}

export function scenario(
  description: string,
  ...steps: Array<Builder>
): Builder {
  return offset => {
    const setup = [Browser.NewBrowser, Browser.NewPage];
    const teardown = () => [Browser.ClosePage, Browser.CloseBrowser];
    const [teardownDeclaration, teardownIndex] = declare(offset, [teardown]);
    const [stepDeclarations, stepIndex] = declare(
      offset + teardownDeclaration.length,
      steps
    );
    const stepCalls: InstructionList = steps.reduce(
      (memo, step) => [
        ...memo,
        Builtin.Push,
        stepIndex.get(step),
        Builtin.Call
      ],
      [] as InstructionList
    );
    const teardownCall = [
      Builtin.Push,
      teardownIndex.get(teardown),
      Builtin.Call
    ];

    return [
      ...teardownDeclaration,
      ...stepDeclarations,
      Builtin.Push,
      `  Scenario: ${description}`,
      Builtin.Log,
      ...setup,
      ...stepCalls,
      ...teardownCall
    ];
  };
}

export function declare(
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
      Builtin.Push,
      afterFnAddr,
      Builtin.Jump,
      ...offsetFn,
      Builtin.Return
    ]);
    fnIndex.set(fn, fnAddr);
  });

  return [instructions, fnIndex];
}

export function run<Args extends any[]>(
  stepDef: StepDef<Args>,
  ...args: Args
): Builder {
  return offset => stepDef(args, offset);
}

export const given = run;
export const when = run;
export const then = run;
export const and = run;
export const should = run;
