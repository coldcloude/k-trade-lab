import { DAY_OF_YEAR, Day, ytm } from "../ktl.js";

const EPSILON = 1e-9;

const MAX_IV = 100.0;

const MIN_PRICE_TICK = 1e-4;

/**
 * 定价函数
 * 
 * @param s 标的价格
 * @param k 执行价格
 * @param r 年利率
 * @param sigma 波动率
 * @param ytm 到期时间（年）
 * @param d 1=call；2=put
 */
export type PricingFunction = (s:number, k:number, r:number, sigma:number, ytm:number, d:number)=>number;

/**
 * 希腊字母Delta：标的价格增加1
 * 
 * @param pricing 定价函数
 * @param f 标的价格
 * @param k 执行价格
 * @param r 年利率
 * @param sigma 波动率
 * @param ytm 到期时间（年）
 * @param d 1=call；2=put
 */
function delta(pricing:PricingFunction, f:number, k:number, r:number, sigma:number, ytm:number, d:number){
    if(f <= 0 || sigma <= 0){
        return Number.NaN;
    }
    return (pricing(f + 0.005, k, r, sigma, ytm, d) - pricing(f - 0.005, k, r, sigma, ytm, d)) * 100;
}

/**
 * 希腊字母Gamma：Delta增加1
 * 
 * @param pricing 定价函数
 * @param f 标的价格
 * @param k 执行价格
 * @param r 年利率
 * @param sigma 波动率
 * @param ytm 到期时间（年）
 * @param d 1=call；2=put
 */
function gamma(pricing:PricingFunction, f:number, k:number, r:number, sigma:number, ytm:number, d:number){
    if(f <= 0 || sigma <= 0){
        return Number.NaN;
    }
    return (delta(pricing, f + 0.005, k, r, sigma, ytm, d) - delta(pricing, f - 0.005, k, r, sigma, ytm, d)) * 100;
}

/**
 * 希腊字母Theta：时间经过一天
 * 
 * @param pricing 定价函数
 * @param f 标的价格
 * @param k 执行价格
 * @param r 年利率
 * @param sigma 波动率
 * @param ytm 到期时间（年）
 * @param d 1=call；2=put
 */
function theta(pricing:PricingFunction, f:number, k:number, r:number, sigma:number, ytm:number, d:number){
    if(f <= 0 || sigma <= 0){
        return Number.NaN;
    }
    const ddoy = -0.005 / DAY_OF_YEAR;
    return (pricing(f, k, r, sigma, ytm + ddoy, d) - pricing(f, k, r, sigma, ytm - ddoy, d)) * 100;
}
/**
 * 希腊字母Vega：波动率增加1%
 * 
 * @param pricing 定价函数
 * @param f 标的价格
 * @param k 执行价格
 * @param r 年利率
 * @param sigma 波动率
 * @param ytm 到期时间（年）
 * @param d 1=call；2=put
 */
function vega(pricing:PricingFunction, f:number, k:number, r:number, sigma:number, ytm:number, d:number){
    if(f <= 0 || sigma <= 0){
        return Number.NaN;
    }
    return (pricing(f, k, r, sigma + 0.00005, ytm, d) - pricing(f, k, r, sigma - 0.00005, ytm, d)) * 100;
}

/**
 * 希腊字母Rho：利率增加一个基点（0.01%）
 * 
 * @param pricing 定价函数
 * @param f 标的价格
 * @param k 执行价格
 * @param r 年利率
 * @param sigma 波动率
 * @param ytm 到期时间（年）
 * @param d 1=call；2=put
 */
function rho(pricing:PricingFunction, f:number, k:number, r:number, sigma:number, ytm:number, d:number){
    if(f <= 0 || sigma <= 0){
        return Number.NaN;
    }
    return (pricing(f, k, r + 0.0000005, sigma, ytm, d) - pricing(f, k, r - 0.0000005, sigma, ytm, d)) * 100;
}

/**
 * 拟合隐含波动率
 * 
 * @param pricing 定价函数
 * @param p 期权价格
 * @param s 标的价格
 * @param k 执行价格
 * @param r 年利率
 * @param ytm 到期时间（年）
 * @param d 1=call；2=put
 */
function implVol(pricing:PricingFunction, p:number, s:number, k:number, r:number, ytm:number, d:number, args?:{
    minPriceTick?: number,
    maxImplVol?: number
}){
    if(p <= 0 || s <= 0 || p < (s - k) * d){
        return Number.NaN;
    }
    const minPriceTick = args!==undefined&&args.minPriceTick!==undefined?args.minPriceTick:MIN_PRICE_TICK;
    const maxImplVol = args!==undefined&&args.maxImplVol!==undefined?args.maxImplVol:MAX_IV;

    let maxiv = 1.0;
    let miniv = 0.0;
    while(maxiv < maxImplVol){
        const piv = pricing(s, k, r, maxiv, ytm, d);
        const dp = piv - p;
        if(Math.max(dp) < minPriceTick){
            return maxiv;
        }
        if(dp > 0){
            break;
        }
        miniv = maxiv;
        maxiv *= 2;
    }
    if(maxiv < maxImplVol){
        while(maxiv - miniv > EPSILON){
            const iv = (maxiv + miniv) * 0.5;
            const piv = pricing(s, k, r, iv, ytm, d);
            const dp = piv - p;
            if(Math.abs(dp) < minPriceTick){
                return iv;
            }
            if(dp > 0){
                maxiv = iv;
            }
            else{
                miniv = iv;
            }
        }
        return maxiv;
    }
    else{
        return maxImplVol;
    }
}

/**
 * 根据期权Delta变化计算对应标的价格
 * 
 * @param target Delta变化
 * @param k 期权执行价格
 * @param r 年利率
 * @param sigmac call期权波动率
 * @param sigmap put期权波动率
 * @param ytm 到期时间（年）
 * @param nc call期权数量
 * @param np put期权数量
 * @param mm 
 */
function priceByDelta(pricing:PricingFunction, target:number, k:number, r:number, sigmac:number, sigmap:number, ytm:number, nc:number, np:number, args?:{
    minPriceTick?: number
}){
    if(target <= -np || target >= nc || sigmac <= 0 || sigmap <=0){
        return Number.NaN;
    }
    const minPriceTick = args!==undefined&&args.minPriceTick!==undefined?args.minPriceTick:MIN_PRICE_TICK;
    
    let f = k;
    let minf = 0;
    let maxf = f * 2;
    while(maxf - minf > minPriceTick){
        const current = nc * delta(pricing, f, k, r, sigmac, ytm, 1) + np * delta(pricing, f, k, r, sigmap, ytm, -1);
        if(current - target > 0){
            maxf = f;
        }
        else{
            minf = f;
        }
        f = (maxf + minf) * 0.5;
    }
    return Math.round(f / minPriceTick) * minPriceTick;
}

export abstract class PricingModel{
    abstract pricing(s:number, k:number, r:number, sigma:number, ytm:number, d:number):number;
    price(s:number, k:number, r:number, sigma:number, day:Day, mday:Day, d:number){
        return this.pricing(s,k,r,sigma,ytm(day,mday),d);
    }
    delta(f:number, k:number, r:number, sigma:number, day:Day, mday:Day, d:number){
        return delta(this.pricing,f,k,r,sigma,ytm(day,mday),d);
    }
    gamma(f:number, k:number, r:number, sigma:number, day:Day, mday:Day, d:number){
        return gamma(this.pricing,f,k,r,sigma,ytm(day,mday),d);
    }
    theta(f:number, k:number, r:number, sigma:number, day:Day, mday:Day, d:number){
        return theta(this.pricing,f,k,r,sigma,ytm(day,mday),d);
    }
    vega(f:number, k:number, r:number, sigma:number, day:Day, mday:Day, d:number){
        return vega(this.pricing,f,k,r,sigma,ytm(day,mday),d);
    }
    rho(f:number, k:number, r:number, sigma:number, day:Day, mday:Day, d:number){
        return rho(this.pricing,f,k,r,sigma,ytm(day,mday),d);
    }
    implVol(p:number, s:number, k:number, r:number, day:Day, mday:Day, d:number, args?:{
        minPriceTick?: number,
        maxImplVol?: number
    }){
        return implVol(this.pricing,p,s,k,r,ytm(day,mday),d,args);
    }
    priceByDelta(target:number, k:number, r:number, sigmac:number, sigmap:number, day:Day, mday:Day, nc:number, np:number, args?:{
        minPriceTick?: number
    }){
        return priceByDelta(this.pricing,target,k,r,sigmac,sigmap,ytm(day,mday),nc,np,args);
    }
}
