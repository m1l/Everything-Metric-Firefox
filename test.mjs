import assert from 'node:assert/strict';
import { fahrenheitToCelsius, evaluateFraction, insertAt, shouldConvert, stepUpOrDown } from './lib.js';

async function testFahrenHeitToCelsius() {
    assert.equal(fahrenheitToCelsius(0, false), -18);
    assert.equal(fahrenheitToCelsius(32, false), 0);
    assert.equal(fahrenheitToCelsius(100, false), 38);
    assert.equal(fahrenheitToCelsius(212, false), 100);

    assert.equal(fahrenheitToCelsius(0, true), -17.77777777777778);
    assert.equal(fahrenheitToCelsius(32, true), 0);
    assert.equal(fahrenheitToCelsius(100, true), 37.77777777777778);
    assert.equal(fahrenheitToCelsius(212, true), 100);
}

async function testEvaluateFraction() {
    assert.equal(evaluateFraction('½'), 0.5);
    assert.equal(evaluateFraction('1 / 2'), 0.5);
    assert.equal(evaluateFraction('1/ 2'), 0.5);
    assert.equal(evaluateFraction('1 /2'), 0.5);
    assert.equal(evaluateFraction('1/2'), 0.5);
    assert.equal(evaluateFraction('2 / 1'), 2.0);
}

async function testStepUpOrDown() {
    // step down
    assert.deepEqual(stepUpOrDown(0.125, 'm', false, false), { met: 12.5, unit: 'cm' });
    assert.deepEqual(stepUpOrDown(0.125, 'm', false, true), { met: 12.5, unit: 'cm' });
    assert.deepEqual(stepUpOrDown(0.125, 'm', true, false), { met: 125, unit: 'mm' });
    assert.deepEqual(stepUpOrDown(0.125, 'km', true, false), { met: 125, unit: 'm' });

    // returns 0.125 m instead of 125 mm
    // assert.deepEqual(stepUpOrDown(0.000125, 'km', true, false), { met: 125, unit: 'mm' });

    // step up
    assert.deepEqual(stepUpOrDown(1e9, 'm', false, false), { met: 1e6, unit: 'km' });
    assert.deepEqual(stepUpOrDown(1e9, 'm', false, true), { met: 1, unit: 'Gm' });
    assert.deepEqual(stepUpOrDown(1e9, 'm', true, false), { met: 1e6, unit: 'km' });
    assert.deepEqual(stepUpOrDown(1e9, 'm', true, true), { met: 1, unit: 'Gm' });
    assert.deepEqual(stepUpOrDown(1e6, 'm', false, false), { met: 1e3, unit: 'km' });
    assert.deepEqual(stepUpOrDown(1e6, 'm', false, true), { met: 1, unit: 'Mm' });
    assert.deepEqual(stepUpOrDown(1e6, 'm', true, false), { met: 1e3, unit: 'km' });
    assert.deepEqual(stepUpOrDown(1e6, 'm', true, true), { met: 1, unit: 'Mm' });

    // returns 100.01 cm instead of 10.1 m
    // assert.deepEqual(stepUpOrDown(10001, 'mm', false, false), { met: 10.1, unit: 'm' });
    // returns 1000000 m instead of 1000 km
    // assert.deepEqual(stepUpOrDown(1e8, 'cm', false, false), { met: 1000, unit: 'km' });
}

async function testShouldConvert() {
    // do not convert bracketed values
    assert.equal(shouldConvert('1 m', false), true);
    assert.equal(shouldConvert('1 m (42 yards)', false), false);
    assert.equal(shouldConvert('(1 m)', false), false);

    // convert bracketed values
    assert.equal(shouldConvert('1 m', true), true);
    assert.equal(shouldConvert('1 m (42 yards)', true), false);
    assert.equal(shouldConvert('(1 m)', true), true);
}

async function testInsertAt() {
    assert.equal(insertAt('hello world', 'everyone in the ', 6), 'hello everyone in the world');
    assert.equal(insertAt('hello world', 'welcome, and ', 0), 'welcome, and hello world');
    // TODO: what should happen with index = -1? with index=999?
}

async function main() {
    testFahrenHeitToCelsius();
    testEvaluateFraction();
    testStepUpOrDown();
    testShouldConvert();
    testInsertAt();
}

main();
