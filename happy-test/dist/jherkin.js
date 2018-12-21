"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vm_1 = require("./vm");
const opcodes_1 = require("./opcodes");
function feature(description, ...scenarios) {
    const offset = 3;
    const [fnDeclarations, fnIndex] = declare(offset, scenarios);
    const calls = scenarios.reduce((memo, scenario) => [
        ...memo,
        vm_1.Builtin.Push,
        fnIndex.get(scenario),
        vm_1.Builtin.Call
    ], []);
    return [
        vm_1.Builtin.Push,
        `Feature: ${description}`,
        vm_1.Builtin.Log,
        ...fnDeclarations,
        ...calls,
        vm_1.Builtin.Halt
    ];
}
exports.feature = feature;
function scenario(description, ...steps) {
    return offset => {
        const setup = [opcodes_1.Browser.NewBrowser, opcodes_1.Browser.NewPage];
        const teardown = () => [opcodes_1.Browser.ClosePage, opcodes_1.Browser.CloseBrowser];
        const [teardownDeclaration, teardownIndex] = declare(offset, [teardown]);
        const [stepDeclarations, stepIndex] = declare(offset + teardownDeclaration.length, steps);
        const stepCalls = steps.reduce((memo, step) => [
            ...memo,
            vm_1.Builtin.Push,
            stepIndex.get(step),
            vm_1.Builtin.Call
        ], []);
        const teardownCall = [
            vm_1.Builtin.Push,
            teardownIndex.get(teardown),
            vm_1.Builtin.Call
        ];
        return [
            ...teardownDeclaration,
            ...stepDeclarations,
            vm_1.Builtin.Push,
            `  Scenario: ${description}`,
            vm_1.Builtin.Log,
            ...setup,
            ...stepCalls,
            ...teardownCall
        ];
    };
}
exports.scenario = scenario;
function declare(offset, fns) {
    const fnIndex = new WeakMap();
    let instructions = [];
    fns.forEach(fn => {
        const fnAddr = offset + instructions.length + 3;
        const offsetFn = fn(fnAddr);
        const afterFnAddr = fnAddr + offsetFn.length + 1;
        instructions = instructions.concat([
            vm_1.Builtin.Push,
            afterFnAddr,
            vm_1.Builtin.Jump,
            ...offsetFn,
            vm_1.Builtin.Return
        ]);
        fnIndex.set(fn, fnAddr);
    });
    return [instructions, fnIndex];
}
exports.declare = declare;
function run(stepDef, ...args) {
    return offset => stepDef(args, offset);
}
exports.run = run;
exports.given = run;
exports.when = run;
exports.then = run;
exports.and = run;
exports.should = run;
//# sourceMappingURL=jherkin.js.map