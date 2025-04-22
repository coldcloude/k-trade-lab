import { DateFormat, MS_OF_DAY } from "@coldcloude/kai2";

export const DAY_OF_YEAR = 365;

export type Day = Date|number;

const dutil = new DateFormat("yyyy-MM-dd HH:mm:ss.SSS");

const ANCHOR = dutil.parse("2000-01-01 00:00:00.000").getTime();

export function dayn(day:Day):number{
    if(day instanceof Date){
        return (day.getTime()-ANCHOR)/MS_OF_DAY;
    }
    else{
        return day as number;
    }
}

export function dayd(day:Day):Date{
    if(day instanceof Date){
        return day as Date;
    }
    else {
        const time = Math.round((day as number)*MS_OF_DAY+ANCHOR)|0;
        return new Date(time);
    }
}

export function dtm(day:Day,mday:Day):number{
    const d = dayn(day);
    const md = dayn(mday);
    return isNaN(d)||isNaN(md)?Number.NaN:md-d;
}

export function ytm(day:Day,mday:Day):number{
    const dd = dtm(day,mday);
    return isNaN(dd)?Number.NaN:dd/DAY_OF_YEAR;
}

export const daycmp = (a:Day,b:Day)=>{
	return dtm(a,b);
};

export const dayhash = (d:Day)=>{
	return dayn(d)&0x7FFFFFFF;
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

function numberOrNot<T>(v:T):number{
    return typeof v === "number" ? v as number : Number.NaN;
}

export function highOf<T>(vs:T[],op?:(v:T)=>number):T|undefined{
    const fop:(v:T)=>number = op||numberOrNot;
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
    const fop:(v:T)=>number = op||numberOrNot;
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
    const fop:(v:T)=>number = op||numberOrNot;
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
    const fop:(v:T)=>number = op||numberOrNot;
    let r = true;
    for(const v of vs){
        if(isNaN(fop(v))){
            r = false;
            break;
        }
    }
    return r;
}
