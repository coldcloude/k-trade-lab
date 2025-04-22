import { NormalDistribution, Numeric } from "@coldcloude/kai2";
import { PricingModel } from "./ktl-option-pricing.js";
import Decimal from "decimal.js";

const dist = new NormalDistribution();

export default class Black76Model extends PricingModel{
    pricing(s: number, k: number, r: number, sigma: number, ytm: number, d: number): number {
        if(s <= 0 || sigma <= 0){
            return Number.NaN;
        }
        const ds = new Decimal(s);
        const dk = new Decimal(k);
        const dr = new Decimal(r);
        const dv = new Decimal(sigma);
        const dy = new Decimal(ytm);
        const dd = new Decimal(d);
        const dvy = dv.mul(dy.sqrt());
        const d1 = ds.div(dk).ln().add(Numeric.HALF.mul(dv).mul(dv).mul(ytm)).div(dvy);
        const d2 = d1.sub(dvy);
        return dist.cumulativeProbability(d1.mul(dd)).mul(ds).sub(dist.cumulativeProbability(d2.mul(dd)).mul(dk)).mul(dr.neg().mul(dy).exp()).mul(dd).toNumber();
    }
}
