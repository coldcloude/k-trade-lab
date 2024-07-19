import { fromArray, fromObject, KHashTable, KList, KMap, KObject, KSerializable, KValue, numcmp, numhash, rawFromArray, rawToArray, toObjArray, toValObject } from "@coldcloude/kai2";
import { Day, dayn } from "./ktl.js";
import { Black76Model, BlackScholesModel, PricingModel } from "./ktl-option.js";
import { marginOption } from "./ktl-margin.js";
import { Asset, AssetOption, ASSET_GENERAL, ASSET_FUTURE, ASSET_OPTION, findAsset } from "./ktl-asset.js";

export class Trade implements KSerializable{
    readonly id:number;
    readonly asset:Asset;
    readonly marginal:number;
    readonly amount:number;
    readonly day:Day;
    readonly rate:number;
    readonly price:number;
    readonly fee:number;
    constructor(tr:KObject){
        this.id = tr.id as number;
        this.asset = findAsset(tr.asset as string);
        this.marginal = tr.marginal as number;
        this.amount = tr.amount as number;
        this.day = tr.day as number;
        this.rate = tr.rate as number;
        this.price = tr.price as number;
        this.fee = tr.fee as number;
    }
    toObj():KObject{
        return {
            id: this.id,
            asset: this.asset.name,
            marginal: this.marginal,
            amount: this.amount,
            day: dayn(this.day),
            rate: this.rate,
            price: this.price,
            fee: this.fee
        };
    }
}

export class MarketSnapshot implements KSerializable{
    readonly id:number;
    readonly day:Day;
    readonly rate:number;
    readonly prices:KMap<string,number>;
    readonly margins:KMap<string,number>;
    constructor(ss:KObject){
        this.id = ss.id as number;
        this.day = ss.day as number;
        this.rate = ss.rate as number;
        this.prices = fromObject(ss.prices as KObject,v=>v as number);
        this.margins = fromObject(ss.margins as KObject,v=>v as number);
    }
    toObj():KObject{
        return {
            id: this.id,
            day: dayn(this.day),
            rate: this.rate,
            prices: toValObject(this.prices),
            margins: toValObject(this.margins)
        };
    }
}

const blackscholes = new BlackScholesModel();

const black76 = new Black76Model();

export class TradePosition implements KSerializable{
    tx:TradeTransaction;
    trade:Trade;
    amount:number;
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
    constructor(tx:TradeTransaction,tradeX:Trade|KObject,amount?:number,underlyingPrice?:number){
        this.tx = tx;
        if(tradeX instanceof Trade){
            this.trade = tradeX as Trade;
            this.amount = amount!;
            this.update(this.trade.day,this.trade.rate,this.trade.price,underlyingPrice);
        }
        else{
            const pos = tradeX as KObject;
            const trid = tradeX.trade as number;
            const ftr = tx.trades.get(trid);
            if(ftr===undefined){
                throw new Error("no trade '"+trid+"' found");
            }
            else{
                this.trade = ftr;
                this.amount = pos.amount as number;
                this.day = pos.day as number;
                this.rate = pos.rate as number;
                this.price = pos.price as number;
                this.profit = pos.profit as number;
                this.iv = pos.iv as number;
                this.delta = pos.delta as number;
                this.gamma = pos.gamma as number;
                this.theta = pos.theta as number;
                this.vega = pos.vega as number;
                this.rho = pos.rho as number;
            }
        }
    }
    toObj():KObject{
        return {
            trade: this.trade.id,
            amount: this.amount,
            day: dayn(this.day),
            rate: this.rate,
            price: this.price,
            profit: this.profit,
            iv: this.iv,
            delta: this.delta,
            gamma: this.gamma,
            theta: this.theta,
            vega: this.vega,
            rho: this.rho
        };
    }
    update(day:Day,rate:number,price:number,underlyingPrice?:number):void{
        this.day = day;
        this.rate = rate;
        this.price = price;
        this.profit = this.amount*(price-this.trade.price);
        switch(this.trade.asset.type){
            case ASSET_GENERAL:
            case ASSET_FUTURE:
                this.delta = this.amount;
                break;
            case ASSET_OPTION:
                if(underlyingPrice!==undefined){
                    const opt = this.trade.asset as AssetOption;
                    let model:PricingModel|undefined = undefined;
                    switch(opt.underlying.type){
                        case ASSET_GENERAL:
                            model = blackscholes;
                            break;
                        case ASSET_FUTURE:
                            model = black76;
                            break;
                    }
                    if(model!==undefined){
                        this.iv = model.implVol(price,underlyingPrice,opt.exercise,rate,day,opt.mature,opt.direction);
                        this.delta = this.amount*model.delta(underlyingPrice,opt.exercise,rate,this.iv,day,opt.mature,opt.direction);
                        this.gamma = this.amount*model.gamma(underlyingPrice,opt.exercise,rate,this.iv,day,opt.mature,opt.direction);
                        this.theta = this.amount*model.theta(underlyingPrice,opt.exercise,rate,this.iv,day,opt.mature,opt.direction);
                        this.vega = this.amount*model.vega(underlyingPrice,opt.exercise,rate,this.iv,day,opt.mature,opt.direction);
                        this.rho = this.amount*model.rho(underlyingPrice,opt.exercise,rate,this.iv,day,opt.mature,opt.direction);
                    }
                }
                break;
        }
    }
}

export class PortfolioSnapshot implements KSerializable{
    tx:TradeTransaction;
    snapshot:MarketSnapshot;
    profit:number = 0;
    margin:number = 0;
    delta:number = 0;
    gamma:number = 0;
    theta:number = 0;
    vega:number = 0;
    rho:number = 0;
    constructor(tx:TradeTransaction,snapshotX:MarketSnapshot|KObject){
        this.tx = tx;
        if(snapshotX instanceof MarketSnapshot){
            this.snapshot = snapshotX as MarketSnapshot;
        }
        else{
            const ss = snapshotX as KObject;
            const ssid = ss.snapshot as number;
            const fss = tx.snapshots.get(ssid);
            if(fss===undefined){
                throw new Error("no snapshot '"+ssid+"' found");
            }
            else{
                this.snapshot = fss;
                this.profit = ss.profit as number;
                this.margin = ss.margin as number;
                this.delta = ss.delta as number;
                this.gamma = ss.gamma as number;
                this.theta = ss.theta as number;
                this.vega = ss.vega as number;
                this.rho = ss.rho as number;
            }
        }
    }
    toObj():KObject{
        return {
            snapshot: this.snapshot.id,
            profit: this.profit,
            margin: this.margin,
            delta: this.delta,
            gamma: this.gamma,
            theta: this.theta,
            vega: this.vega,
            rho: this.rho
        };
    }
}

export class TradePortfolio implements KSerializable{
    tx:TradeTransaction;
    day:Day;
    positions:KList<TradePosition>;
    snapshots:PortfolioSnapshot[];
    cost = 0;
    income = 0;
    constructor(tx:TradeTransaction,dayX:Day|KObject){
        this.tx = tx;
        if(typeof dayX === "number" || dayX instanceof Date){
            this.day = dayX as Day;
            this.positions = new KList<TradePosition>();
            this.snapshots = [];
        }
        else{
            const pf = dayX as KObject;
            this.day = pf.day as number;
            this.positions = fromArray(pf.positions as KValue[],v=>new TradePosition(tx,v as KObject));
            this.snapshots = rawFromArray(pf.snapshots as KValue[],v=>new PortfolioSnapshot(tx,v as KObject));
            this.cost = pf.cost as number;
            this.income = pf.income as number;
        }
    }
    toObj():KObject{
        return {
            day: dayn(this.day),
            positions: toObjArray(this.positions),
            snapshots: rawToArray(this.snapshots),
            cost: this.cost,
            income: this.income
        };
    }
    trade(tr:Trade,underlyingPrice?:number){
        //calc cost and income
        this.cost += tr.fee;
        if(!tr.marginal){
            //margin income at close, otherwise at open
            this.income -= tr.amount*tr.price;
        }
        //close positions, fifo
        let amount = tr.amount;
        this.positions.removeIf((p:TradePosition)=>{
            let r;
            if((amount>0&&p.amount<0||amount<0&&p.amount>0)&&tr.asset.name===p.trade.asset.name){
                //trade match position
                const ta = Math.abs(amount);
                const pa = Math.abs(p.amount);
                const direction = Math.sign(p.amount);
                const a = Math.min(ta,pa);
                if(tr.marginal){
                    //margin income at close, otherwise at open
                    this.income += direction*a*(tr.price-p.trade.price);
                }
                if(ta>=pa){
                    //close this position
                    amount += p.amount;
                    p.amount = 0;
                    r = true;
                }
                else{
                    //close this trade only
                    p.amount += amount;
                    amount = 0;
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
        if(amount!==0){
            this.positions.push(new TradePosition(this.tx,tr,amount,underlyingPrice));
        }
    }
    snapshot(ss:MarketSnapshot):string|undefined{
        let error:string|undefined = undefined;
        const pfss = new PortfolioSnapshot(this.tx,ss);
        //calculate profit and greeks
        this.positions.foreach(p=>{
            const asset = p.trade.asset;
            const price = ss.prices.get(asset.name);
            if(price!==undefined){
                if(asset.type===ASSET_OPTION){
                    const uasset = (asset as AssetOption).underlying;
                    const uprice = ss.prices.get(uasset.name);
                    if(uprice!==undefined){
                        p.update(ss.day,ss.rate,price,uprice);
                    }
                    else{
                        error = "need price of '"+uasset.name+"'";
                    }
                }
                else{
                    p.update(ss.day,ss.rate,price);
                }
            }
            else{
                error = "need price of '"+asset.name+"'";
            }
            if(error===undefined){
                pfss.profit += p.profit;
                pfss.delta += p.delta;
                pfss.gamma += p.gamma;
                pfss.theta += p.theta;
                pfss.vega += p.vega;
                pfss.rho += p.rho;
                return false;
            }
            else{
                return true;
            }
        });
        //calculate margin
        this.positions.foreach(p=>{
            if(p.trade.marginal){
                const aa = Math.abs(p.amount);
                const asset = p.trade.asset;
                const price = ss.prices.get(asset.name);
                if(price!==undefined){
                    if(asset.type===ASSET_OPTION&&p.amount<0){
                        const opt = asset as AssetOption;
                        const uasset = opt.underlying;
                        const uprice = ss.prices.get(uasset.name);
                        const umr = ss.prices.get(uasset.name);
                        if(uprice!==undefined&&umr!==undefined){
                            pfss.margin += aa*marginOption(price,uprice,opt.exercise,umr,opt.direction);
                        }
                        // else{
                        //     error = "need price of '"+uasset.name+"', and margin of '"+uasset.name+"'";
                        // }
                    }
                    else{
                        const mr = ss.margins.get(asset.name);
                        if(mr!==undefined){
                            pfss.margin += aa*price*mr;
                        }
                        // else{
                        //     error = "need margin of '"+asset.name+"'";
                        // }
                    }
                }
                else{
                    error = "need price of '"+asset.name+"'";
                }
            }
            if(error!==undefined){
                return true;
            }
        });
        //result or error
        if(error===undefined){
            this.snapshots.push(pfss);
        }
        return error;
    }
}

export class TradeTransaction{
    id:number;
    trades = new KHashTable<number,Trade>(numcmp,numhash);
    snapshots = new KHashTable<number,MarketSnapshot>(numcmp,numhash);
    portfolios:TradePortfolio[];
    constructor(idX:number|KObject){
        if(typeof idX === "number"){
            this.id = idX as number;
            this.portfolios = [];
        }
        else{
            const ttx = idX as KObject;
            this.id = ttx.id as number;
            for(const tr of idX.trades as KObject[]){
                const trade = new Trade(tr);
                this.trades.set(trade.id,trade);
            }
            for(const ss of idX.snapshots as KObject[]){
                const snapshot = new MarketSnapshot(ss);
                this.snapshots.set(snapshot.id,snapshot);
            }
            this.portfolios = rawFromArray(idX.portfolios as KValue[],v=>new TradePortfolio(this,v as KObject));
        }
    }
    toObj(){
        return {
            id: this.id,
            trades: rawToArray(this.trades.valueToArray()),
            snapshots: rawToArray(this.snapshots.valueToArray()),
            portfolios: rawToArray(this.portfolios)
        } as KObject;
    }
    trade(tr:Trade):number{
        this.trades.set(tr.id,tr);
        const index = this.portfolios.length;
        const portfolio = new TradePortfolio(this,this.portfolios[index-1].toObj());
        portfolio.trade(tr);
        this.portfolios.push(portfolio);
        return index;
    }
    snapshot(index:number,ss:MarketSnapshot):string|undefined{
        if(index<0||index>=this.portfolios.length){
            return "not a valid index = "+index+", current length = "+this.portfolios.length;
        }
        else{
            this.snapshots.set(ss.id,ss);
            return this.portfolios[index].snapshot(ss);
        }
    }
}
