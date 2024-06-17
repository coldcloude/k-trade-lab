import { MS_OF_DAY } from "@coldcloude/kai2";

export const DAY_OF_YEAR = 365;

export function dtm(day:Date|number,mday:Date|number):number{
    const dt = day instanceof Date?day.getTime()/MS_OF_DAY:day as number;
    const mdt = mday instanceof Date?mday.getTime()/MS_OF_DAY:mday as number;
    return Math.round(mdt-dt)|0;
}

export function ytm(day:Date|number,mday:Date|number):number{
    return dtm(day,mday)/DAY_OF_YEAR;
}

export type Price = {
    ask:number,
    bid:number,
    deal:number,
    spread: number,
    liquidity: boolean
};

export function price(last:number,bid:number,ask:number,args?:{
    limit?:number,
    rate?:number
}):Price{
    const r:Price = {
        ask: ask,
        bid: bid,
        deal: Number.NaN,
        spread: Number.NaN,
        liquidity: false
    };
    if(!isNaN(bid)&&!isNaN(ask)){
        r.spread = ask-bid;
        if(!isNaN(last)&&last>=bid&&last<=ask){
            r.deal = last;
            r.liquidity = true;
        }
        else{
            r.deal = (bid+ask)*0.5;
            if(args!==undefined&&(args.limit!==undefined&&r.spread<=args.limit||args.rate!==undefined&&r.spread<=r.deal*args.rate)){
                r.liquidity = true;
            }
        }
    }
    return r;
}

function numberOrUndefined<T>(v:T):number{
    return typeof v === typeof 1 ? v as number : Number.NaN;
}

export function highOf<T>(vs:T[],op?:(v:T)=>number):T|undefined{
    const fop:(v:T)=>number = op||numberOrUndefined;
    let cv:number = Number.NaN;
    let r:T|undefined = undefined;
    for(const v of vs){
        const vv = fop(v);
        if(!isNaN(vv)&&(isNaN(cv)||vv>cv)){
            cv = vv;
            r = v;
        }
    }
    return r;
}

export function lowOf<T>(vs:T[],op?:(v:T)=>number):T|undefined{
    const fop:(v:T)=>number = op||numberOrUndefined;
    let cv:number = Number.NaN;
    let r:T|undefined = undefined;
    for(const v of vs){
        const vv = fop(v);
        if(!isNaN(vv)&&(isNaN(cv)||vv<cv)){
            cv = vv;
            r = v;
        }
    }
    return r;
}

export function anyValid<T>(vs:T[],op?:(v:T)=>number):boolean{
    const fop:(v:T)=>number = op||numberOrUndefined;
    let r = false;
    for(const v of vs){
        if(!isNaN(fop(v))){
            r = true;
            break;
        }
    }
    return r;
}

export function allValid<T>(vs:T[],op?:(v:T)=>number):boolean{
    const fop:(v:T)=>number = op||numberOrUndefined;
    let r = true;
    for(const v of vs){
        if(isNaN(fop(v))){
            r = false;
            break;
        }
    }
    return r;
}
