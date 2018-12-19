"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opcodes_1 = require("./opcodes");
function feature(description, ...scenarios) {
    const fnIndex = new WeakMap();
    const fnDeclarations = declareFns(fnIndex, 3, scenarios);
    const calls = scenarios.reduce((memo, scenario) => [...memo, opcodes_1.Base.Call, fnIndex.get(scenario)], []);
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
        const fnIndex = new WeakMap();
        const fnDeclarations = declareFns(fnIndex, offset + 3, steps);
        const calls = steps.reduce((memo, step) => [...memo, opcodes_1.Base.Call, fnIndex.get(step)], []);
        return [opcodes_1.Base.Push, description, opcodes_1.Base.Log, ...fnDeclarations, ...calls];
    };
}
exports.scenario = scenario;
function declareFns(fnIndex, offset, fns) {
    let instructions = [];
    fns.forEach(fn => {
        const fnAddr = offset + instructions.length + 2;
        const offsetFn = fn(fnAddr);
        const afterFnAddr = fnAddr + offsetFn.length + 1;
        instructions = instructions.concat([
            opcodes_1.Base.Jump,
            afterFnAddr,
            ...offsetFn,
            opcodes_1.Base.Return
        ]);
        fnIndex.set(fn, fnAddr);
    });
    return instructions;
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
// export function macro(sequences) {
//   return (...args) => {
//     return test => {
//       sequences(...args).forEach(sequence => {
//         sequence(test);
//       });
//     };
//   };
// }
//# sourceMappingURL=jherkin.js.map