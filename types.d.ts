export type Conversion = {
    regexUnit?: RegExp,
    regex?: RegExp,
    unit: string,
    unit2?: string,
    multiplier: number,
    multiplier2?: number,
    multipliercu?: number,
    multiplierimp?: number,
    fullround?: boolean,
    forceround?: boolean,
};

export type ValueWithUnit = {
    met: number,
    unit: string,
};
