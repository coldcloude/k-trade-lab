# 市场表
## 表名
ktl_market
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|mkt_name|市场名称|string||
|mkt_full_name|市场全称|string||

# 市场品种表
## 表名
ktl_market_variaty
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|mkt_name|市场名称|string||
|vrt_type|品种类型|number|0=通用；1=货币；2=商品；3=债券|
|vrt_name|品种名称|string||
|vrt_full_name|品种全称|string||

# 证券资产表
## 表名
ktl_asset
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|asset_name|证券资产名称|string||
|asset_type|证券资产类型|number|0=通用；1=期货；2=期权；3=债券；4=货币|
|mature_date|到期日|string|格式：yyyyMMdd|
|underlying_asset_name|标的证券资产|string||
|opt_exercise_price|行权价格|number||
|opt_direction|期权方向|number|1=call；2=put|

# 利率日表
## 表名
ktl_market_rate_day
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|mkt_date|市场日期|string|格式：yyyyMMdd|
|cur_name|货币名称|string||
|rate_o_n|隔夜利率|double||
|rate_1w|一周利率|double||
|rate_2w|二周利率|double||
|rate_1m|一月利率|double||
|rate_3m|三月利率|double||
|rate_6m|六月利率|double||
|rate_9m|九月利率|double||
|rate_1y|一年利率|double||

# 价格日表
## 表名
ktl_market_price_day
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|mkt_date|市场日期|string|格式：yyyyMMdd|
|asset_name|证券资产名称|string||
|price_open|开盘价|double||
|price_high|最高价|double||
|price_low|最低价|double||
|price_close|收盘价|double||
|price_settle|结算价|double||
|volume|成交量|long||
|position|持仓量|long||

# 交易事务表
## 表名
ktl_trade_transaction
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|ttx_id|交易事务ID|number||
|ttx_name|交易事务名称|string||
|ttx_desc|交易事务说明|string||

# 交易表
## 表名
ktl_trade
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|tr_id|交易ID|number|交易事务ID*1000000+自增序号|
|ttx_id|交易事务ID|number|关联ktl_trade_transaction表|
|tr_date|交易日期|string|格式：yyyyMMdd|
|tr_time|交易时间|string|格式：yyyyMMddHHmmss|
|asset_name|证券资产名称|string||
|marginal|是否为保证金交易|number|0=直接交易；1=保金交易|
|amount|数量|number|卖出为负数|
|rate|利率|number||
|price|价格|number||
|fee|费用|number||
|order|在交易事务中的顺序|number|和snapshot共同排序|

# 交易市场快照表
## 表名
ktl_trade_market_snapshot
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|ss_id|快照ID|number|交易事务ID*1000000+自增序号|
|ttx_id|交易事务ID|number|关联ktl_trade_transaction表|
|ss_date|快照日期|string|格式：yyyyMMdd|
|ss_time|快照时间|string|格式：yyyyMMddHHmmss|
|rate|利率|number||
|order|在交易事务中的顺序|number|和trade共同排序|

# 交易市场快照价格表
## 表名
ktl_trade_market_snapshot_price
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|ss_id|快照ID|number|交易事务ID*1000000+自增序号|
|ttx_id|交易事务ID|number|关联ktl_trade_transaction表|
|ss_date|快照日期|string|格式：yyyyMMdd|
|ss_time|快照时间|string|格式：yyyyMMddHHmmss|
|asset_name|证券资产名称|string||
|price|价格|number||
|margin|保证金率|number||


# 仓位表
## 表名
ktl_trade_position
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|pos_index|仓位索引number|在一个投资组合中递增|
|pf_index|投资组合索引number|在一个交易事务中递增|
|tr_id|交易ID|number|关联ktl_trade表|
|ttx_id|交易事务ID|number|关联ktl_trade_transaction表|
|tr_date|交易日期|string|格式：yyyyMMdd|
|tr_time|交易时间|string|格式：yyyyMMddHHmmss|
|pos_date|仓位日期|string|格式：yyyyMMdd|
|pos_time|仓位时间|string|格式：yyyyMMddHHmmss|
|asset_name|证券资产名称|string||
|marginal|是否为保证金交易|number|0=直接交易；1=保金交易|
|tr_amount|交易数量|number|卖出为负数|
|tr_rate|交易利率|number||
|tr_price|交易价格|number||
|tr_fee|交易费用|number||
|pos_amount|仓位|number|空头为负数|
|pos_rate|仓位利率|number||
|pos_price|仓位价格|number||
|profit|盈利|number||
|impl_vol|隐含波动率|number||
|delta|希腊字母Delta|number||
|gamma|希腊字母Gamma|number||
|theta|希腊字母Theta|number||
|vega|希腊字母Vega|number||
|rho|希腊字母Rho|number||

# 投资组合表
## 表名
ktl_trade_portfolio
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|pf_index|投资组合索引number|在一个交易事务中递增|
|ttx_id|交易事务ID|number|关联ktl_trade_transaction表|
|pf_date|投资组合日期|string|格式：yyyyMMdd|
|pf_time|投资组合时间|string|格式：yyyyMMddHHmmss|
|cost|成本|number||
|income|收入|number||

# 资产组合快照表
## 表名
ktl_trade_portfolio_snapshot
## 列
|名称|中文说明|类型|备注|
|----|----|----|----|
|pf_id|投资组合ID|number|交易事务ID*1000000+自增序号|
|ss_id|快照ID|number|交易事务ID*1000000+自增序号|
|tr_id|交易ID|number|关联ktl_trade表|
|ttx_id|交易事务ID|number|关联ktl_trade_transaction表|
|pf_date|投资组合日期|string|格式：yyyyMMdd|
|pf_time|投资组合时间|string|格式：yyyyMMddHHmmss|
|ss_date|快照日期|string|格式：yyyyMMdd|
|ss_time|快照时间|string|格式：yyyyMMddHHmmss|
|profit|盈利|number||
|margin|保证金|number||
|delta|希腊字母Delta|number||
|gamma|希腊字母Gamma|number||
|theta|希腊字母Theta|number||
|vega|希腊字母Vega|number||
|rho|希腊字母Rho|number||
