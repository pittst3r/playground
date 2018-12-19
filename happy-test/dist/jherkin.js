"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opcodes_1 = require("./opcodes");
function feature(description, ...scenarios) {
    const [fnDeclarations, fnIndex] = declareFns(3, scenarios);
    const calls = scenarios.reduce((memo, scenario) => [...memo, opcodes_1.Base.Push, fnIndex.get(scenario), opcodes_1.Base.Call], []);
    return [
        opcodes_1.Base.Push,
        description,
        opcodes_1.Base.Log,
        ...fnDeclarations,
        ...calls,
        opcodes_1.Base.Halt
    ];
}
exports.feature = feature;
function scenario(description, ...steps) {
    return offset => {
        const [fnDeclarations, fnIndex] = declareFns(offset + 3, steps);
        const calls = steps.reduce((memo, step) => [...memo, opcodes_1.Base.Push, fnIndex.get(step), opcodes_1.Base.Call], []);
        const teardownCall = opcodes_1.Base.Call;
        return [
            opcodes_1.Base.Push,
            description,
            opcodes_1.Base.Log,
            ...fnDeclarations,
            ...calls,
            teardownCall
        ];
    };
}
exports.scenario = scenario;
function declareFns(offset, fns) {
    const fnIndex = new WeakMap();
    let instructions = [];
    fns.forEach(fn => {
        const fnAddr = offset + instructions.length + 3;
        const offsetFn = fn(fnAddr);
        const afterFnAddr = fnAddr + offsetFn.length + 1;
        instructions = instructions.concat([
            opcodes_1.Base.Push,
            afterFnAddr,
            opcodes_1.Base.Jump,
            ...offsetFn,
            opcodes_1.Base.Return
        ]);
        fnIndex.set(fn, fnAddr);
    });
    return [instructions, fnIndex];
}
exports.declareFns = declareFns;
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