import assert from 'node:assert/strict';
import { bold, evaluateFraction, fahrenheitToCelsius, formatConvertedValue, formatNumber, insertAt, replaceFahrenheit, roundNicely, shouldConvert, stepUpOrDown, convertedValueInsertionOffset } from './lib.js';

function testBold() {
    assert.equal(bold('Hello, World!'), '𝗛𝗲𝗹𝗹𝗼, 𝗪𝗼𝗿𝗹𝗱!');
    assert.equal(bold('42 is an integer'), '𝟰𝟮 𝗶𝘀 𝗮𝗻 𝗶𝗻𝘁𝗲𝗴𝗲𝗿');
    assert.equal(bold('3.14 is not an integer'), '𝟯.𝟭𝟰 𝗶𝘀 𝗻𝗼𝘁 𝗮𝗻 𝗶𝗻𝘁𝗲𝗴𝗲𝗿');
}

function testEvaluateFraction() {
    assert.equal(evaluateFraction('½'), 0.5);
    assert.equal(evaluateFraction('1 / 2'), 0.5);
    assert.equal(evaluateFraction('1/ 2'), 0.5);
    assert.equal(evaluateFraction('1 /2'), 0.5);
    assert.equal(evaluateFraction('1/2'), 0.5);
    assert.equal(evaluateFraction('2 / 1'), 2.0);
}

function testFahrenHeitToCelsius() {
    assert.equal(fahrenheitToCelsius(0, false), -18);
    assert.equal(fahrenheitToCelsius(32, false), 0);
    assert.equal(fahrenheitToCelsius(100, false), 38);
    assert.equal(fahrenheitToCelsius(212, false), 100);

    assert.equal(fahrenheitToCelsius(0, true), -17.77777777777778);
    assert.equal(fahrenheitToCelsius(32, true), 0);
    assert.equal(fahrenheitToCelsius(100, true), 37.77777777777778);
    assert.equal(fahrenheitToCelsius(212, true), 100);
}

function testFormatConvertedValue() {
    assert.equal(formatConvertedValue('123,456.789', ' m', false, false), ' (123,456.789 m)˜');
    assert.equal(formatConvertedValue('123,456.789', ' m', false, true), '\u200B【123,456.789 m】');
    assert.equal(formatConvertedValue('123,456.789', ' m', true, false), ' (123,456.789 m)˜');
    assert.equal(formatConvertedValue('123,456.789', ' m', true, true), '\u200B【𝟭𝟮𝟯,𝟰𝟱𝟲.𝟳𝟴𝟵 𝗺】');
}

function testFormatNumber() {
    assert.equal(formatNumber(123456.789, false, false), '123,456.789');
    assert.equal(formatNumber(123456.789, false, true), '123 456.789');
    assert.equal(formatNumber(123456.789, true, false), '123.456,789');
    assert.equal(formatNumber(123456.789, true, true), '123 456,789');
}

function testInsertAt() {
    assert.equal(insertAt('hello world', 'everyone in the ', 6), 'hello everyone in the world');
    assert.equal(insertAt('hello world', 'welcome, and ', 0), 'welcome, and hello world');
    // TODO: what should happen with index = -1? with index=999?
}

function testReplaceFahrenheit() {
    assert.equal(replaceFahrenheit('Saying 212 °F is the same as saying 100°C', false, false, false, false, false, false, false, false), 'Saying 212 °F (100°C)˜ is the same as saying 100°C');

    assert.equal(replaceFahrenheit('(212 °)', false, false, false, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', false, false, true, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', false, true, false, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', false, true, true, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', true, false, false, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', true, false, true, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', true, true, false, false, false, false, false, false), '(212 °) (100°C)˜');
    assert.equal(replaceFahrenheit('(212 °)', true, true, true, false, false, false, false, false), '(212 °) (373.15K)˜');
}

function testRoundNicely() {
    assert.equal(roundNicely(1 / 3, false), 0.33);
    assert.equal(roundNicely(1 / 3, true), 0.33);

    assert.equal(roundNicely(1.111, false), 1.11);
    assert.equal(roundNicely(1.111, true), 1.1);

    assert.equal(roundNicely(1.011, false), 1.01);
    assert.equal(roundNicely(1.011, true), 1);
}

function testStepUpOrDown() {
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

function testShouldConvert() {
    // do not convert bracketed values
    assert.equal(shouldConvert('1 m', false), true);
    assert.equal(shouldConvert('1 m (42 yards)', false), false);
    assert.equal(shouldConvert('(1 m)', false), false);

    // convert bracketed values
    assert.equal(shouldConvert('1 m', true), true);
    assert.equal(shouldConvert('1 m (42 yards)', true), false);
    assert.equal(shouldConvert('(1 m)', true), true);
}

function testWhereToInsertConvertedValue() {
    assert.equal(convertedValueInsertionOffset('1 m'), 3);
    assert.equal(convertedValueInsertionOffset('1 m '), 3);
    assert.equal(convertedValueInsertionOffset('1 m.'), 3);
    assert.equal(convertedValueInsertionOffset('1 mm'), 4);
    assert.equal(convertedValueInsertionOffset('1 m)'), 4);
}

function main() {
    testBold();
    testEvaluateFraction();
    testFahrenHeitToCelsius();
    testFormatConvertedValue();
    testFormatNumber();
    testInsertAt();
    testReplaceFahrenheit();
    testRoundNicely();
    testStepUpOrDown();
    testShouldConvert();
    testWhereToInsertConvertedValue();
}

main();
