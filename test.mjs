import assert from 'node:assert/strict';
import { bold, convAndForm, conversions, evaluateFraction, fahrenheitToCelsius, formatConvertedValue, formatNumber, insertAt, parseNumber, replaceAll, replaceFahrenheit, replaceFeetAndInches, replaceFeetAndInchesSymbol, replaceMaybeKeepLastChar, replaceMilesPerGallon, replaceOtherUnits, replacePoundsAndOunces, replaceSurfaceInFeet, replaceSurfaceInInches, replaceVolume, setIncludeImproperSymbols, roundNicely, shouldConvert, stepUpOrDown, convertedValueInsertionOffset } from './lib.js';

import fs from 'fs';

function testBold() {
    assert.equal(bold('Hello, World!'), '𝗛𝗲𝗹𝗹𝗼, 𝗪𝗼𝗿𝗹𝗱!');
    assert.equal(bold('42 is an integer'), '𝟰𝟮 𝗶𝘀 𝗮𝗻 𝗶𝗻𝘁𝗲𝗴𝗲𝗿');
    assert.equal(bold('3.14 is not an integer'), '𝟯.𝟭𝟰 𝗶𝘀 𝗻𝗼𝘁 𝗮𝗻 𝗶𝗻𝘁𝗲𝗴𝗲𝗿');
}

function testConvAndForm() {
    const fahrenheitToCelsiusConv = conversions[0];
    assert(fahrenheitToCelsiusConv);
    assert.equal(convAndForm(100, fahrenheitToCelsiusConv, '', false, false, false, false, false, false, false, false), ' (100 °C)˜');

    // useMM and useRounding interact in subtle ways
    const inchesToCmConv = conversions[1];
    assert(inchesToCmConv);
    assert.equal(convAndForm(0.123, inchesToCmConv, '', false, false, false, false, false, false, false, false), ' (3.1 mm)˜');
    assert.equal(convAndForm(0.123, inchesToCmConv, '', false, false, false, true, false, false, false, false), ' (3.1 mm)˜');
    assert.equal(convAndForm(0.123, inchesToCmConv, '', false, true, false, false, false, false, false, false), ' (3 mm)˜');
    assert.equal(convAndForm(0.123, inchesToCmConv, '', false, true, false, true, false, false, false, false), ' (3.1 mm)˜');

    // surfaces and volumes
    const feetToMConv = conversions[3];
    assert(feetToMConv);
    assert.equal(convAndForm(100, feetToMConv, '', false, false, false, false, false, false, false, false), ' (30.48 m)˜');
    assert.equal(convAndForm(100, feetToMConv, '²', false, false, false, false, false, false, false, false), ' (9.29 m²)˜');
    assert.equal(convAndForm(100, feetToMConv, '³', false, false, false, false, false, false, false, false), ' (2,831.69 L)˜');

    // US customary units vs imperial units
    const fluidOncesToMlConv = conversions[9];
    assert(fluidOncesToMlConv);
    assert.equal(convAndForm(100, fluidOncesToMlConv, '', false, false, false, false, false, false, false, false), ' (2,957 mL)˜');
    assert.equal(convAndForm(100, fluidOncesToMlConv, '', true, false, false, false, false, false, false, false), ' (2,841 mL)˜');
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

function testParseNumber() {
    assert.equal(parseNumber('-3.14'), -3.14);
    assert.equal(parseNumber('−3.14'), -3.14);
    assert.equal(parseNumber('3.14'), 3.14);
    assert.equal(parseNumber('+3.14'), 3.14);
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

    // returns '1,203 °F (NaN°C)˜' instead of '1,203 °F (651°C)˜'
    // assert.equal(replaceFahrenheit('1,203 °F', false, false, false, false, false, false, false, false), '1,203 °F (651°C)˜');

    assert.equal(replaceFahrenheit('212 °F', false, false, false, false, false, false, false, false), '212 °F (100°C)˜');
    assert.equal(replaceFahrenheit('212 degrees F', false, false, false, false, false, false, false, false), '212 degrees F (100°C)˜');
    assert.equal(replaceFahrenheit('212 Fahrenheits', false, false, false, false, false, false, false, false), '212 Fahrenheits (100°C)˜');
    assert.equal(replaceFahrenheit('212 Fahrenheits (100 Celsius)', false, false, false, false, false, false, false, false), '212 Fahrenheits (100 Celsius)');
    assert.equal(replaceFahrenheit('32-212 °F', false, false, false, false, false, false, false, false), '32-212 °F (0 to 100°C)˜');

    assert.equal(replaceFahrenheit('-212 °F', false, false, false, false, false, false, false, false), '-212 °F (-136°C)˜');
    // NOTE: in ranges, the minus sign of the upper bound is ignore
    assert.equal(replaceFahrenheit('100--212 °F', false, false, false, false, false, false, false, false), '100--212 °F (38 to 100°C)˜');
    assert.equal(replaceFahrenheit('-100-212 °F', false, false, false, false, false, false, false, false), '-100-212 °F (-73 to 100°C)˜');
    assert.equal(replaceFahrenheit('-100--212 °F', false, false, false, false, false, false, false, false), '-100--212 °F (-73 to 100°C)˜');
}

function testReplaceFeetAndInches() {
    // TODO: the original value should not be removed
    assert.equal(replaceFeetAndInches('1 ft 2 in', false, false, false, false, false, false, false), ' (0.36 m)˜');
    assert.equal(replaceFeetAndInches('1 yd 2 in', false, false, false, false, false, false, false), ' (0.97 m)˜');
}

function testReplaceFeetAndInchesSymbol() {
    setIncludeImproperSymbols(false);
    assert.equal(replaceFeetAndInchesSymbol('1\' 2"', false, false, false, false, false, false, false, false, false, false), '1\' 2"');

    setIncludeImproperSymbols(true);
    // TODO: the original value should not be removed
    assert.equal(replaceFeetAndInchesSymbol('1\' 2"', true, false, false, false, false, false, false, false, false, false), '1\' 2" (35.56 cm)˜');
    assert.equal(replaceFeetAndInchesSymbol('3"', true, false, false, false, false, false, false, false, false, false), '3" (7.62 cm)˜');
    assert.equal(replaceFeetAndInchesSymbol('"they were 3"', true, false, false, false, false, false, false, false, false, false), '"they were 3"');
}

function testReplaceMaybeKeepLastChar() {
    assert.equal(replaceMaybeKeepLastChar('Hello, World!', 'World', 'Everyone'), 'Hello, Everyone!');
    assert.equal(replaceMaybeKeepLastChar('Hello, World!', 'World!', 'Everyone'), 'Hello, Everyone!');
}

function testReplaceMilesPerGallon() {
    assert.equal(replaceMilesPerGallon('12 mpg', false, false, false, false, false, false), '12 mpg (19.6 L/100 km)˜');
}

function testReplaceOtherUnits() {
    assert.equal(replaceOtherUnits('30 miles', false, false, false, false, false, false, false, false, false, false), '30 miles (48.28 km)˜');
    assert.equal(replaceOtherUnits('30 miles²', false, false, false, false, false, false, false, false, false, false), '30 miles² (77.7 km²)˜');
}

function testReplacePoundsAndOunces() {
    // TODO: the original value should not be removed
    assert.equal(replacePoundsAndOunces('1 lb 2 oz', false, false, false, false, false, false), ' (0.51 kg)˜');
}

function testReplaceSurfaceInFeet() {
    // TODO: the original value should not be removed
    assert.equal(replaceSurfaceInFeet('S = 1×2 ft', false, false, false, false, false, false, false), 'S =  (0.3 × 0.61  m)˜');
}

function testReplaceSurfaceInInches() {
    // TODO: the original value should not be removed
    assert.equal(replaceSurfaceInInches('S = 1×2 in', false, false, false, false, false, false, false), 'S =  (2.54 × 5.08  cm)˜');
}

function testReplaceVolume() {
    // TODO: the original value should not be removed
    assert.equal(replaceVolume('V = 1×2×3 in', false, false, false, false, false, false, false), 'V =  (2.54 × 5.08 × 7.62  cm)˜');
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

function testReplaceAll() {
    const html = fs.readFileSync('index.html', { encoding: 'utf-8' });
    fs.writeFileSync('oracles/default.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, false, false, false, false));
    fs.writeFileSync('oracles/useSpaces.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, false, false, false, true));
    fs.writeFileSync('oracles/useComma.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, false, false, true, false));
    fs.writeFileSync('oracles/useRounding.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, false, true, false, false));
    fs.writeFileSync('oracles/useBrackets.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, true, false, false, false));
    // TODO: useBold have no effect without useBrackets
    fs.writeFileSync('oracles/useBold.html', replaceAll(html, false, false, false, false, false, false, false, false, false, true, false, false, false, false));
    fs.writeFileSync('oracles/useBrackets+useBold.html', replaceAll(html, false, false, false, false, false, false, false, false, false, true, true, false, false, false));
    fs.writeFileSync('oracles/useKelving.html', replaceAll(html, false, false, false, false, false, false, false, false, true, false, false, false, false, false));
    fs.writeFileSync('oracles/useGiga.html', replaceAll(html, false, false, false, false, false, false, false, true, false, false, false, false, false, false));
    fs.writeFileSync('oracles/useMM.html', replaceAll(html, false, false, false, false, false, false, true, false, false, false, false, false, false, false));
    fs.writeFileSync('oracles/isUK.html', replaceAll(html, false, false, false, false, false, true, false, false, false, false, false, false, false, false));
    // NOTE: includeQuotes has no effect without includeImproperSymbols
    fs.writeFileSync('oracles/includeQuotes.html', replaceAll(html, false, false, false, false, true, false, false, false, false, false, false, false, false, false));
    // TODO: matchIn not seem to have any effect
    fs.writeFileSync('oracles/matchIn.html', replaceAll(html, false, false, false, true, false, false, false, false, false, false, false, false, false, false));
    setIncludeImproperSymbols(true);
    // TODO: includeImproperSymbols has no effect without includeQuotes
    fs.writeFileSync('oracles/includeImproperSymbols.html', replaceAll(html, false, false, true, false, false, false, false, false, false, false, false, false, false, false));
    fs.writeFileSync('oracles/includeQuotes+includeImproperSymbols.html', replaceAll(html, false, false, true, false, true, false, false, false, false, false, false, false, false, false));
    setIncludeImproperSymbols(false);
    fs.writeFileSync('oracles/degWithoutFahrenheit.html', replaceAll(html, false, true, false, false, false, false, false, false, false, false, false, false, false, false));
    fs.writeFileSync('oracles/convertBracketed.html', replaceAll(html, true, false, false, false, false, false, false, false, false, false, false, false, false, false));
}

function main() {
    testBold();
    testConvAndForm();
    testEvaluateFraction();
    testFahrenHeitToCelsius();
    testFormatConvertedValue();
    testFormatNumber();
    testInsertAt();
    testParseNumber();
    testReplaceFahrenheit();
    testReplaceFeetAndInches();
    testReplaceFeetAndInchesSymbol();
    testReplaceMaybeKeepLastChar();
    testReplaceMilesPerGallon();
    testReplaceOtherUnits();
    testReplacePoundsAndOunces();
    testReplaceSurfaceInFeet();
    testReplaceSurfaceInInches();
    testReplaceVolume();
    testRoundNicely();
    testStepUpOrDown();
    testShouldConvert();
    testWhereToInsertConvertedValue();
    testReplaceAll();
}

main();
