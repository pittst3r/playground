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
  const offset = 0;
  const [fnDeclarations, fnIndex] = declare(offset, scenarios);
  const calls: InstructionList = scenarios.reduce(
    (memo, scenario) => {
      const scenarioAddr = fnIndex.get(scenario);
      return [...memo, Builtin.Call, scenarioAddr];
    },
    [] as InstructionList
  );

  return [
    ...fnDeclarations,
    Builtin.Push,
    `Feature: ${description}`,
    Builtin.Log,
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
      (memo, step) => {
        const stepAddr = stepIndex.get(step);
        return [...memo, Builtin.Call, stepAddr];
      },
      [] as InstructionList
    );
    const teardownAddr = teardownIndex.get(teardown);
    const teardownCall = [Builtin.Call, teardownAddr];

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
    const fnAddr = offset + instructions.length + 2;
    const offsetFn = fn(fnAddr);
    const afterFnAddr = fnAddr + offsetFn.length + 1;

    instructions = instructions.concat([
      Builtin.Jump,
      afterFnAddr,
      ...offsetFn,
      Builtin.Return
    ]);
    fnIndex.set(fn, fnAddr);
  });

  return [instructions, fnIndex];
}

export function step<Args extends any[]>(
  stepDef: StepDef<Args>,
  ...args: Args
): Builder {
  return offset => stepDef(args, offset);
}

export const given = step;
export const when = step;
export const then = step;
export const and = step;
export const should = step;
