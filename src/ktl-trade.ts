import { KList, KMap } from "@coldcloude/kai2";
import { Day } from "./ktl";
import { Black76Model, BlackScholesModel, PricingModel } from "./ktl-option";

export const ASSET_STOCK = 1|0;
export const ASSET_FUTURE = 2|0;
export const ASSET_OPTION = 3|0;
export const ASSET_BOND = 4|0;
export const ASSET_CURRENCY = 5|0;

export class Security{
    readonly name:string;
    readonly type:number;
    constructor(name:string,type:number){
        this.name = name;
        this.type = type;
    }
}

export class SecurityFuture extends Security{
    readonly mature:Day;
    readonly underlying:Security;
    constructor(name:string,type:number,mature:Day,underlying:Security){
        super(name,type);
        this.mature = mature;
        this.underlying = underlying;
    }
}

export class SecurityOption extends SecurityFuture{
    readonly strike:number;
    readonly direction:number;
    constructor(name:string,type:number,mature:Day,underlying:Security,strike:number,direction:number){
        super(name,type,mature,underlying);
        this.strike = strike;
        this.direction = direction;
    }
}

export type Trade = {
    security: Security,
    amount: number,
    marginal: number,
    day:Day,
    rate: number,
    price: number,
    fee: number
};

export function trade(tr:Trade):Trade{
    return {
        security: tr.security,
        amount: tr.amount,
        marginal: tr.marginal,
        day: tr.day,
        rate: tr.rate,
        price: tr.price,
        fee: tr.fee
    };
}

const blackscholes = new BlackScholesModel();

const black76 = new Black76Model();

export class TradePosition{
    trade:Trade;
    day:Day = Number.NaN;
    rate:number = Number.NaN;
    price:number = Number.NaN;
    profit:number = 0;
    iv:number = Number.NaN;
    delta:number = 0;
    gamma:number = 0;
    theta:number = 0;
    vega:number = 0;
    rho:number = 0;
    constructor(trade:Trade,underlyingPrice?:number){
        this.trade = trade;
        this.update(trade.day,trade.rate,trade.price,underlyingPrice);
    }
    update(day:Day,rate:number,price:number,underlyingPrice?:number):void{
        this.day = day;
        this.rate = rate;
        this.price = price;
        this.profit = this.trade.amount*(price-this.trade.price);
        switch(this.trade.security.type){
            case ASSET_STOCK:
            case ASSET_FUTURE:
                this.delta = this.trade.amount;
                break;
            case ASSET_OPTION:
                if(underlyingPrice!==undefined){
                    const opt = this.trade.security as SecurityOption;
                    let model:PricingModel|undefined = undefined;
                    switch(opt.underlying.type){
                        case ASSET_STOCK:
                            model = blackscholes;
                            break;
                        case ASSET_FUTURE:
                            model = black76;
                            break;
                    }
                    if(model!==undefined){
                        this.iv = model.implVol(price,underlyingPrice,opt.strike,rate,day,opt.mature,opt.direction);
                        this.delta = this.trade.amount*model.delta(underlyingPrice,opt.strike,rate,this.iv,day,opt.mature,opt.direction);
                        this.gamma = this.trade.amount*model.gamma(underlyingPrice,opt.strike,rate,this.iv,day,opt.mature,opt.direction);
                        this.theta = this.trade.amount*model.theta(underlyingPrice,opt.strike,rate,this.iv,day,opt.mature,opt.direction);
                        this.vega = this.trade.amount*model.vega(underlyingPrice,opt.strike,rate,this.iv,day,opt.mature,opt.direction);
                        this.rho = this.trade.amount*model.rho(underlyingPrice,opt.strike,rate,this.iv,day,opt.mature,opt.direction);
                    }
                }
                break;
        }
    }
}

export type MarketSnapshot = {
    day: Day,
    rate: number,
    prices: KMap<string,number>
    profit:number,
    delta:number,
    gamma:number,
    theta:number,
    vega:number,
    rho:number,
};

export class TradeTransaction {
    //positions
    positions = new KList<TradePosition>();
    cost = 0;
    income = 0;
    snapshots:MarketSnapshot[] = [];
    clone(ss?:boolean){
        const r = new TradeTransaction();
        this.positions.foreach(tp=>{
            r.positions.push(tp);
        });
        r.cost = this.cost;
        r.income = this.income;
        if(ss){
            for(const ss of this.snapshots){
                r.snapshots.push(ss);
            }
        }
        return r;
    }
    trade(tr:Trade,underlyingPrice?:number){
        tr = trade(tr);
        //calc cost and income
        this.cost += tr.fee;
        if(!tr.marginal){
            //margin income at close, otherwise at open
            this.income -= tr.amount*tr.price;
        }
        //close positions, fifo
        this.positions.removeIf((tp:TradePosition)=>{
            const ptr = tp.trade;
            let r;
            if(tr.security.name===ptr.security.name&&(tr.amount>0&&ptr.amount<0||tr.amount<0&&ptr.amount>0)){
                //trade match position
                const ta = Math.abs(tr.amount);
                const pta = Math.abs(ptr.amount);
                const direction = Math.sign(ptr.amount);
                const amount = Math.min(ta,pta);
                if(tr.marginal){
                    //margin income at close, otherwise at open
                    this.income += direction*amount*(tr.price-ptr.price);
                }
                if(ta>=pta){
                    //close this position
                    ptr.amount = 0;
                    tr.amount += ptr.amount;
                    r = true;
                }
                else{
                    //close this trade only
                    ptr.amount += tr.amount;
                    tr.amount = 0;
                    r = false;
                }
            }
            else{
                //not match
                r = false;
            }
            return r;
        });
        //open new position
        if(tr.amount!==0){
            this.positions.push(new TradePosition(tr,underlyingPrice));
        }
    }
    snapshot(day:Day,rate:number,prices:KMap<string,number>):string|undefined{
        let error:string|undefined = undefined;
        let profit = 0;
        let delta = 0;
        let gamma = 0;
        let theta = 0;
        let vega = 0;
        let rho = 0;
        this.positions.foreach(tp=>{
            const sec = tp.trade.security;
            const price = prices.get(sec.name);
            if(price!==undefined){
                if(sec.type===ASSET_OPTION){
                    const usec = (sec as SecurityOption).underlying;
                    const uprice = prices.get(usec.name);
                    if(uprice!==undefined){
                        tp.update(day,rate,price,uprice);
                    }
                    else{
                        error = "need price of '"+usec.name+"'";
                    }
                }
                else{
                    tp.update(day,rate,price);
                }
            }
            else{
                error = "need price of '"+sec.name+"'";
            }
            if(error===undefined){
                profit += tp.profit;
                delta += tp.delta;
                gamma += tp.gamma;
                theta += tp.theta;
                vega += tp.vega;
                rho += tp.rho;
                return false;
            }
            else{
                return true;
            }
        });
        if(error===undefined){
            this.snapshots.push({
                day: day,
                rate: rate,
                prices: prices,
                profit: profit,
                delta: delta,
                gamma: gamma,
                theta: theta,
                vega: vega,
                rho: rho
            });
        }
        return error;
    }
}

export class TradeView{
    trades:Trade[] = [];
    transactions:TradeTransaction[] = [];
    trade(tr:Trade):number{
        const index = this.trades.length;
        this.trades.push(tr);
        const tt = this.transactions[this.transactions.length-1].clone();
        tt.trade(tr);
        this.transactions.push(tt);
        return index;
    }
    snapshot(index:number,day:Day,rate:number,prices:KMap<string,number>):string|undefined{
        if(index<0||index>=this.transactions.length){
            return "not a valid index = "+index+", current length = "+this.transactions.length;
        }
        else{
            return this.transactions[index].snapshot(day,rate,prices);
        }
    }
}
