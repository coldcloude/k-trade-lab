
export const OPT_CALL = 1|0;
export const OPT_PUT = -1|0;

export * from "./ktl-option/ktl-option-pricing.js";

import BlackScholesModel from "./ktl-option/ktl-option-pricing-black-scholes.js";
import Black76Model from "./ktl-option/ktl-option-pricing-black76.js";
export {
    BlackScholesModel,
    Black76Model
};
