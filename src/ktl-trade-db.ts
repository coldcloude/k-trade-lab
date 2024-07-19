import { DateFormat, KAVLTree, KHashTable, KMap, KObject, numcmp, numhash, strcmp, strhash } from "@coldcloude/kai2";
import { dayd, dayn } from "./ktl.js";

const dfmt = new DateFormat("yyyyMMdd");

const dtfmt = new DateFormat("yyyyMMddHHmmss");

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
    fee: number
};

type MarketSnapshotEntity = {
    ss_id: number,
    ttx_id: number,
    ss_date: string,
    ss_time: string,
    rate: number
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
    pos_index: number,
    pf_index: number,
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

type PortfolioSnapshotEntity = {
    ss_index: number,
    pf_index: number,
    ss_id: number,
    ttx_id: number,
    ss_date: string,
    ss_time: string,
    profit: number,
    margin: number,
    delta: number,
    gamma: number,
    theta: number,
    vega: number,
    rho: number
};

type TradePortfolioEntity = {
    pf_index: number,
    ttx_id: number,
    pf_date: string,
    pf_time: string,
    cost: number,
    income: number
};

type TradeTransactionEntity = {
    ttx_id: number,
    ttx_name: string,
    ttx_desc: string
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
    } as KObject;
}

export function fillTradeEntity(tr:KObject,tx:number):TradeEntity{
    const day = dayd(tr.day as number);
    return {
        tr_id: tr.id as number,
        ttx_id: tx,
        tr_date: dfmt.format(day),
        tr_time: dtfmt.format(day),
        asset_name: tr.asset as string,
        marginal: tr.marginal as number,
        amount: tr.amount as number,
        rate: tr.rate as number,
        price: tr.price as number,
        fee: tr.fee as number
    };
}

export function buildMarketSnapshotObj(eSS:MarketSnapshotEntity,eMSPs:MarketSnapshotPriceEntity[]):KObject{
    const prices = {} as KObject;
    const margins = {} as KObject;
    for(const msp of eMSPs){
        prices[msp.asset_name] = msp.price;
        margins[msp.asset_name] = msp.margin;
    }
    return {
        id: eSS.ss_id,
        day: dayn(dtfmt.parse(eSS.ss_time)),
        rate: eSS.rate,
        prices: prices,
        margins: margins
    } as KObject;
}

export function fillMarketSnapshotAndPricesEntity(ss:KObject,tx:number):{
    snapshot: MarketSnapshotEntity,
    prices: MarketSnapshotPriceEntity[]
}{
    const id = ss.id as number;
    const day = dayd(ss.day as number);
    const date = dfmt.format(day);
    const time = dtfmt.format(day);
    const priceEntityMap = new KHashTable<string,MarketSnapshotPriceEntity>(strcmp,strhash);
    const createPrice = (asset?:string)=>{
        return {
            ss_id: id,
            ttx_id: tx,
            ss_date: date,
            ss_time: time,
            asset_name: asset!,
            price: 0,
            margin: 0
        };
    };
    const pricesObj = ss.prices as KObject;
    for(const k in pricesObj){
        const e = priceEntityMap.computeIfAbsent(k,createPrice)!;
        e.price = pricesObj[k] as number;
    }
    const marginsObj = ss.margins as KObject;
    for(const k in marginsObj){
        const e = priceEntityMap.computeIfAbsent(k,createPrice)!;
        e.margin = marginsObj[k] as number;
    }
    return {
        snapshot: {
            ss_id: id,
            ttx_id: tx,
            ss_date: date,
            ss_time: time,
            rate: ss.rate as number
        },
        prices: priceEntityMap.valueToArray()
    };
}

export function buildTradePositionObj(ePos:TradePositionEntity):KObject{
    return {
        trade: ePos.tr_id,
        amount: ePos.pos_amount,
        day: dayn(dtfmt.parse(ePos.pos_time)),
        rate: ePos.pos_rate,
        price: ePos.pos_price,
        profit: ePos.profit,
        iv: ePos.impl_vol,
        delta: ePos.delta,
        gamma: ePos.gamma,
        theta: ePos.theta,
        vega: ePos.vega,
        rho: ePos.rho
    } as KObject;
}

export function fillTradePositionEntity(pos:KObject,index:number,pf:number,eTr:TradeEntity):TradePositionEntity{
    const day = dayd(pos.day as number);
    return {
        pos_index: index,
        pf_index: pf,
        tr_id: eTr.tr_id,
        ttx_id: eTr.ttx_id,
        tr_date: eTr.tr_date,
        tr_time: eTr.tr_time,
        pos_date: dfmt.format(day),
        pos_time: dtfmt.format(day),
        asset_name: eTr.asset_name,
        marginal: eTr.marginal,
        tr_amount: eTr.amount,
        tr_rate: eTr.rate,
        tr_price: eTr.price,
        tr_fee: eTr.fee,
        pos_amount: pos.amount as number,
        pos_rate: pos.rate as number,
        pos_price: pos.price as number,
        profit: pos.profit as number,
        impl_vol: pos.iv as number,
        delta: pos.delta as number,
        gamma: pos.gamma as number,
        theta: pos.theta as number,
        vega: pos.vega as number,
        rho: pos.rho as number
    };
}

export function buildPortfolioSnapshotObj(ePS:PortfolioSnapshotEntity):KObject{
    return {
        snapshot: ePS.ss_id,
        profit: ePS.profit,
        margin: ePS.margin,
        delta: ePS.delta,
        gamma: ePS.gamma,
        theta: ePS.theta,
        vega: ePS.vega,
        rho: ePS.rho
    } as KObject;
}

export function fillPortfolioSnapshotEntity(ps:KObject,index:number,pf:number,eSS:MarketSnapshotEntity):PortfolioSnapshotEntity{
    return {
        ss_index: index,
        pf_index: pf,
        ss_id: eSS.ss_id,
        ttx_id: eSS.ttx_id,
        ss_date: eSS.ss_date,
        ss_time: eSS.ss_time,
        profit: ps.profit as number,
        margin: ps.margin as number,
        delta: ps.delta as number,
        gamma: ps.gamma as number,
        theta: ps.theta as number,
        vega: ps.vega as number,
        rho: ps.rho as number
    };
}

export function buildTradePortfolioObj(ePF:TradePortfolioEntity,ePoss:TradePositionEntity[],ePSs:PortfolioSnapshotEntity[]):KObject{
    const positions:KObject[] = [];
    for(const ePos of ePoss){
        positions.push(buildTradePositionObj(ePos));
    }
    const snapshots:KObject[] = [];
    for(const ePS of ePSs){
        snapshots.push(buildPortfolioSnapshotObj(ePS));
    }
    return {
        day: dayn(dtfmt.parse(ePF.pf_date)),
        positions: positions,
        snapshots: snapshots,
        cost: ePF.cost,
        income: ePF.income
    } as KObject;
}

export function fillTradePortfolioEntity(pf:KObject,index:number,tx:number,trs:KMap<number,TradeEntity>,sss:KMap<number,MarketSnapshotEntity>):{
    portfolio: TradePortfolioEntity
    positions: TradePositionEntity[],
    snapshots: PortfolioSnapshotEntity[],
}{
    const day = dayd(pf.day as number);
    const positions:TradePositionEntity[] = [];
    const poss = pf.positions as KObject[];
    for(let i=0; i<poss.length; i++){
        const pos = poss[i];
        const trid = pos.trade as number;
        const tr = trs.get(trid);
        if(tr===undefined){
            throw new Error("no trade '"+trid+"' found");
        }
        else{
            positions.push(fillTradePositionEntity(pos,i,index,tr));
        }
    }
    const snapshots:PortfolioSnapshotEntity[] = [];
    const pss = pf.snapshots as KObject[];
    for(let i=0; i<pss.length; i++){
        const ps = pss[i];
        const ssid = ps.snapshot as number;
        const ss = sss.get(ssid);
        if(ss===undefined){
            throw new Error("no snapshot '"+ssid+"' found");
        }
        else{
            snapshots.push(fillPortfolioSnapshotEntity(ps,i,index,ss));
        }
    }
    return {
        portfolio: {
            pf_index: index,
            ttx_id: tx,
            pf_date: dfmt.format(day),
            pf_time: dtfmt.format(day),
            cost: pf.cost as number,
            income: pf.income as number
        },
        positions: positions,
        snapshots: snapshots
    };
}

export function buildTradeTransactionObj(
    eTTx:TradeTransactionEntity,
    eTrs:TradeEntity[],
    eSSs:MarketSnapshotEntity[],
    eMSPs:MarketSnapshotPriceEntity[],
    ePFs:TradePortfolioEntity[],
    ePoss:TradePositionEntity[],
    ePSs:PortfolioSnapshotEntity[]
){
    const trs:KObject[] = [];
    for(const eTr of eTrs){
        trs.push(buildTradeObj(eTr));
    }
    const eMSPMap = new KHashTable<number,MarketSnapshotPriceEntity[]>(numcmp,numhash);
    for(const eMSP of eMSPs){
        eMSPMap.computeIfAbsent(eMSP.ss_id,()=>[])!.push(eMSP);
    }
    const sss:KObject[] = [];
    for(const eSS of eSSs){
        const ps = eMSPMap.get(eSS.ss_id)||[];
        sss.push(buildMarketSnapshotObj(eSS,ps));
    }
    const ePosMap = new KHashTable<number,KMap<number,TradePositionEntity>>(numcmp,numhash);
    for(const ePos of ePoss){
        ePosMap.computeIfAbsent(ePos.pf_index,()=>new KAVLTree<number,TradePositionEntity>(numcmp))!.set(ePos.pos_index,ePos);
    }
    const ePSMap = new KHashTable<number,KMap<number,PortfolioSnapshotEntity>>(numcmp,numhash);
    for(const ePS of ePSs){
        ePSMap.computeIfAbsent(ePS.pf_index,()=>new KAVLTree<number,PortfolioSnapshotEntity>(numcmp))!.set(ePS.ss_index,ePS);
    }
    const pfmap = new KAVLTree<number,KObject>(numcmp);
    for(const ePF of ePFs){
        const posmap = ePosMap.get(ePF.pf_index);
        const poss = posmap===undefined?[]:posmap.valueToArray();
        const psmap = ePSMap.get(ePF.pf_index);
        const pss = psmap===undefined?[]:psmap.valueToArray();
        const pf = buildTradePortfolioObj(ePF,poss,pss);
        pfmap.set(ePF.pf_index,pf);
    }
    return {
        id: eTTx.ttx_id,
        trades: trs,
        snapshots: sss,
        portfolios: pfmap.valueToArray()
    };
}

export function fillTradeTransactionEntity(tx:KObject,name:string,desc:string):{
    tx:TradeTransactionEntity,
    trades:TradeEntity[],
    snapshots:MarketSnapshotEntity[],
    snapshotPrices:MarketSnapshotPriceEntity[],
    portfolios:TradePortfolioEntity[],
    positions:TradePositionEntity[],
    portfolioSnapshots:PortfolioSnapshotEntity[]
}{
    const id = tx.id as number;
    const trs = new KHashTable<number,TradeEntity>(numcmp,numhash);
    for(const obj of tx.trades as KObject[]){
        const tr = fillTradeEntity(obj,id);
        trs.set(tr.tr_id,tr);
    }
    const sss = new KHashTable<number,MarketSnapshotEntity>(numcmp,numhash);
    const msps:MarketSnapshotPriceEntity[] = [];
    for(const obj of tx.snapshots as KObject[]){
        const {
            snapshot: ss,
            prices: ps
        } = fillMarketSnapshotAndPricesEntity(obj,id);
        sss.set(ss.ss_id,ss);
        for(const p of ps){
            msps.push(p);
        }
    }
    const rpfs:TradePortfolioEntity[] = [];
    const rposs:TradePositionEntity[] = [];
    const rpss:PortfolioSnapshotEntity[] = [];
    const pfs = tx.portfolios as KObject[];
    for(let i=0; i<pfs.length; i++){
        const pf = pfs[i];
        const {
            portfolio: rpf,
            positions: poss,
            snapshots: pss,
        } = fillTradePortfolioEntity(pf,i,id,trs,sss);
        rpfs.push(rpf);
        for(const pos of poss){
            rposs.push(pos);
        }
        for(const ps of pss){
            rpss.push(ps);
        }
    }
    return {
        tx: {
            ttx_id: id,
            ttx_name: name,
            ttx_desc: desc
        },
        trades: trs.valueToArray(),
        snapshots: sss.valueToArray(),
        snapshotPrices: msps,
        portfolios: rpfs,
        positions: rposs,
        portfolioSnapshots: rpss
    };
}
