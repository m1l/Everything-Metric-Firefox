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

module.exports = { evaluateFraction, stepUpOrDown, insertAt, shouldConvert, fahrenheitToCelsius, roundNicely, formatNumber };
