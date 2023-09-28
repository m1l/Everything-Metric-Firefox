const regstart = '([(]?';
const regend = '([^a-z]|$)';
const intOrFloat = '([0-9,\\.]+)';
const intOrFloatNoFrac = '([\\.,0-9]+(?![/⁄]))?';
const skipbrackets = '(?! [(][0-9]|\u200B\u3010)';
const unitSuffix = '(?! [(][0-9]| ?\u200B\u3010)([^a-z]|$)';
//const unitSuffixIn = '(?! ?[(-−\u00A0]?[0-9]| ?\u200B\u3010)([^a-z²³]|$)';
const unitSuffixIn = '(?! ?[(-−\u00A0]?[0-9]| ?\u200B\u3010)([^a-z²³\u3010\u200B)]|$)';
const unitSuffixft = '(?! ?[(-−\u00A0]?[0-9]| ?\u200B\u3010)([^a-z²³\u3010\u200B)]|$)';
const unitfrac = '[-− \u00A0]?([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[0-9]+[/⁄][0-9]+)?';
const sqcu = '([-− \u00A0]?(square|sq\\.?|cubic|cu\\.?))?';
const sq = '([-− \u00A0]?(square|sq\\.?))?';
const skipempty = '^(?:\\s+)?';

/** @type{ RegExp } */
var feetInchRegex;

/** @type{ { [key: string]: number } } */
const fractions = {
    '¼': 1 / 4,
    '½': 1 / 2,
    '¾': 3 / 4,
    '⅐': 1 / 7,
    '⅑': 1 / 9,
    '⅒': 1 / 10,
    '⅓': 1 / 3,
    '⅔': 2 / 3,
    '⅕': 1 / 5,
    '⅖': 2 / 5,
    '⅗': 3 / 5,
    '⅘': 4 / 5,
    '⅙': 1 / 6,
    '⅚': 5 / 6,
    '⅛': 1 / 8,
    '⅜': 3 / 8,
    '⅝': 5 / 8,
    '⅞': 7 / 8
};

/** @type{ import("./types").Conversion } */
const fahrenheitConversion = {
    // regexUnit is set in replaceOtherUnits
    unit: '°C',
    multiplier: 1
};

/** @type{ import("./types").Conversion } */
const inchConversion = {
    //(?!in ) exclude... replaced with
    // (?:in )?  to exclude converting "born in 1948 in"
    //old regex: new RegExp('((?:in )?[a-z#$€£(]?' + intOrFloatNoFrac + unitfrac + sqcu + '[-− \u00A0]?in(ches|ch|²|³)?' + unitSuffixIn + ')', 'ig'),
    //added (?=[0-9]) otherwise it will match "it is in something"
    //regex: new RegExp('((?:in)?[a-z#$€£(]?(?=[0-9¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])([\\.,0-9]+(?![/⁄]))?[-− \u00A0]?([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[0-9]+[/⁄][0-9]+)?([-− \u00A0]?(sq\\.?|square|cu\\.?|cubic))?[-− \u00A0]?(?:in(ches|ch|²|³)?)( [a-z]+)?'+unitSuffixIn+')', 'ig'),
    regex: new RegExp('((?:in)?[a-z#$€£(]?(?=[0-9¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])([\\.,0-9]+(?![/⁄]))?[-− \u00A0]?([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[0-9]+[/⁄][0-9]+)?([-− \u00A0]?(square|sq\\.?|cubic|cu\\.?))?[-− \u00A0]?(in(ches|ch|²|³)?[)]?)( [a-z]+)?'+unitSuffixIn+')', 'ig'),
    unit: 'cm',
    unit2: 'mm',
    multiplier: 2.54,
    multiplier2: 25.4,
    multipliercu: 0.0163871,
    forceround2: true
};

/** @type{ import("./types").Conversion } */
const footConversion = {
    //([(]?[°º]? ?([\\.,0-9]+(?![/⁄]))?[-− \u00A0]?([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[0-9]+[/⁄][0-9]+)?[-− \u00A0]?(\'|′|’)(?![\'′’])(?! ?[(-− \u00A0]?[0-9]| \u3010)([^a-z]|$))
    // regex is set in setIncludeImproperSymbols
    unit: 'm',
    multiplier: 0.3048
};

/** @type{ import("./types").Conversion[] } */
const conversions = [
    fahrenheitConversion,
    inchConversion,
    footConversion,
    {
        regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + sqcu + '[-− \u00A0]?(feet|foot|ft)(²|³)?[)]?' + unitSuffixft + ')', 'ig'),
        unit: 'm',
        multiplier: 0.3048,
        multipliercu: 28.31690879986443
    },
    {
        regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + sq + '[ \u00A0]?(miles?|mi)(²|³)?' + unitSuffix + ')', 'ig'),
        unit: 'km',
        multiplier: 1.60934,
        forceround2: true
    },
    {
        regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + sq + '[ \u00A0]?(yards?|yd)(²|³)?' + unitSuffix + ')', 'ig'),
        unit: 'm',
        multiplier: 0.9144
    },
    {
        regex: new RegExp(regstart + intOrFloat + '[ \u00A0]?mph' + unitSuffix + ')', 'ig'),
        unit: 'km\/h',
        multiplier: 1.60934,
        forceround2: true,
        forceround: true
    },
    {
        regexUnit: new RegExp(skipempty + '(pound|lb)s?' + skipbrackets + regend, 'ig'),
        regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[ \u00A0\n]?(pound|lb)s?' + unitSuffix + ')', 'ig'),
        unit: 'kg',
        unit2: 'g',
        multiplier: 0.453592,
        multiplier2: 453.592,
        forceround2: true
    },
    {
        regexUnit: new RegExp(skipempty + '(ounces?|oz)' + skipbrackets + regend, 'ig'),
        regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[ \u00A0\n]?(ounces?|oz)' + unitSuffix + ')', 'ig'),
        unit: 'g',
        multiplier: 28.3495,
        forceround: true
    },
    {
        regexUnit: new RegExp(skipempty + 'fl(uid)? ?(ounces?|oz)' + skipbrackets + regend, 'ig'),
        regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[ \u00A0\n]?fl(uid)? ?(ounces?|oz)' + unitSuffix + ')', 'ig'),
        unit: 'mL',
        multiplier: 29.5735,
        forceround: true,
        multiplierimp: 28.4131
    },
    {
        regexUnit: new RegExp(skipempty + 'gal(lons?)' + skipbrackets + regend, 'ig'),
        regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[ \u00A0\n]?gal(lons?)?' + unitSuffix + ')', 'ig'),
        unit: 'L',
        multiplier: 3.78541,
        multiplierimp: 4.54609
    },
    {
        regexUnit: new RegExp(skipempty + '^pints?' + skipbrackets + regend, 'ig'),
        regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[ \u00A0\n]?pints?' + unitSuffix + ')', 'ig'),
        unit: 'L',
        unit2: 'mL',
        multiplier: 0.473176,
        multiplier2: 473.176,
        forceround2: true,
        multiplierimp: 0.568261
    },
    {
        regexUnit: new RegExp(skipempty + 'cups?'+skipbrackets + regend, 'ig'),
        regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[-− \u00A0\n]?cups?' + unitSuffix + ')', 'ig'),
        unit: 'mL',
        multiplier: 236.59,
        forceround: true,
        multiplierimp: 284.131
    },
    {
        regexUnit: new RegExp(skipempty + '(qt|quarts?)' + skipbrackets + regend, 'ig'),
        regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[-− \u00A0\n]?(qt|quarts?)' + unitSuffix + ')', 'ig'),
        unit: 'L',
        multiplier: 0.946353,
        multiplierimp: 1.13652
    },
    {
        regex: new RegExp(regstart + intOrFloat + '[ \u00A0]?stones?' + unitSuffix + ')', 'ig'),
        unit: 'kg',
        multiplier: 6.35029
    },
    {
        regex: new RegExp(regstart + intOrFloat + '[ \u00A0]?acres?' + unitSuffix + ')', 'ig'),
        unit: 'ha',
        multiplier: 0.4046856422
    },
    {
        regex: new RegExp(regstart + intOrFloat + '[ \u00A0]?horsepower?' + unitSuffix + ')', 'ig'),
        unit: 'kW',
        multiplier: 0.745699872
    },
];

/** @type{ import("./types").Conversion } */
const unitsTablespoon = {
    regexUnit: new RegExp(skipempty + '(tbsp|tablespoons?)'+skipbrackets + regend, 'ig'),
    regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[-− \u00A0\n]?(tbsp|tablespoons?)' + unitSuffix + ')', 'ig'),
    unit: 'mL',
    multiplier: 14.7868,
    forceround: true,
    multiplierimp: 17.7582
};

/** @type{ import("./types").Conversion } */
const unitsTeaspoon = {
    regexUnit: new RegExp(skipempty + '(tsp|teaspoons?)'+skipbrackets + regend, 'ig'),
    regex: new RegExp(regstart + intOrFloatNoFrac + unitfrac + '[-− \u00A0\n]?(tsp|teaspoons?)' + unitSuffix + ')', 'ig'),
    unit: 'mL',
    multiplier: 4.92892,
    forceround: true,
    multiplierimp: 5.91939
};

/** Evaluate text that looks like a fraction
 *  @param {string} frac - The fraction-like text
 *  @return {number} - The value of the fraction (0 if evaluation fails)
*/
function evaluateFraction(frac) {
    const value = fractions[frac];
    if (value !== undefined) {
        return value;
    }
    try {
        if (/[a-zA-Z,?!]/.test(frac)) {
            return 0;
        }
        let cleanedFrac = frac.replace(/[^\d/⁄]/, '');
        cleanedFrac = frac.replace(/[⁄]/, '/');
        if (cleanedFrac.length < 3) {
            return 0;
        }
        return eval(cleanedFrac);
    } catch (err) {
        return 0;
    }
}

/** If the value if smaller than 1, or larger than 10,000, use a more convenient SI prefix
 *  @param {number} met - The value
 *  @param {string} unit - The unit being used
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @return {import("./types").ValueWithUnit} - The scaled value with the appropriate unit
 */
function stepUpOrDown(met, unit, useMM, useGiga) {
    if (met < 1) {
        switch (unit) {
            case 'cm':
                met = met * 10;
                unit = "mm";
                break;
            case 'm':
                if (useMM === true) {
                    met = met * 1000;
                    unit = "mm";
                } else {
                    met = met * 100;
                    unit = "cm";
                }
                break;
            case 'km':
                met = met * 1000;
                unit = "m";
                break;
            case 'kg':
                met = met * 1000;
                unit = "g";
                break;
            case 'L':
                met = met * 1000;
                unit = "mL";
                break;
        }
    } else if (met > 10000) {
        if (useGiga) {
            if (met > 100000000) {
                switch (unit) {
                    case 'm':
                        met = met / 1000000000;
                        unit = "Gm";
                        break;
                    case 'g':
                        met = met / 1000000000;
                        unit = "Gg";
                        break;
                    case 'L':
                        met = met / 1000000000;
                        unit = "GL";
                        break;
                    case 'km':
                        met = met / 1000000;
                        unit = "Gm";
                        break;
                    case 'kg':
                        met = met / 1000000;
                        unit = "Gg";
                        break;
                }
            }
            if (met > 100000) {
                switch (unit) {
                    case 'm':
                        met = met / 1000000;
                        unit = "Mm";
                        break;
                    case 'g':
                        met = met / 1000000;
                        unit = "Mg";
                        break;
                    case 'L':
                        met = met / 1000000;
                        unit = "ML";
                        break;
                    case 'km':
                        met = met / 1000;
                        unit = "Mm";
                        break;
                    case 'kg':
                        met = met / 1000;
                        unit = "Mg";
                        break;
                    case 'kL':
                        met = met / 1000;
                        unit = "ML";
                        break;
                }
            }
            if (met > 1000) {
                if (unit === 'L') {
                    met = met / 1000;
                    unit = "KL";

                }
            }
        }

        switch (unit) {
            case 'mm':
                if (useMM === true) {
                    met = met / 1000;
                    unit = "m";
                } else {
                    met = met / 100;
                    unit = "cm";
                }
                break;
            case 'cm':
                met = met / 100;
                unit = "m";
                break;
            case 'm':
                met = met / 1000;
                unit = "km";
                break;
            case 'g':
                met = met / 1000;
                unit = "kg";
                break;
            case 'mL':
                met = met / 1000;
                unit = "L";
                break;
        }
    }


    return {
        met: met,
        unit: unit
    };
}

/** Create a new string where toInsert has been inserted in target at the position index
 *  @param {string} target - The string where toInsert should be inserted
 *  @param {string} toInsert - The string to insert
 *  @param {number} index - The position where toTarget should be inserted
 *  @return {string} - A new string with toInsert at position index
*/
function insertAt(target, toInsert, index) {
    return target.substr(0, index) + toInsert + target.substr(index);
}

/** Return true when the value does not need to be converted further
 *  @param {string} text - The text containing a non-metric value
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @return {boolean} - Whether the value should not be converted to metric
*/
function shouldConvert(text, convertBracketed) {
    if (/\u3010/.test(text)) { // the text contains 【
        return false;
    }
    if (convertBracketed) {
        // if the value is followed by a parenthesis, it is probably already converted. ex: 1 in (2.54 cm)
        return !/[(]/.test(text.substring(1));
    } else {
        // if the text has parentheses, it is either within parentheses, or probably already converted
        return !/[()]/.test(text);
    }
}

/** Convert a temperature from Fahrenheit to Celsius or Kelvin
 *  @param {number} f - A value in Fahrenheit
 *  @param {boolean} useKelvin - Whether the returned value will then be converted to Kelvin
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @return {number} - The value in Celsius
*/
function fahrenheitToMetric(f, useKelvin, useRounding) {
    if (useKelvin) {
        return roundNicely(273.15 + (5 / 9) * (f - 32), useRounding);
    } else {
        return Math.round((5 / 9) * (f - 32));
    }
}

/** Round a number
 *  @param {number} v - The number
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @return {number} - The rounded number
*/
function roundNicely(v, useRounding) {
    if (useRounding) {
        // try rounding to 0 decimal places
        const dec0 = Math.round(v);
        const relative_error0 = Math.abs(1 - (v / dec0));
        if (relative_error0 < .03) {
            // relative error is less than 3 %, OK
            return dec0;
        }

        // try rounding to 1 decimal place
        const dec1 = Math.round(v * 10) / 10;
        const relative_error1 = Math.abs(1 - (v / dec1));
        if (relative_error1 < .03) {
            // relative error is less than 3 %, OK
            return dec1;
        }
    }

    return Math.round(v * 100) / 100;
}

/** Format a number using user preferences for thousand separator and decimal separator
 *  @param {number} v - The number to format
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @return {string} - The formatted number
*/
function formatNumber(v, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator) {
    if (useCommaAsDecimalSeparator) {
        const withThousandSeparator = v.toLocaleString('de-DE');
        if (useSpacesAsThousandSeparator) {
            return withThousandSeparator.replace('.', '\u00A0');
        } else {
            return withThousandSeparator;
        }
    } else {
        const withThousandSeparator = v.toLocaleString('en-US');
        if (useSpacesAsThousandSeparator) {
            return withThousandSeparator.replace(',', '\u00A0');
        } else {
            return withThousandSeparator;
        }
    }
}

/** Decide exactly where the metric-converted value should be inserted in fullMatch
 *  @param {string} fullMatch - The text containing the non-metric value to convert
 *  @return {number} - The relative location where the metric-converted value should be inserted
*/
function convertedValueInsertionOffset(fullMatch) {
    const lastChar = fullMatch[fullMatch.length - 1];
    if (lastChar === undefined) {
        return 0;
    } else if (/[\s \.,;]/.test(lastChar)) {
        return fullMatch.length - 1;
    } else {
        return fullMatch.length;
    }
}

/** Translate text to bold Unicode code-points
 *  @param {string} text - The text to enbolden
 *  @return {string} - The enboldenned text
*/
function bold(text) {
    // convert digits to bold digits
    // 0x1D7EC is 𝟬 (MATHEMATICAL SANS-SERIF BOLD DIGIT ZERO)
    let out = text.replace(/\d/g, (c) => String.fromCodePoint(0x1D7EC - 48 + c.charCodeAt(0)));
    // convert lowercase Latin letters to bold lowercase Latin letters
    // 0x1D7EC is 𝗮 (MATHEMATICAL SANS-SERIF BOLD SMALL A)
    out = out.replace(/[a-z]/g, (c) => String.fromCodePoint(0x1D5EE - 97 + c.charCodeAt(0)));
    // convert uppercase Latin letters to bold uppercase Latin letters
    // 0x1D7EC is 𝗔 (MATHEMATICAL SANS-SERIF BOLD CAPITAL A)
    out = out.replace(/[A-Z]/g, (c) => String.fromCodePoint(0x1D5D4 - 65 + c.charCodeAt(0)));
    return out;
}

/** Format a value with its unit for insertion in the text
 *  @param {string} number - The formatted value
 *  @param {string} unit - The unit of the value
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - The formatted value along with its unit
*/
function formatConvertedValue(number, unit, useBold, useBrackets) {
    let fullstring = `${number} ${unit}`;
    if (useBrackets) {
        // \200B is ZERO WIDTH SPACE
        // \3010 is 【 (LEFT BLACK LENTICULAR BRACKET)
        // \3011 is 】 (RIGHT BLACK LENTICULAR BRACKET)
        // this avoids line-break between original value and converted value
        fullstring = "\u200B\u3010" + fullstring + "\u3011";
    } else {
        fullstring = " (" + fullstring + ")˜";
    }
    if (useBold && useBrackets) {
        fullstring = bold(fullstring);
    }
    return fullstring;
}

/** Return a new string where all occurrences of values in Fahrenheit have been converted to metric
 *  @param {string} s - The original text
 *  @return {number} - A new string with metric temperatures
*/
function parseNumber(s) {
    return parseFloat(s.replace('−', '-'));
}

/** Return a new string where all occurrences of values in Fahrenheit have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} degWithoutFahrenheit - Whether to assume that ° means °F, not °C
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useKelvin - Whether the returned value will then be converted to Kelvin
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric temperatures
*/
function replaceFahrenheit(text, degWithoutFahrenheit, convertBracketed, useKelvin, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    // NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
    const regex = new RegExp(
        [
            '[(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
            '([-−]?[0-9,\\.]+)', // digits, optionally prefixed with a minus sign
            // optionally, an additional number after a range marker
            '(?:',
                '(?: to | and |[-−]+)', // range marker
                '([-−]?[0-9,\\.]+)', // digits, optionally prefixed with a minus sign
            ')?',
            '[ \u00A0]?', // space or no-break space
            // degree Fahrenheit marker
            '(?:',
                    '(?:',
                        '(°|º|deg(rees)?)', // degree marker
                        '[ \u00A0]?', // space or no-break space
                        degWithoutFahrenheit ? '': 'F(ahrenheits?)?', // Fahrenheit marker
                    ')',
                '|',
                    '(?:Fahrenheits?)', // as a full word
                '|',
                    '[\u2109]', // Unicode ℉  (DEGREE FAHRENHEIT)
            ')',
            // check for already present conversion to Celsius
            '(?!', // negative look-ahead
                    ' ?', // optional space
                    '[(]',  // opening parenthesis
                    '[0-9]',  // some digit
                '|',
                    ' ?', // optional space
                    '\u200B', // ZERO WIDTH SPACE
                    '\u3010', // 【 (LEFT BLACK LENTICULAR BRACKET)
            ')',
            '(?:[^a-z]|$)', // look for a separator
        ].join(''),
        'ig'
    );

    let match;
    while ((match = regex.exec(text)) !== null) {
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        const firstNumber = match[1];
        if (!firstNumber) {
            continue;
        }
        const secondNumber = match[2];

        // upper-bound of the range, or single value
        const met1 = fahrenheitToMetric(parseNumber(firstNumber), useKelvin, useRounding);
        const formattedMet1 = formatNumber(met1, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);

        let met = formattedMet1;

        // lower-bound of the range
        if (secondNumber) {
            const met2 = fahrenheitToMetric(parseNumber(secondNumber), useKelvin, useRounding);
            const formattedMet2 = formatNumber(met2, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
            met += ' to ' + formattedMet2;
        }

        const unit = useKelvin ? 'K' : '°C';
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        const metStr = formatConvertedValue(met, unit, useBold, useBrackets);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Return a new string where match has been replaced with replacement in haystack
 *  @param {string} haystack - Where to search for the pattern
 *  @param {string} needle - The pattern to be replaced
 *  @param {string} replacement - The replacement
 *  @return {string} - Text, where needle has been replaced with replacement
*/
function replaceMaybeKeepLastChar(haystack, needle, replacement) {
    const lastChar = needle[needle.length -1];
    if (lastChar && /[^a-z"″”“’'′]/i.test(lastChar)) {
        return haystack.replace(needle, replacement + lastChar);
    } else {
        return haystack.replace(needle, replacement);
    }
}

/** Return a new string where all occurrences of volumes (“L×l×h in”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric volumes
*/
function replaceVolume(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    // NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
    const regex = new RegExp(
        [
            '[(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
            '([0-9]+(?:\\.[0-9]+)?)', // number
            '[ \u00A0]?', // space or no-break space
            '[x*×]', // multiplication sign
            '[ \u00A0]?', // space or no-break space
            '([0-9]+(?:\\.[0-9]+)?)', // number
            '[ \u00A0]?', // space or no-break space
            '[x*×]', // multiplication sign
            '[ \u00A0]?', // space or no-break space
            '([0-9]+(?:\\.[0-9]+)?)', // number
            '[ \u00A0]?', // space or no-break space
            'in(ches|ch|\\.)?', // unit
            // check for already present conversion to metric
            unitSuffix,
        ].join(''),
        'ig',
    );

    let match;
    while ((match = regex.exec(text)) !== null) {
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }
        const dim1 = match[1];
        const dim2 = match[2];
        const dim3 = match[3];
        if (!dim1 || !dim2 || !dim3) {
            continue;
        }
        let scale = 2.54;
        let unit = 'cm';
        if (useMM === true) {
            scale = 25.4;
            unit = 'mm';
        }
        const cm1 = formatNumber(roundNicely(parseNumber(dim1) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const cm2 = formatNumber(roundNicely(parseNumber(dim2) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const cm3 = formatNumber(roundNicely(parseNumber(dim3) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(`${cm1} × ${cm2} × ${cm3}`, unit, useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Return a new string where all occurrences of surfaces in inches (“L×l in”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric surfaces
*/
function replaceSurfaceInInches(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    // NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
    const regex = new RegExp(
        [
            '[(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
            '([0-9]+(?:\\.[0-9]+)?)', // number
            '[-− \u00A0]?', // space or no-break space
            '[x*×]',  // multiplication sign
            '[-− \u00A0]?', // space or no-break space
            '([0-9]+(?:\\.[0-9]+)?)', // number
            '[-− \u00A0]?', // space or no-break space
            'in(ches|ch|.)?',  // unit
            // check for already present conversion to metric
            unitSuffix,
        ].join(''),
        'ig',
    );

    let match;
    while ((match = regex.exec(text)) !== null) {
        if (/[0-9][Xx*×][ \u00A0][0-9]/.test(match[0])) {
            continue; //it is 2x 2in something so no conversion
        }
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        const dim1 = match[1];
        const dim2 = match[2];
        if (!dim1 || !dim2) {
            continue;
        }

        let scale = 2.54;
        let unit = 'cm';
        if (useMM === true) {
            scale = 25.4;
            unit = 'mm';
        }
        const cm1 = formatNumber(roundNicely(parseNumber(dim1) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const cm2 = formatNumber(roundNicely(parseNumber(dim2) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(`${cm1} × ${cm2}`, unit, useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Return a new string where all occurrences of surfaces in feet (“L×l ft”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric surfaces
*/
function replaceSurfaceInFeet(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    // NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
    const regex = new RegExp(
        [
            '[(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
            '([0-9]+(?:\\.[0-9]+)?)', // number
            '[\'′’]?',  // allow feet symbol on first number
            '[-− \u00A0]?', // space or no-break space
            '[x*×]', // multiplication sign
            '[-− \u00A0]?', // space or no-break space
            '([0-9]+(?:\\.[0-9]+)?)', // number
            '[-− \u00A0]?', // space or no-break space
            '(feet|foot|ft|[\'′’])', // unit
            '(?![0-9])', // maybe to avoid matching feet2 for feet²?
            // check for already present conversion to metric
            unitSuffix
        ].join(''),
        'ig',
    );

    let match;
    while ((match = regex.exec(text)) !== null) {
        if (/[0-9][xX*×][ \u00A0][0-9]/.test(match[0])) {
            continue; //it is 2x 2ft something so no conversion
        }
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        const dim1 = match[1];
        const dim2 = match[2];
        if (!dim1 || !dim2) {
            continue;
        }

        let scale = 0.3048;
        let unit = 'm';
        // TODO: use useMM

        const m1 = formatNumber(roundNicely(parseNumber(dim1) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const m2 = formatNumber(roundNicely(parseNumber(dim2) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(`${m1} × ${m2}`, unit, useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Return a new string where all occurrences of lengths in feet and inches (“1 ft 2 in”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric lengths
*/
function replaceFeetAndInches(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    // NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
    const regex = new RegExp(
        [
            '([0-9]{0,3})', // number
            '.?', // separator
            '(ft|yd|foot|feet)', // larger unit
            '.?', // separator
            '([0-9]+(\\.[0-9]+)?)', // number
            '.?', // separator
            'in(?:ches|ch)?', // smaller unit
        ].join(''),
        'g',
    );

    let match;
    while ((match = regex.exec(text)) !== null) {
        const dim1 = match[1];
        const larger_unit = match[2];
        const dim2 = match[3];
        if (!dim1 || !larger_unit ||!dim2) {
            continue;
        }

        const yards_or_feet = parseFloat(dim1);
        const inches = parseFloat(dim2);

        const is_yards = new RegExp('yd', 'i');
        const feet = is_yards.test(larger_unit) ? yards_or_feet * 3 : yards_or_feet;
        const total = feet * 12 + inches;
        const m = formatNumber(roundNicely(total * 0.0254, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(m, 'm', useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Round a value, sometimes force to use 0 decimal places
 *  @param {number} met - The value to round
 *  @param {boolean} forceRounding - Round to 0 decimal places anywau
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @return {number} - The rounded value
*/
function roundMaybeNicely(met, forceRounding, useRounding) {
    if (forceRounding) {
        return Math.round(met);
    } else {
        return roundNicely(met, useRounding);
    }
}

/** Convert and format an unit from unit at unitIndex into metric
 *  @param {number} imp - The value, possibly in imperial units
 *  @param {import("./types").Conversion} conversion - The description of the conversion to apply
 *  @param {string} suffix - Optional '²' or '³'
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @return {import("./types").ValueWithUnit} - The value with the appropriate unit
*/
function applyConversion(imp, conversion, suffix, isUK, useMM, useGiga, useRounding) {
    let multiplier = conversion.multiplier;
    if (isUK === true && conversion.multiplierimp !== undefined) {
        multiplier = conversion.multiplierimp;
    }
    let unit = conversion.unit;
    if (useMM === true && conversion.multiplier2 !== undefined && conversion.unit2 !== undefined) {
        unit = conversion.unit2;
        multiplier = conversion.multiplier2;
    }
    const forceRounding = (useRounding === false &&
        ((useMM === true && conversion.multiplier2 !== undefined && conversion.forceround2) || conversion.forceround === true));

    let met;
    /*if (unitIndex < 2 ) {
        met = fahrenheitToCelsius(imp, useKelvin);
        if (useKelvin) {
            met += 273.15;
            met = roundNicely(met, useRounding);
            unit = 'K';
        }
    } else*/
    if (suffix === '²')
        met = roundMaybeNicely(imp * Math.pow(multiplier, 2), forceRounding, useRounding);
    else if (suffix === '³') {
        if (conversion.multipliercu === undefined) {
            return { met: 0, unit: '' }; // TODO
        }
        met = roundMaybeNicely(imp * conversion.multipliercu, forceRounding, useRounding);
        unit = 'L';
        suffix = '';
    } else {
        met = roundMaybeNicely(imp * multiplier, forceRounding, useRounding);
        let r = stepUpOrDown(met, unit, useMM, useGiga);

        met = roundNicely(r.met, useRounding);
        unit = r.unit;
    }

    if (met === 100 && unit === 'cm' && useMM === false) {
        met = 1;
        unit = 'm';

    } else if (met === 1000 && unit === 'mm' && useMM === true) {
        met = 1;
        unit = 'm';
    }

    return { met, unit: unit + suffix };
}

// TODO: remove global variable
/** Configure global regex feetInchRegex depending on unofficial symbols should be supported for feet and inches
 *  @param {boolean} includeImproperSymbols} - Whether to support unofficial symbols for feet and inches
*/
function setIncludeImproperSymbols(includeImproperSymbols) {
    // NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
    if (includeImproperSymbols) {
        feetInchRegex = new RegExp(
            [
                '(?:',
                    '[°º]?', // optional degree marker, TODO: don't know why
                    // feet
                    '(?:',
                        '[ \u00A0a-z]{0,1}', // optional space, no-break space, or lower-case Latin letter, TODO: don't know why letter
                        '([0-9]{1,3})',  // number
                        '[\'’′]', // feet marker (NOTE: with improper symbols)
                        '[-− \u00A0]?', // optional separator
                    ')?',
                    // mixed numeral
                    '(?:',
                        // integer
                        '(?:',
                            '([\\.,0-9]+)', // number
                            '(?!/)', // check that this is not part of a fraction
                            '(?:[-− \u00A0]?)', // optional separator
                        ')?',
                        // proper fraction
                        '(',
                                '[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]', // fraction as Unicode code-point
                            '|',
                            // fraction written more conventionally
                                '[0-9]+', // number
                                '[/⁄]', // fraction bar
                                '[0-9\\.]+', // number, TODO: why allow decimal point here?
                        ')?',
                    ')?',
                    '[ \u00A0]?', // optional separator
                    '(?:"|″|”|“|’’|\'\'|′′)', // inches marker (NOTE: with improper symbols)
                ')',
                // NOTE: since we include quotes as symbols for inches, we need
                // to detect when they are used on their to open a quotation
                '|',
                '(["″”“\n])',
                // check for already present conversion to metric
                '(?!', // negative look-ahead
                        ' ', // non-optional space
                        '[(]',  // opening parenthesis
                        '[0-9]',  // some digit
                    '|',
                        ' ?', // optional space
                        '\u200B', // ZERO WIDTH SPACE
                        '\u3010', // 【 (LEFT BLACK LENTICULAR BRACKET)
                ')',
            ].join(''),
            'gi',
        );
    } else {
        feetInchRegex = new RegExp(
            [
                '(?:',
                    '[°º]?', // optional degree marker, TODO: don't know why
                    // feet
                    '(?:',
                        '[ \u00A0a-z]{0,1}', // optional space, no-break space, or lower-case Latin letter, TODO: don't know why letter
                        '([0-9]{1,3})',  // number
                        '[′]', // feet marker (NOTE: without improper symbols)
                        '[-− \u00A0]?', // optional separator
                    ')?',
                    // mixed numeral
                    '(?:',
                        // integer
                        '(?:',
                            '([\\.,0-9]+)', // number
                            '(?!/)', // check that this is not part of a fraction
                            '(?:[-− \u00A0]?)', // optional separator
                        ')?',
                        // proper fraction
                        '(',
                                '[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]', // fraction as Unicode code-point
                            '|',
                            // fraction written more conventionally
                                '[0-9]+', // number
                                '[/⁄]', // fraction bar
                                '[0-9\\.]+', // number, TODO: why allow decimal point here?
                        ')?',
                    ')?',
                    '[ \u00A0]?', // optional separator
                    '(?:″|′′)', // inches marker (NOTE: without improper symbols)
                ')',
                // NOTE: since we do not include double quotes as symbols for
                // inches, there is no need to check whether they are for a
                // quotation
                //
                // check for already present conversion to metric
                '(?!', // negative look-ahead
                        ' ', // non-optional space
                        '[(]',  // opening parenthesis
                        '[0-9]',  // some digit
                    '|',
                        ' ?', // optional space
                        '\u200B', // ZERO WIDTH SPACE
                        '\u3010', // 【 (LEFT BLACK LENTICULAR BRACKET)
                ')',
            ].join(''),
            'gi',
        );
    }

    if (includeImproperSymbols) {
        footConversion.regex = new RegExp('([(]?[°º]?[ \u00A0]?' + intOrFloatNoFrac + unitfrac + '[-− \u00A0]?(\'|′|’)(?![\'′’])' + unitSuffixft + ')', 'g');
    } else {
        footConversion.regex = new RegExp('([(]?[°º]?[ \u00A0]?' + intOrFloatNoFrac + unitfrac + '[-− \u00A0]?([′])(?![′])' + unitSuffixft + ')', 'g');
    }
}

/** Return whether myString contains a number
 *  @param {string} myString - The string to test
 *  @return {boolean} - True when myString contains a number; false otherwise
*/
function hasNumber(myString) {
    return /\d/.test(myString);
}

/** Return a new string where all occurrences of lengths in feet and inches (“1' 2"”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} includeImproperSymbols - Whether to use unofficial symbols for feet and inches
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric lengths
*/
function replaceFeetAndInchesSymbol(text, includeImproperSymbols, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    // NOTE: part of the logic is dedicated to detecting things of the form
    // '"they were 3"' to avoid parsing '3"' as 3 inches
    let lastQuoteOpen = false;
    let match;
    while ((match = feetInchRegex.exec(text)) !== null) {
        if (includeImproperSymbols) {
            if (lastQuoteOpen) {
                lastQuoteOpen = false;
                continue;
            }
            if (match[4] === '\n') {
                lastQuoteOpen = false; //new line, ignore
                continue;
            }
            if (!hasNumber(match[0]) && !/[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g.test(match[0])) {
                lastQuoteOpen = !lastQuoteOpen;
                continue;
            }
        }

        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        if (/[°º]/.test(match[0].charAt(0))) {
            continue;
        }
        if (/[a-wy-z]/i.test(match[0].charAt(0))) {
            lastQuoteOpen = !lastQuoteOpen;
            continue;
        }

        let feet = parseFloat(match[1] || '0');
        if (isNaN(feet)) {
            feet = 0;
        }

        let inchesStr = match[2] || '0';
        if (inchesStr.length < 5) { // guess when comma use as decimal separator
            inchesStr = inchesStr.replace(',', '.');
        }
        let inches = parseFloat(inchesStr);
        if (isNaN(inches)) {
            inches = 0;
        }

        if (match[3] !== undefined) {
            inches += evaluateFraction(match[3]);
        }

        if (inches === 0 || isNaN(inches)) {
            continue;
        }

        // convert to m when over 3 feet, to cm (or mm) otherwise
        const ret = (
            feet + inches / 12 > 3
            ? applyConversion(feet + inches / 12, footConversion, '', isUK, useMM, useGiga, useRounding)
            : applyConversion(feet * 12 + inches, inchConversion, '', isUK, useMM, useGiga, useRounding)
        );

        const met = formatNumber(ret.met, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(met, ret.unit, useBold, useBrackets);

        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Return a new string where all occurrences of weights (“1 lb 2 oz”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric weights
*/
function replacePoundsAndOunces(text, convertBracketed, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    // NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
    const regex = new RegExp(
        [
            '([0-9]{0,3})', // number
            '.?', // separator
            '(?:lbs?)', // pounds unit
            '.?', // separator
            '([0-9]+(\\.[0-9]+)?)', // number
            '.?', // separator
            'oz', // ounces unit
        ].join(''),
        'g',
    );

    let match;
    while ((match = regex.exec(text)) !== null) {
        const poundsPart = match[1];
        const ouncesPart = match[2];
        if (!poundsPart || !ouncesPart) {
            continue;
        }
        const pounds = parseFloat(poundsPart);
        const ounces = parseFloat(ouncesPart);
        const total = pounds * 16 + ounces;
        const formattedTotal = formatNumber(roundNicely(total * 0.0283495, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(formattedTotal, 'kg', useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Return a new string where all occurrences of miles-per-gallon (“12 mpg”) have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric equivalent to mpg
*/
function replaceMilesPerGallon(text, convertBracketed, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    const regex = new RegExp(regstart + intOrFloat + '[ \u00A0]?mpgs?' + unitSuffix + ')', 'ig');

    let match;
    while ((match = regex.exec(text)) !== null) {
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        let impPart = match[2];
        if (!impPart) {
            continue;
        }
        impPart = impPart.replace(',', '');

        const imp = parseFloat(impPart);
        const l = 235.214583 / imp; // 100 * 3.785411784 / 1.609344 * imp;
        const met = roundNicely(l, useRounding);
        const formattedMet = formatNumber(met, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);

        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        const metStr = formatConvertedValue(formattedMet, 'L/100 km', useBold, useBrackets);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Return a new string where all occurrences of surfaces in the US Ikea format has been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric surfaces
*/
function replaceIkeaSurface(text, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    // NOTE: JavaScript does not have free-spacing mode, so we make do with what we have
    const regex = new RegExp(
        [
            // NOTE: Firefox now supports negative look-behinds, so this version might be usable
            // check that this is not preceded by a fraction bar
            (
                false
                ? '(?<!/)' // with look-behind
                : '/?' // manually, TODO: it looks like the check is not done at all
            ),
            // mixed numeral
            '(?:',
                '([0-9]+(?!/))', // integer that is not the numerator of a fraction
                '[-− \u00A0]', // separator
                '([0-9]+[/⁄][0-9\\.]+)?', // optional fraction
            ')',
            ' ?', // optional space
            '[x*×]', // multiplication sign
            ' ?', // optional space
            // mixed numeral
            '(?:',
                '([0-9]+(?!/))?', // integer that is not the numerator of a fraction
                '[-− \u00A0]', // separator
                '([0-9]+[/⁄][0-9\\.]+)?', // optional fraction
            ')?',
            ' ?', // optional space
            '(?:"|″|”|“|’’|\'\'|′′)', // inches marker
            '(?:[^a-z]|$)', // look for a separator
        ].join(''),
        'ig',
    );

    let match;
    while ((match = regex.exec(text)) !== null) {
        let inches1 = parseFloat(match[1] || '0');
        if (isNaN(inches1)) {
            inches1 = 0;
        }

        const frac1 = evaluateFraction(match[2] || '0');
        if (isNaN(frac1)) {
            continue;
        }
        inches1 += frac1;

        let inches2 = parseFloat(match[3] || '0');
        if (isNaN(inches2)) {
            inches2 = 0;
        }

        const frac2 = evaluateFraction(match[4] || '0');
        if (isNaN(frac2)) {
            continue;
        }
        inches2 += frac2;

        let scale = 2.54;
        let unit = 'cm';
        if (useMM === true) {
            scale = 25.4;
            unit = 'mm';
        }

        const cm1 = formatNumber(roundNicely(inches1 * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const cm2 = formatNumber(roundNicely(inches2 * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(`${cm1} × ${cm2}`, unit, useBold, useBrackets);
        const insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Return a new string where all occurrences of a given non-metric unit have been converted to metric
 *  @param {string} text - The original text
 *  @param {import("./types").Conversion} conversion - The object describing the conversion
 *  @param {boolean} matchIn - Whether expressions of the form /\d+ in/ should be converted, e.g. "born in 1948 in…"
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric units
*/
function replaceOtherUnit(text, conversion, matchIn, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    if (conversion.regex === undefined) {
        return text;
    }

    let match;
    while ((match = conversion.regex.exec(text)) !== null) {
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        const firstPart = match[1];
        let impStr = match[2];
        let fraction = match[3];
        const unit = match[5];
        const additionalNumber = match[7];
        const qualifier = match[8];

        if (impStr !== undefined && !/(?:^|\s)([-−]?\d*\.?\d+|\d{1,3}(?:,\d{3})*(?:\.\d+)?)(?!\S)/g.test(impStr)) {
            continue;
        }

        let subtract = 0;
        if (conversion == inchConversion) {
            //if (/[a-z#$€£]/i.test(match[1].substring(0,1)))
            if (/^[a-z#$€£]/i.test(match[0]))
                continue;
            if (/^in /i.test(match[0])) //born in 1948 in ...
                continue;
            if (!matchIn && / in /i.test(match[0])) //born in 1948 in ...
                continue;
            if (qualifier !== undefined) {
                if (additionalNumber !== undefined && hasNumber(additionalNumber)) continue; //for 1 in 2 somethings
                if (qualifier == ' a') continue;
                if (qualifier == ' an') continue;
                if (qualifier == ' the') continue;
                if (qualifier == ' my') continue;
                if (qualifier == ' his') continue;
                if (qualifier == '-') continue;
                if (/ her/.test(qualifier)) continue;
                if (/ their/.test(qualifier)) continue;
                if (/ our/.test(qualifier)) continue;
                if (/ your/.test(qualifier)) continue;
                subtract = qualifier.length;
            }
        }
        if (conversion == footConversion) {
            if (firstPart !== undefined && /[°º]/.test(firstPart)) continue;
            if (unit !== undefined && /\d/ig.test(unit)) continue; //avoid 3' 5"
        }
        let suffix = '';

        let imp = 0;
        if (impStr !== undefined) {
            impStr = impStr.replace(',', '');

            if (/[⁄]/.test(impStr)) { //improvisation, but otherwise 1⁄2 with register 1 as in
                fraction = impStr;
                imp = 0;
            } else {
                imp = parseFloat(impStr);
                if (isNaN(imp)) {
                    imp = 0;
                }
            }
        }

        if (conversion == inchConversion && / in /i.test(match[0]) && imp > 1000) {
            continue; //prevents 1960 in Germany
        }

        if (fraction === '/') {
            continue; // 2,438/sqft
        }
        if (fraction !== undefined) {
            imp += evaluateFraction(fraction);
        }

        if (imp === 0 || isNaN(imp)) {
            continue;
        }

        if (firstPart !== undefined && /²/.test(firstPart)) {
            suffix = '²';
        } else if (firstPart !== undefined && /³/.test(firstPart)) {
            suffix = '³';
        } else if (unit !== undefined && unit.toLowerCase().indexOf('sq') !== -1) {
            suffix = '²';
        } else if (unit !== undefined && unit.toLowerCase().indexOf('cu') !== -1) {
            suffix = '³';
        }

        const ret = applyConversion(imp, conversion, suffix, isUK, useMM, useGiga, useRounding);
        const met = formatNumber(ret.met, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(met, ret.unit, useBold, useBrackets);

        let insertIndex = match.index + convertedValueInsertionOffset(match[0]);
        insertIndex = insertIndex - subtract; //subtracts behind bracket
        text = insertAt(text, metStr, insertIndex);
    }
    return text;
}

/** Return a new string where all occurrences of other non-metric units have been converted to metric
 *  @param {string} text - The original text
 *  @param {boolean} convertTablespoon - Whether to convert tablespoons
 *  @param {boolean} convertTeaspoon - Whether to convert teaspoons
 *  @param {boolean} degWithoutFahrenheit - Whether to assume that ° means °F, not °C
 *  @param {boolean} matchIn - Whether expressions of the form /\d+ in/ should be converted, e.g. "born in 1948 in…"
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string with metric units
*/
function replaceOtherUnits(text, convertTablespoon, convertTeaspoon, degWithoutFahrenheit, matchIn, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets) {
    for (const conversion of conversions) {
        text = replaceOtherUnit(text, conversion, matchIn, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    }

    if (convertTablespoon) {
        text = replaceOtherUnit(text, unitsTablespoon, matchIn, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    }
    if (convertTeaspoon) {
        text = replaceOtherUnit(text, unitsTeaspoon, matchIn, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    }
    return text;
}

/** Return a new string where non-metric units has been replaced with metric units
 *  @param {string} text - The original text
 *  @param {boolean} convertTablespoon - Whether to convert tablespoons
 *  @param {boolean} convertTeaspoon - Whether to convert teaspoons
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} degWithoutFahrenheit - Whether to assume that ° means °F, not °C
 *  @param {boolean} includeImproperSymbols} - Whether to support unofficial symbols for feet and inches
 *  @param {boolean} matchIn - Whether expressions of the form /\d+ in/ should be converted, e.g. "born in 1948 in…"
 *  @param {boolean} includeQuotes - Whether single and double quotes should be interpreted as feet and inches
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useKelvin - Whether the returned value will then be converted to Kelvin
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useCommaAsDecimalSeparator - Whether to use a comma as decimal separator
 *  @param {boolean} useSpacesAsThousandSeparator - Whether to use spaces as thousand separator
 *  @return {string} - A new string with metric units
*/
function replaceAll(text, convertTablespoon, convertTeaspoon, convertBracketed, degWithoutFahrenheit, includeImproperSymbols, matchIn, includeQuotes, isUK, useMM, useGiga, useKelvin, useBold, useBrackets, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator) {
    text = replaceIkeaSurface(text, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    if (includeQuotes)
        text = replaceFeetAndInchesSymbol(text, includeImproperSymbols, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceVolume(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceSurfaceInInches(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceSurfaceInFeet(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceFeetAndInches(text, convertBracketed, useMM, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replacePoundsAndOunces(text, convertBracketed, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceOtherUnits(text, convertTablespoon, convertTeaspoon, degWithoutFahrenheit, matchIn, convertBracketed, isUK, useMM, useGiga, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceMilesPerGallon(text, convertBracketed, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    text = replaceFahrenheit(text, degWithoutFahrenheit, convertBracketed, useKelvin, useRounding, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator, useBold, useBrackets);
    return text;
}

/** @type{ number | undefined } */
var lastquantity = 0;
var skips = 0;
var foundDegreeSymbol = false;
/** Replace non-metric units with metric units and handle cross-node cases
 *  @param {string} text - The original text
 *  @param {boolean} convertTablespoon - Whether to convert tablespoons
 *  @param {boolean} convertTeaspoon - Whether to convert teaspoons
 *  @param {boolean} convertBracketed - Whether values that are in brackets should still be converted
 *  @param {boolean} degWithoutFahrenheit - Whether to assume that ° means °F, not °C
 *  @param {boolean} includeImproperSymbols} - Whether to support unofficial symbols for feet and inches
 *  @param {boolean} matchIn - Whether expressions of the form /\d+ in/ should be converted, e.g. "born in 1948 in…"
 *  @param {boolean} includeQuotes - Whether single and double quotes should be interpreted as feet and inches
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useKelvin - Whether the returned value will then be converted to Kelvin
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useComma - Whether to use a comma as decimal separator
 *  @param {boolean} useSpaces - Whether to use spaces as thousand separator
 *  @return {string} - A new string with metric units
*/
function processTextBlock(text, convertTablespoon, convertTeaspoon, convertBracketed, degWithoutFahrenheit, includeImproperSymbols, matchIn, includeQuotes, isUK, useMM, useGiga, useKelvin, useBold, useBrackets, useRounding, useComma, useSpaces) {
    if (text.startsWith('{') || text.length < 1) {
        return text;
    }

    // skipping added for quantity and unit in separate blocks - after the number is found, sometimes next node is just a bunch of whitespace, like in cooking.nytimes, so we try again on the next node

    if (lastquantity !== undefined && lastquantity !== 0 && skips < 2) {
        text = parseUnitOnly(text, degWithoutFahrenheit, isUK, useMM, useGiga, useKelvin, useRounding, useComma, useSpaces, useBold, useBrackets);
        if (/^[a-zA-Z°º]+$/g.test(text)) {
            lastquantity = 0;
        }
        else {
            skips++;
            if (/[°º]/g.test(text)) {
                foundDegreeSymbol=true;
            } else {
                foundDegreeSymbol=false;
            }
        }
    } else {
        lastquantity = 0;
        if (text.length < 50) {
            let quantity = parseNumberWithPadding(text);
            lastquantity = quantity;
            skips = 0;
        }
    }
    if ((lastquantity !== undefined && lastquantity !== 0 && skips <= 2) || /[1-9¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g.test(text)) {
        text = replaceAll(text, convertTablespoon, convertTeaspoon, convertBracketed, degWithoutFahrenheit, includeImproperSymbols, matchIn, includeQuotes, isUK, useMM, useGiga, useKelvin, useBold, useBrackets, useRounding, useComma, useSpaces);
    }

    return text;
}

/** Parse a number, allows white space before and after the pattern
 *  @param {string} text - The string containing the number
 *  @return {number | undefined} - The parsed number in case of success, or undefined otherwise
*/
function parseNumberWithPadding(text) {
    let regex = new RegExp('^(?![a-z])(?:[ \n\t]+)?([\.,0-9]+(?![\/⁄]))?(?:[-\− \u00A0])?([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[0-9]+[\/⁄][0-9]+)?(?:[ \n\t]+)?$', 'ig');

    let match;
    while ((match = regex.exec(text)) !== null) {
        const decimal = match[1];
        let properFraction = match[2];
        if (decimal === undefined && properFraction === undefined) {
            continue;
        }
        let value = 0; //.replace(',','');
        if (decimal !== undefined) {
            if (/[⁄]/.test(decimal)) { //improvisation, but otherwise 1⁄2 with register 1 as in
                properFraction = decimal;
            } else {
                value += parseFloat(decimal.replace(',', ''));
            }
        }
        if (isNaN(value)) {
            value = 0;
        }

        if (properFraction !== undefined) {
            value += evaluateFraction(properFraction);
        }

        if (value === 0 || isNaN(value)) {
            continue;
        }
        return value;
    }
    return undefined;
}

/** Parse a non-metric unit, using lastquantity as the value
 *  @param {string} text - The string containing the unit
 *  @param {boolean} degWithoutFahrenheit - Whether to assume that ° means °F, not °C
 *  @param {boolean} isUK - Whether to use imperial units instead of US customary units
 *  @param {boolean} useMM - Whether millimeters should be preferred over centimeters
 *  @param {boolean} useGiga - Whether the giga SI prefix should be used when it makes sense
 *  @param {boolean} useKelvin - Whether the returned value will then be converted to Kelvin
 *  @param {boolean} useRounding - When true, accept up to 3 % error when rounding; when false, round to 2 decimal places
 *  @param {boolean} useComma - Whether to use a comma as decimal separator
 *  @param {boolean} useSpaces - Whether to use spaces as thousand separator
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - A new string where the unit has been converted to metric
*/
function parseUnitOnly(text, degWithoutFahrenheit, isUK, useMM, useGiga, useKelvin, useRounding, useComma, useSpaces, useBold, useBrackets) {
    if (lastquantity === undefined) {
        return text;
    }

    if (degWithoutFahrenheit) {
        fahrenheitConversion.regexUnit = new RegExp(skipempty + '((°|º|deg(rees)?)[ \u00A0]?(F(ahrenheits?)?)?|[\u2109])' + skipbrackets + regend, 'ig');
    } else {
        fahrenheitConversion.regexUnit = new RegExp(skipempty + '((°|º|deg(rees)?)[ \u00A0]?F(ahrenheits?)?|[\u2109])' + skipbrackets + regend, 'ig');
    }

    //console.log("now trying " + text);
    for (const conversion of conversions) {
        if (conversion.regexUnit === undefined) {
            continue;
        }
        let match;
        while ((match = conversion.regexUnit.exec(text)) !== null) {
            const ret = applyConversion(lastquantity, conversion, "", isUK, useMM, useGiga, useRounding);
            const met = formatNumber(ret.met, useComma, useSpaces);
            const metStr = formatConvertedValue(met, ret.unit, useBold, useBrackets);
            const fullMatch = match[0];
            const insertIndex = match.index + convertedValueInsertionOffset(fullMatch);
            text = insertAt(text, metStr, insertIndex);
        }

    }

    if (foundDegreeSymbol) {
        if (text.charAt(0) !== 'F') {
            return text;
        }

        if (text.length>=3 && /^F\u200B\u3010|^F[\(][0-9]/.test(text)) {
            return text; //it has been already converted
        }

        let met = fahrenheitToMetric(lastquantity, useKelvin, useRounding);
        let unit = '°C';
        if (useKelvin) {
            met += 273.15;
            unit = 'K';
            met = roundNicely(met, useRounding);
        }

        const formatted = formatNumber(met, useComma, useSpaces);
        const metStr = formatConvertedValue(formatted, unit, useBold, useBrackets);
        text = insertAt(text, metStr, 1);
    }
    return text;
}

/** Returns a translation table for String.translate()
 *
 * Similar to Python's maketrans() https://docs.python.org/3/library/stdtypes.html#str.maketrans
 *
 *  @param {string} fromCharset - Whether to convert tablespoons
 *  @param {string} toCharset - Whether to convert teaspoons
 *  @param {string?} removeCharset - Whether to convert teaspoons
 *  @return {string[string]} - The object to pass to String.translate
*/
function maketrans(fromCharset, toCharset, removeCharset) {
    if (fromCharset.length != toCharset.length) {
        throw Error('the first two maketrans arguments must have equal length');
    }
    const map = {};
    // NOTE: there is no enumerate() equivalent for strings in JavaScript
    for (let i = 0; i < fromCharset.length; i++) {
        const f = fromCharset[i];
        const t = toCharset[i];
        map[f] = t;
    }
    if (removeCharset !== undefined) {
        for (const r of removeCharset) {
            map[r] = '';
        }
    }
    return map;
}

/** Return a copy of the string in which each character has been mapped through the given translation table
 *
 *  @param {string[string]} table - Object created by maketrans()
 *  @return {string} toCharset - Whether to convert teaspoons
*/
String.prototype.translate = function(table) {
    // NOTE: String.split() creates an intermediate array, so we do this by hand
    const ret = [];
    for (const c of this) {
        const d = table[c];
        ret.push(d !== undefined ? d : c);
    }
    return ret.join('');
}

module.exports = { fahrenheitConversion, inchConversion, conversions, evaluateFraction, stepUpOrDown, insertAt, shouldConvert, fahrenheitToMetric, roundNicely, formatNumber, convertedValueInsertionOffset, bold, formatConvertedValue, parseNumber, replaceFahrenheit, replaceMaybeKeepLastChar, replaceVolume, replaceSurfaceInInches, replaceSurfaceInFeet, replaceFeetAndInches, applyConversion, setIncludeImproperSymbols, replaceFeetAndInchesSymbol, replacePoundsAndOunces, replaceMilesPerGallon, replaceIkeaSurface, replaceOtherUnits, replaceAll, processTextBlock, maketrans };
