export type Conversion = {
    regexUnit?: RegExp, // matching pattern for the unit only, when split over multiple text nodes (ParseUnitsOnly)
    regex?: RegExp, // matching pattern
    unit: string, // metric unit and SI prefix to use
    unit2?: string, // alternate metric unit and SI prefix to use when useMM is set
    multiplier: number, // conversion factor from matched unit to metric unit and SI prefix
    multiplier2?: number, // conversion factor from matched unit to *alternate* metric unit andSI prefix
    multipliercu?: number, // conversion factor to *litter* for volume (e.g. feet³)
    multiplierimp?: number, // conversion factor when isUK is set (using imperial unit instead of US customary units)
    forceround?: boolean, // whether to force rounding when the main unit is used
    forceround2?: boolean, // whether to force rounding when the alternate unit is used
};

export type ValueWithUnit = {
    met: number,
    unit: string,
};

export type TranslationTable = {
    pattern: RegExp,
    characterMap: {[key: string]: string},
};

declare global {
    interface String {
        translate(table : TranslationTable) : string;
    }
}

export type ValueWithSignificantDigits = {
    value: number,
    significantFigures: number,
};
