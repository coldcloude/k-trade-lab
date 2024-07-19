import { DateFormat, KMap, KObject } from "@coldcloude/kai2";
import { dayn } from "./ktl";

const dfmt = new DateFormat("yyyyMMdd");

const dtfmt = new DateFormat("yyyyMMddHHmmss");

type TradeTransactionEntity = {
    ttx_id: number,
    ttx_name: string,
    ttx_desc: string
};

type TradeEntity = {
    tr_id: number,
    ttx_id: number,
    tr_date: string,
    tr_time: string,
    asset_name: string,
    marginal: number,
    amount: number,
    rate: number,
    price: number,
    fee: number,
    order: number
};

type MarketSnapshotEntity = {
    ss_id: number,
    ttx_id: number,
    ss_date: string,
    ss_time: string,
    rate: number,
    order: number
};

type MarketSnapshotPriceEntity = {
    ss_id: number,
    ttx_id: number,
    ss_date: string,
    ss_time: string,
    asset_name: string,
    price: number,
    margin: number
};

type TradePositionEntity = {
    pos_id: number,
    pf_id: number,
    tr_id: number,
    ttx_id: number,
    tr_date: string,
    tr_time: string,
    pos_date: string,
    pos_time: string,
    asset_name: string,
    marginal: number,
    tr_amount: number,
    tr_rate: number,
    tr_price: number,
    tr_fee: number,
    pos_amount: number,
    pos_rate: number,
    pos_price: number,
    profit: number,
    impl_vol: number,
    delta: number,
    gamma: number,
    theta: number,
    vega: number,
    rho: number
};

export function buildTradeObj(eTr:TradeEntity):KObject{
    return {
        id: eTr.tr_id,
        asset: eTr.asset_name,
        marginal: eTr.marginal,
        amount: eTr.amount,
        day: dayn(dtfmt.parse(eTr.tr_time)),
        rate: eTr.rate,
        price: eTr.price,
        fee: eTr.fee
    };
}

export function buildTradePositionObj(ePos:TradePositionEntity,trObjMap:KMap<number,KObject>){
    const trId = ePos.tr_id;
    const trObj = trObjMap.get(trId);
    if(trObj!==undefined){
        return {
            trade: trObj,
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
    else{
        throw "trade '"+trId+"' not found";
    }
}