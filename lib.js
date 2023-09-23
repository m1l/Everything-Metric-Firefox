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
