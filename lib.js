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
    if (fractions[frac] === undefined) {
        try {
            if (/[a-zA-Z,\?\!]/.test(frac))
                return 0;
            let cleanedFrac = frac.replace(/[^\d\/⁄]/, '');
            cleanedFrac = frac.replace(/[⁄]/, '\/');
            if (cleanedFrac.length < 3)
                return 0;
            return eval(cleanedFrac);
        } catch (err) {
            return 0;
        }
    }
    return fractions[frac];
}

module.exports = { evaluateFraction };
