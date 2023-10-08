import assert from 'node:assert/strict';
import { bold, applyConversion, conversions, fahrenheitConversion, fahrenheitToMetric, formatConvertedValue, formatNumber, inchConversion, insertAt, maketrans, parseNumber, processTextBlock, replaceAll, replaceFahrenheit, replaceFeetAndInches, replaceFeetAndInchesSymbol, replaceMilesPerGallon, replaceOtherUnits, replacePoundsAndOunces, replaceSurfaceInFeet, replaceSurfaceInInches, replaceVolume, resetBlockProcessing, setIncludeImproperSymbols, roundNicely, shouldConvert, stepUpOrDown, convertedValueInsertionOffset } from './lib.js';

import fs from 'fs';

function testTranslate() {
    assert.equal('cat'.translate(maketrans('abc', 'def')), 'fdt');
    assert.equal('１２３'.translate(maketrans('１２３', '123')), '123');
}

function testBold() {
    assert.equal(bold('Hello, World!'), '𝗛𝗲𝗹𝗹𝗼, 𝗪𝗼𝗿𝗹𝗱!');
    assert.equal(bold('42 is an integer'), '𝟰𝟮 𝗶𝘀 𝗮𝗻 𝗶𝗻𝘁𝗲𝗴𝗲𝗿');
    assert.equal(bold('3.14 is not an integer'), '𝟯.𝟭𝟰 𝗶𝘀 𝗻𝗼𝘁 𝗮𝗻 𝗶𝗻𝘁𝗲𝗴𝗲𝗿');
}

function testConvAndForm() {
    assert.deepEqual(applyConversion(100, fahrenheitConversion, '', false, false, false, false), {met: 100, unit: '°C'});

    // useMM and useRounding interact in subtle ways
    assert.deepEqual(applyConversion(0.123, inchConversion, '', false, false, false, false), {met: 3.1, unit: 'mm'});
    assert.deepEqual(applyConversion(0.123, inchConversion, '', false, false, false, true), {met: 3.1, unit: 'mm'});
    assert.deepEqual(applyConversion(0.123, inchConversion, '', false, true, false, false), {met: 3, unit: 'mm'});
    assert.deepEqual(applyConversion(0.123, inchConversion, '', false, true, false, true), {met: 3.1, unit: 'mm'});

    // surfaces and volumes
    const feetToMConv = conversions[3];
    assert(feetToMConv);
    assert.deepEqual(applyConversion(100, feetToMConv, '', false, false, false, false), {met: 30.48, unit: 'm'});
    assert.deepEqual(applyConversion(100, feetToMConv, '²', false, false, false, false), {met: 9.29, unit: 'm²'});
    assert.deepEqual(applyConversion(100, feetToMConv, '³', false, false, false, false), {met: 2831.69, unit: 'L'});

    // US customary units vs imperial units
    const fluidOncesToMlConv = conversions[9];
    assert(fluidOncesToMlConv);
    assert.deepEqual(applyConversion(100, fluidOncesToMlConv, '', false, false, false, false), {met: 2957, unit: 'mL'});
    assert.deepEqual(applyConversion(100, fluidOncesToMlConv, '', true, false, false, false), {met: 2841, unit: 'mL'});
}

function testFahrenHeitToCelsius() {
    assert.equal(fahrenheitToMetric(0, false, false), -18);
    assert.equal(fahrenheitToMetric(32, false, false), 0);
    assert.equal(fahrenheitToMetric(100, false, false), 38);
    assert.equal(fahrenheitToMetric(212, false, false), 100);

    assert.equal(fahrenheitToMetric(0, true, false), 255.37);
    assert.equal(fahrenheitToMetric(32, true, false), 273.15);
    assert.equal(fahrenheitToMetric(100, true, false), 310.93);
    assert.equal(fahrenheitToMetric(212, true, false), 373.15);
}

function testFormatConvertedValue() {
    assert.equal(formatConvertedValue('123,456.789', 'm', false, false), ' (123,456.789 m)˜');
    assert.equal(formatConvertedValue('123,456.789', 'm', false, true), '\u200B【123,456.789 m】');
    assert.equal(formatConvertedValue('123,456.789', 'm', true, false), ' (123,456.789 m)˜');
    assert.equal(formatConvertedValue('123,456.789', 'm', true, true), '\u200B【𝟭𝟮𝟯,𝟰𝟱𝟲.𝟳𝟴𝟵 𝗺】');
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
    // simple integers
    assert.deepEqual(parseNumber('1'), { value: 1, significantFigures: 1 });
    assert.deepEqual(parseNumber('1001'), { value: 1001, significantFigures: 4 });
    assert.deepEqual(parseNumber('100000000000000000000000000000000'), { value: 1e32, significantFigures: 1 });

    // decimal numbers
    assert.deepEqual(parseNumber('-3.14'), { value: -3.14, significantFigures: 3 });
    assert.deepEqual(parseNumber('−3.14'), { value: -3.14, significantFigures: 3 });
    assert.deepEqual(parseNumber('3.14'), { value: 3.14, significantFigures: 3 });
    assert.deepEqual(parseNumber('+3.14'), { value: 3.14, significantFigures: 3 });

    // localized decimal numbers
    assert.deepEqual(parseNumber('1,2345.25'), { value: 12345.25, significantFigures: 7 });
    assert.deepEqual(parseNumber('1 2345.25'), { value: 12345.25, significantFigures: 7 });
    assert.deepEqual(parseNumber('1,2345.25'), { value: 12345.25, significantFigures: 7 });
    assert.deepEqual(parseNumber('+1 2345.25'), { value: 12345.25, significantFigures: 7 });
    assert.deepEqual(parseNumber('-1 2345.25'), { value: -12345.25, significantFigures: 7 });
    assert.deepEqual(parseNumber('−1,2345.25'), { value: -12345.25, significantFigures: 7 });
    assert.deepEqual(parseNumber('123,456,789'), { value: 123456789, significantFigures: 9 });

    // exponential notation
    assert.deepEqual(parseNumber('1e0'), { value: 1, significantFigures: 1 });
    assert.deepEqual(parseNumber('1e3'), { value: 1000, significantFigures: 1 });
    assert.deepEqual(parseNumber('1.5e3'), { value: 1500, significantFigures: 2 });
    // TODO: in exponential notation, all digits should be considered significant
    // assert.deepEqual(parseNumber('1.0e3'), { value: 1, significantFigures: 2 });
    assert.deepEqual(parseNumber('10e3'), { value: 10000, significantFigures: 1 });
    assert.deepEqual(parseNumber('+10e3'), { value: 10000, significantFigures: 1 });

    // fractions
    assert.deepEqual(parseNumber('½'), { value: 0.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('1 / 2'), { value: 0.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('1/ 2'), { value: 0.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('1 /2'), { value: 0.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('1/2'), { value: 0.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('2 / 1'), { value: 2.0, significantFigures: 0 });
    assert.deepEqual(parseNumber('1÷2'), { value: 0.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('1∕2'), { value: 0.5, significantFigures: 0 });

    // mixed numerals
    assert.deepEqual(parseNumber('3½'), { value: 3.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('3 ½'), { value: 3.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('3 1 / 2'), { value: 3.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('3 1/ 2'), { value: 3.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('3 1 /2'), { value: 3.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('3 1/2'), { value: 3.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('3 2 / 1'), { value: 5.0, significantFigures: 0 });
    assert.deepEqual(parseNumber('3 1÷2'), { value: 3.5, significantFigures: 0 });
    assert.deepEqual(parseNumber('3 1∕2'), { value: 3.5, significantFigures: 0 });

    // invalid numbers
    assert.equal(parseNumber('3/1∕2'), null);
    assert.equal(parseNumber('1e2e3'), null);
    assert.equal(parseNumber('1.2.3'), null);
    assert.equal(parseNumber('1+2'), null);
    assert.equal(parseNumber('1-2'), null);
}

function testProcessTextBlock() {
    /** @type{ [string, string, string][] } */
    const tests = [
        ['0', 'pounds of stuff', 'pounds (0 g)˜ of stuff'],
        ['1', 'pounds of stuff', 'pounds (450 g)˜ of stuff'],
        [' 1', 'pounds of stuff', 'pounds (450 g)˜ of stuff'],
        ['1 ', 'pounds of stuff', 'pounds (450 g)˜ of stuff'],
        [' 1 ', 'pounds of stuff', 'pounds (450 g)˜ of stuff'],
        ['1½', 'pounds of stuff', 'pounds (680 g)˜ of stuff'],
        ['1 ½', 'pounds of stuff', 'pounds (680 g)˜ of stuff'],
        ['1', 'in of stuff', 'in of stuff'],
        ['1½', 'in of stuff', 'in of stuff'],
        ['1 ½', 'in of stuff', 'in of stuff'],
        ['1', '" of stuff', '" of stuff'],
        ['1½', '" of stuff', '" of stuff'],
        ['1 ½', '" of stuff', '" of stuff'],
        ['1', 'miles of stuff', 'miles of stuff'],
        ['1½', 'miles of stuff', 'miles of stuff'],
        ['1 ½', 'miles of stuff', 'miles of stuff'],
        ['1', '°F of stuff', '°F (1 °C)˜ of stuff'],
        ['1½', '°F of stuff', '°F (1.5 °C)˜ of stuff'],
        ['1 ½', '°F of stuff', '°F (1.5 °C)˜ of stuff'],
    ];
    for (const [text1, text2, converted] of tests) {
        resetBlockProcessing();
        processTextBlock(text1, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false)
        const output = processTextBlock(text2, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false)
        assert.equal(output, converted, `Failed to properly parse "${text1}" + "${text2}"`);
    }
}

function testReplaceFahrenheit() {
    assert.equal(replaceFahrenheit('Saying 212 °F is the same as saying 100°C', false, false, false, false, false, false, false, false), 'Saying 212 °F (100 °C)˜ is the same as saying 100°C');

    assert.equal(replaceFahrenheit('(212 °)', false, false, false, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', false, false, true, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', false, true, false, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', false, true, true, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', true, false, false, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', true, false, true, false, false, false, false, false), '(212 °)');
    assert.equal(replaceFahrenheit('(212 °)', true, true, false, false, false, false, false, false), '(212 °) (100 °C)˜');
    assert.equal(replaceFahrenheit('(212 °)', true, true, true, false, false, false, false, false), '(212 °) (373.15 K)˜');

    // returns '1,203 °F (NaN°C)˜' instead of '1,203 °F (651°C)˜'
    // assert.equal(replaceFahrenheit('1,203 °F', false, false, false, false, false, false, false, false), '1,203 °F (651°C)˜');

    assert.equal(replaceFahrenheit('212 °F', false, false, false, false, false, false, false, false), '212 °F (100 °C)˜');
    assert.equal(replaceFahrenheit('212 degrees F', false, false, false, false, false, false, false, false), '212 degrees F (100 °C)˜');
    assert.equal(replaceFahrenheit('212 Fahrenheits', false, false, false, false, false, false, false, false), '212 Fahrenheits (100 °C)˜');
    assert.equal(replaceFahrenheit('212 Fahrenheits (100 Celsius)', false, false, false, false, false, false, false, false), '212 Fahrenheits (100 Celsius)');
    assert.equal(replaceFahrenheit('32-212 °F', false, false, false, false, false, false, false, false), '32-212 °F (0 to 100 °C)˜');

    assert.equal(replaceFahrenheit('-212 °F', false, false, false, false, false, false, false, false), '-212 °F (-136 °C)˜');
    // NOTE: in ranges, the minus sign of the upper bound is ignored
    assert.equal(replaceFahrenheit('100--212 °F', false, false, false, false, false, false, false, false), '100--212 °F (38 to 100 °C)˜');
    assert.equal(replaceFahrenheit('-100-212 °F', false, false, false, false, false, false, false, false), '-100-212 °F (-73 to 100 °C)˜');
    assert.equal(replaceFahrenheit('-100--212 °F', false, false, false, false, false, false, false, false), '-100--212 °F (-73 to 100 °C)˜');
}

function testReplaceFeetAndInches() {
    assert.equal(replaceFeetAndInches('1 ft 2 in', false, false, false, false, false, false, false), '1 ft 2 in (0.36 m)˜');
    assert.equal(replaceFeetAndInches('1 yd 2 in', false, false, false, false, false, false, false), '1 yd 2 in (0.97 m)˜');
    assert.equal(replaceFeetAndInches('1 yd 2 inches', false, false, false, false, false, false, false), '1 yd 2 inches (0.97 m)˜');
}

function testReplaceFeetAndInchesSymbol() {
    setIncludeImproperSymbols(false);
    assert.equal(replaceFeetAndInchesSymbol('1\' 2"', false, false, false, false, false, false, false, false, false, false), '1\' 2"');

    setIncludeImproperSymbols(true);
    assert.equal(replaceFeetAndInchesSymbol('1\' 2"', true, false, false, false, false, false, false, false, false, false), '1\' 2" (35.56 cm)˜');
    assert.equal(replaceFeetAndInchesSymbol('3"', true, false, false, false, false, false, false, false, false, false), '3" (7.62 cm)˜');
    assert.equal(replaceFeetAndInchesSymbol('"they were 3"', true, false, false, false, false, false, false, false, false, false), '"they were 3"');
}

function testReplaceMilesPerGallon() {
    assert.equal(replaceMilesPerGallon('12 mpg', false, false, false, false, false, false), '12 mpg (19.6 L/100 km)˜');
}

function testReplaceOtherUnits() {
    assert.equal(replaceOtherUnits('30 miles', false, false, false, false, false, false, false, false, false, false, false, false, false), '30 miles (48.28 km)˜');
    assert.equal(replaceOtherUnits('30 miles²', false, false, false, false, false, false, false, false, false, false, false, false, false), '30 miles² (77.7 km²)˜');
}

function testReplacePoundsAndOunces() {
    assert.equal(replacePoundsAndOunces('1 lb 2 oz', false, false, false, false, false, false), '1 lb 2 oz (0.51 kg)˜');
}

function testReplaceSurfaceInFeet() {
    assert.equal(replaceSurfaceInFeet('S = 1×2 ft', false, false, false, false, false, false, false), 'S = 1×2 ft (0.3 × 0.61 m)˜');
}

function testReplaceSurfaceInInches() {
    assert.equal(replaceSurfaceInInches('S = 1×2 in', false, false, false, false, false, false, false), 'S = 1×2 in (2.54 × 5.08 cm)˜');
}

function testReplaceVolume() {
    assert.equal(replaceVolume('V = 1×2×3 in', false, false, false, false, false, false, false), 'V = 1×2×3 in (2.54 × 5.08 × 7.62 cm)˜');
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
    setIncludeImproperSymbols(false);
    const html = fs.readFileSync('index.html', { encoding: 'utf-8' });
    fs.writeFileSync('oracles/default.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false));
    fs.writeFileSync('oracles/useSpaces.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true));
    fs.writeFileSync('oracles/useComma.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false));
    fs.writeFileSync('oracles/useRounding.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false));
    fs.writeFileSync('oracles/useBrackets.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false));
    // TODO: useBold have no effect without useBrackets
    fs.writeFileSync('oracles/useBold.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false));
    fs.writeFileSync('oracles/useBrackets+useBold.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, false, true, true, false, false, false));
    fs.writeFileSync('oracles/useKelving.html', replaceAll(html, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false));
    fs.writeFileSync('oracles/useGiga.html', replaceAll(html, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false));
    fs.writeFileSync('oracles/useMM.html', replaceAll(html, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false));
    fs.writeFileSync('oracles/isUK.html', replaceAll(html, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false));
    // NOTE: includeQuotes has no effect without includeImproperSymbols
    fs.writeFileSync('oracles/includeQuotes.html', replaceAll(html, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false));
    // TODO: matchIn not seem to have any effect
    fs.writeFileSync('oracles/matchIn.html', replaceAll(html, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false));
    setIncludeImproperSymbols(true);
    // TODO: includeImproperSymbols has no effect without includeQuotes
    fs.writeFileSync('oracles/includeImproperSymbols.html', replaceAll(html, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false));
    fs.writeFileSync('oracles/includeQuotes+includeImproperSymbols.html', replaceAll(html, false, false, false, false, true, false, true, false, false, false, false, false, false, false, false, false));
    setIncludeImproperSymbols(false);
    // TODO: degWithoutFahrenheit detects '212 °' but breaks detection of '212 °F'
    fs.writeFileSync('oracles/degWithoutFahrenheit.html', replaceAll(html, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false));
    fs.writeFileSync('oracles/convertBracketed.html', replaceAll(html, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false));
    fs.writeFileSync('oracles/convertTeaspoon.html', replaceAll(html, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false));
    fs.writeFileSync('oracles/convertTablespoon.html', replaceAll(html, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false));
}

function main() {
    testTranslate();
    testBold();
    testConvAndForm();
    testFahrenHeitToCelsius();
    testFormatConvertedValue();
    testFormatNumber();
    testInsertAt();
    testParseNumber();
    testProcessTextBlock();
    testReplaceFahrenheit();
    testReplaceFeetAndInches();
    testReplaceFeetAndInchesSymbol();
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
