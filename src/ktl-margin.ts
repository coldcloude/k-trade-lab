/**
 * 单腿期权合约方面，期权卖方交易保证金的收取标准为：
 * 期权合约结算价×标的期货合约交易单位+MAX[标的期货合约交易保证金－期权虚值额的一半，标的期货合约交易保证金的一半]
 * 
 * @param p 期权价格
 * @param f 标的价格
 * @param k 期权执行价格
 * @param r 保证金率
 * @param cp 1=call；2=put
 * @returns 单手保证金
 */
export function marginOption(p:number, f:number, k:number, r:number, cp:number):number{
    const mf = f * r; //单位标的期货合约交易保证金
    return p + Math.max(mf - Math.max(cp * (k - f), 0) * 0.5, mf * 0.5);
}

/**
 * 卖出期权
 * 卖出看涨期权，同时买入对应期货合约
 * 卖出看跌期权，同时卖出对应期货合约
 * 期货保证金+期权权利金结算价*交易单位
 * 
 * @param p 期权价格
 * @param f 标的价格
 * @param r 保证金率
 * @returns 同手单手保证金
 */
export function marginCovered(p:number, f:number, r:number):number{
    return p + f * r;
}

/**
 * 期权跨式
 * 卖出同一系列的相同执行价格的看涨期权和看跌期权
 * 期权宽跨式
 * 卖出同一系列低执行价格的看跌期权和高执行价格的看涨期权
 * max(看涨期权保证金，看跌期权保证金)+另一方权利金结算价*交易单位
 * 
 * @param pc call价格
 * @param pp put价格
 * @param f 标的价格
 * @param kc call执行价格
 * @param kp put执行价格
 * @param r 保证金率
 * @returns 同手单手保证金
 */
export function marginStrangle(pc:number,pp:number,f:number,kc:number,kp:number,r:number):number{
    const mc = marginOption(pc,f,kc,r,1);
    const mp = marginOption(pp,f,kp,r,-1);
    return kc<kp?mc+mp:(mc<mp?mp+pc:mc+pp);
}

/**
 * 买入垂直价差
 * 买进低执行价格的看涨期权，同时卖出相同期货合约的高执行价格的看涨期权
 * 买进高执行价格的看跌期权，同时卖出相同期货合约的低执行价格的看跌期权
 * 同手无需保证金
 * 卖出垂直价差
 * 卖出低执行价格的看涨期权，同时买进相同期货合约的高执行价格的看涨期权
 * 卖出高执行价格的看跌期权，同时买进相同期货合约的低执行价格的看跌期权
 * min(执行价格之差*交易单位，空头期权保证金)
 * 
 * @param ps short期权价格
 * @param f 标的价格
 * @param kl long期权执行价格
 * @param ks short期权执行价格
 * @param r 保证金率
 * @param cp 1=call；2=put
 * @returns 同手单手保证金
 */
export function marginSpread(ps:number,f:number,kl:number,ks:number,r:number,cp:number):number{
    const spread = cp * (kl - ks);
    return spread<=0?0:Math.min(spread,marginOption(ps,f,ks,r,cp));
}
