import assert from 'node:assert/strict';
import { evaluateFraction } from './lib.js';

async function testEvaluateFraction() {
    assert.equal(evaluateFraction('½'), 0.5);
    assert.equal(evaluateFraction('1 / 2'), 0.5);
    assert.equal(evaluateFraction('1/ 2'), 0.5);
    assert.equal(evaluateFraction('1 /2'), 0.5);
    assert.equal(evaluateFraction('1/2'), 0.5);
    assert.equal(evaluateFraction('2 / 1'), 2.0);
}

async function main() {
    testEvaluateFraction();
}

main();
