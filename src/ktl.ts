import { DateFormat, MS_OF_DAY } from "@coldcloude/kai2";

export const DAY_OF_YEAR = 365;

export type Day = Date|number;

const dutil = new DateFormat("yyyy-MM-dd HH:mm:ss.SSS");

const ANCHOR = dutil.parse("2000-01-01 00:00:00.000").getTime();

export function dayoff(day:Day,anchor?:Day){
    if(day instanceof Date){
        const an = anchor===undefined?ANCHOR:(anchor as Date).getTime();
        return (day.getTime()-an)/MS_OF_DAY;
    }
    else{
        const d = day as number;
        return isNaN(d)||anchor===undefined?d:d-(anchor as number);
    }
}

export function dtm(day:Day,mday:Day):number{
    const d = dayoff(day);
    const md = dayoff(mday);
    return isNaN(d)||isNaN(md)?Number.NaN:(dayoff(mday)-dayoff(day))|0;
}

export function ytm(day:Day,mday:Day):number{
    const dd = dtm(day,mday);
    return isNaN(dd)?Number.NaN:dd/DAY_OF_YEAR;
}

export const daycmp = (a:Day,b:Day)=>{
	return dtm(a,b);
};

export const dayhash = (d:Day)=>{
	return dayoff(d)&0x7FFFFFFF;
};

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
