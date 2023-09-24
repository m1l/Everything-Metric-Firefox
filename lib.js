const regstart = '([\(]?';
const regend = '([^a-z]|$)';
const intOrFloat = '([0-9,\.]+)';
const intOrFloatSigned = '([\-−0-9,\.]+)';
const spc = '\u00A0';
const intOrFloatNoFrac = '([\.,0-9]+(?![\/⁄]))?';
const skipbrackets = '(?! [\(][0-9]|\u200B\u3010)';
const unitSuffix = '(?! [\(][0-9]| ?\u200B\u3010)([^a-z]|$)';
//const unitSuffixIn = '(?! ?[\(\-−\u00A0]?[0-9]| ?\u200B\u3010)([^a-z²³]|$)';
const unitSuffixIn = '(?! ?[\(\-−\u00A0]?[0-9]| ?\u200B\u3010)([^a-z²³\u3010\u200B\)]|$)';
const unitSuffixft = '(?! ?[\(\-−\u00A0]?[0-9]| ?\u200B\u3010)([^a-z²³\u3010\u200B\)]|$)';
const unitfrac = '[\-− \u00A0]?([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[0-9]+[\/⁄][0-9]+)?';
const sqcu = '([\-− \u00A0]?(sq\.?|square|cu\.?|cubic))?';
const sq = '([\-− \u00A0]?(sq\.?|square))?';
const skipempty = '^(?:[ \n\t]+)?';

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
        if (/[a-zA-Z,\?\!]/.test(frac)) {
            return 0;
        }
        let cleanedFrac = frac.replace(/[^\d\/⁄]/, '');
        cleanedFrac = frac.replace(/[⁄]/, '\/');
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
 *  @return {import("./types").ValueWithUnit} - The scaled unit with the appropriate unit
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
        return !/[\(]/.test(text.substring(1));
    } else {
        // if the text has parentheses, it is either within parentheses, or probably already converted
        return !/[\(\)]/.test(text);
    }
}

/** Convert a temperature from Fahrenheit to Celsius
 *  @param {number} f - A value in Fahrenheit
 *  @param {boolean} useKelvin - Whether the returned value will then be converted to Kelvin
 *  @return {number} - The value in Celsius
*/
function fahrenheitToCelsius(f, useKelvin) {
    let met = (5 / 9) * (f - 32);
    if (useKelvin)
       return met;
    else
       return Math.round(met);
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
 *  @param {string} rest - The unit of the value
 *  @param {boolean} useBold - Whether the text should use bold Unicode code-points
 *  @param {boolean} useBrackets - Whether to use lenticular brackets instead of parentheses
 *  @return {string} - The formatted value along with its unit
*/
function formatConvertedValue(number, rest, useBold, useBrackets) {
    let fullstring = number + rest;
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
            '[\(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
            '([\-−]?[0-9,\.]+)', // digits, optionally prefixed with a minus sign
            // optionally, an additional number after a range marker
            '(?:',
                '(?: to | and |[\-−]+)', // range marker
                '([\-−]?[0-9,\.]+)', // digits, optionally prefixed with a minus sign
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
                    '[\(]',  // opening parenthesis
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
        let met1 = fahrenheitToCelsius(parseNumber(firstNumber), useKelvin);
        if (useKelvin) {
            met1 += 273.15;
            met1 = roundNicely(met1, useRounding);
        }
        const formattedMet1 = formatNumber(met1, useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);

        let met = formattedMet1;

        // lower-bound of the range
        if (secondNumber) {
            let met2 = fahrenheitToCelsius(parseNumber(secondNumber), useKelvin);
            if (useKelvin) {
                met2 += 273.15;
                met2 = roundNicely(met2, useRounding);
            }
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
            '[\(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
            '([0-9]+(?:\.[0-9]+)?)', // number
            '[ \u00A0]?', // space or no-break space
            '[x\*×]', // multiplication sign
            '[ \u00A0]?', // space or no-break space
            '([0-9]+(?:\.[0-9]+)?)', // number
            '[ \u00A0]?', // space or no-break space
            '[x\*×]', // multiplication sign
            '[ \u00A0]?', // space or no-break space
            '([0-9]+(?:\.[0-9]+)?)', // number
            '[ \u00A0]?', // space or no-break space
            'in(ch|ches|.)?', // unit
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
        let unit = spc + "cm";
        if (useMM === true) {
            scale = 25.4;
            unit = spc + "mm"
        }
        const cm1 = formatNumber(roundNicely(parseNumber(dim1) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const cm2 = formatNumber(roundNicely(parseNumber(dim2) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const cm3 = formatNumber(roundNicely(parseNumber(dim3) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(`${cm1} × ${cm2} × ${cm3}`, ` ${unit}`, useBold, useBrackets);
        text = replaceMaybeKeepLastChar(text, match[0], metStr);
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
            '[\(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
            '([0-9]+(?:\.[0-9]+)?)', // number
            '[-− \u00A0]?', // space or no-break space
            '[x\*×]',  // multiplication sign
            '[-− \u00A0]?', // space or no-break space
            '([0-9]+(?:\.[0-9]+)?)', // number
            '[-− \u00A0]?', // space or no-break space
            'in(ch|ches|\.)?',  // unit
            // check for already present conversion to metric
            unitSuffix,
        ].join(''),
        'ig',
    );

    let match;
    while ((match = regex.exec(text)) !== null) {
        if (/[0-9][Xx\*×][ \u00A0][0-9]/.test(match[0])) {
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
        let unit = spc + "cm";
        if (useMM === true) {
            scale = 25.4;
            unit = spc + "mm"
        }
        const cm1 = formatNumber(roundNicely(parseNumber(dim1) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const cm2 = formatNumber(roundNicely(parseNumber(dim2) * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(`${cm1} × ${cm2}`, ` ${unit}`, useBold, useBrackets);
        text = replaceMaybeKeepLastChar(text, match[0], metStr);
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
            '[\(]?', // include previous parenthesis to be able to check whether we are in a parenthesis (see shouldConvert())
            '(',
                '([0-9]+(\.[0-9]+)?)', // number
                '[\'′’]?',  // allow feet symbol on first number
                '[-− \u00A0]?', // space or no-break space
                '[x\*×]', // multiplication sign
                '[-− \u00A0]?', // space or no-break space
                '([0-9]+(\.[0-9]+)?)', // number
                '[-− \u00A0]?', // space or no-break space
                '(feet|foot|ft|[\'′’])', // unit
            ')
            '(?![0-9])', // maybe to avoid matching feet2 for feet²?
            // check for already present conversion to metric
            unitSuffix
        ].join(''),
        'ig',
    );

    let match;
    while ((match = regex.exec(text)) !== null) {
        if (/[0-9][xX\*×][ \u00A0][0-9]/.test(match[0])) {
            continue; //it is 2x 2ft something so no conversion
        }
        if (!shouldConvert(match[0], convertBracketed)) {
            continue;
        }

        let scale = 0.3048;
        let unit = spc + "m";
        // TODO: use useMM

        const m1 = formatNumber(roundNicely(match[2] * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const m2 = formatNumber(roundNicely(match[4] * scale, useRounding), useCommaAsDecimalSeparator, useSpacesAsThousandSeparator);
        const metStr = formatConvertedValue(`${m1} × ${m2}`, ` ${unit}`, useBold, useBrackets);
        text = replaceMaybeKeepLastChar(text, match[0], metStr);
    }
    return text;
}

module.exports = { evaluateFraction, stepUpOrDown, insertAt, shouldConvert, fahrenheitToCelsius, roundNicely, formatNumber, convertedValueInsertionOffset, bold, formatConvertedValue, parseNumber, replaceFahrenheit, replaceMaybeKeepLastChar, replaceVolume, replaceSurfaceInInches, replaceSurfaceInFeet };
