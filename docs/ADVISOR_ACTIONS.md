# Aurex Advisor — Available Actions & Context Schema

## Overview

Aurex Advisor 是一个 LLM 驱动的通用顾问框架。它将链上信号、用户持仓、市场状态打包为 context，定义可执行动作集合，由 LLM 自由组合生成个性化建议 + 模拟结果。

核心原则：
- 不硬编码建议逻辑，LLM 根据 context 自由推理
- 只定义动作边界和数据格式
- 用户确认后一键执行，或仅作为参考

---

## Context（输入给 LLM 的上下文）

### 1. 用户状态

```json
{
  "wallet": "0x...",
  "holdings": [
    {"token": "WETH", "balance": "5.2", "usdValue": "18200"},
    {"token": "USDT", "balance": "3000", "usdValue": "3000"}
  ],
  "lpPositions": [
    {"pool": "WETH/USDC", "poolId": "0x...", "liquidity": "...", "usdValue": "5000"}
  ],
  "riskPreference": "moderate",
  "locale": "zh-CN"
}
```

### 2. 活跃信号

```json
{
  "signals": [
    {
      "poolId": "0x...",
      "poolName": "WETH/USDC",
      "publisher": "0x...",
      "publisherAccuracy": 88,
      "riskScore": 72,
      "alphaScore": 35,
      "liquidityScore": 60,
      "volatilityScore": 85,
      "recommendedFee": 8000,
      "expiresAt": "2026-05-23T15:00:00Z",
      "signalAge": "25min"
    }
  ]
}
```

### 3. 链上市场数据（Onchain Signals）

```json
{
  "onchainSignals": {
    "whaleMovements": [
      {"type": "transfer_to_exchange", "token": "WETH", "amount": "500", "exchange": "OKX", "timestamp": "..."}
    ],
    "liquidityChanges": [
      {"pool": "WETH/USDC", "type": "remove", "amount": "120000", "percentOfTotal": "8%", "timestamp": "..."}
    ],
    "volumeAnomalies": [
      {"pool": "WETH/USDC", "currentVolume": "2.5M", "avgVolume": "800K", "multiplier": "3.1x"}
    ],
    "contractState": [
      {"protocol": "Aave", "event": "large_liquidation", "amount": "2M", "asset": "WETH"}
    ],
    "holderDistribution": [
      {"token": "WETH", "top10HoldersPercent": "32%", "changeLastWeek": "+2.5%"}
    ],
    "marketNarrative": [
      {"source": "twitter_sentiment", "topic": "ETH", "sentiment": "bearish", "confidence": 0.72},
      {"source": "news", "headline": "SEC delays ETH ETF decision", "impact": "negative"}
    ]
  }
}
```

### 4. Publisher 排行

```json
{
  "publishers": [
    {"address": "0x...", "accuracy": 92, "signalCount": 156, "slashCount": 2, "stake": "500 AUREX"},
    {"address": "0x...", "accuracy": 78, "signalCount": 43, "slashCount": 5, "stake": "200 AUREX"}
  ]
}
```

### 5. 池子状态

```json
{
  "pools": [
    {
      "poolId": "0x...",
      "name": "WETH/USDC",
      "currentPrice": "3500",
      "price24hAgo": "3650",
      "priceChange": "-4.1%",
      "currentFee": 8000,
      "defaultFee": 3000,
      "tvl": "2.5M",
      "volume24h": "800K",
      "publisherShareBps": 500,
      "whitelistedPublishers": ["0x...", "0x..."]
    }
  ]
}
```

---

## Available Actions（LLM 可推荐的动作）

### 交易类

| Action | 参数 | 说明 |
|--------|------|------|
| `swap` | `tokenFrom, tokenTo, percentage, pool?` | 将持仓中某 token 的 X% 兑换为另一个 token |
| `limitSwap` | `tokenFrom, tokenTo, percentage, targetPrice` | 当价格达到目标时执行 swap |
| `splitSwap` | `tokenFrom, tokenTo, percentage, chunks, interval` | 分批执行 swap（减少滑点/时机风险） |

### 流动性类

| Action | 参数 | 说明 |
|--------|------|------|
| `addLiquidity` | `pool, amount, token?` | 向池子添加流动性 |
| `removeLiquidity` | `pool, percentage` | 从池子移除流动性 |
| `migrateLiquidity` | `fromPool, toPool, percentage` | 将流动性从一个池子迁移到另一个 |

### 等待/观望类

| Action | 参数 | 说明 |
|--------|------|------|
| `wait` | `duration, reason, reEvaluateCondition` | 建议暂不操作，等待条件变化 |
| `waitForFee` | `pool, targetFee, maxWait` | 等待费率降低后再 swap |
| `waitForSignal` | `pool, condition, maxWait` | 等待特定信号条件出现 |

### 风控类

| Action | 参数 | 说明 |
|--------|------|------|
| `setAlert` | `metric, threshold, direction, message` | 设置价格/风险/信号阈值提醒 |
| `stopLoss` | `token, triggerPercent, swapTo` | 设置止损条件 |
| `hedge` | `asset, method, percentage` | 对冲持仓风险（如 swap 部分到稳定币） |
| `diversify` | `fromToken, targets[]` | 将集中持仓分散到多个资产 |

### 信息类

| Action | 参数 | 说明 |
|--------|------|------|
| `explain` | `topic` | 解释当前市场状况/信号含义 |
| `compare` | `options[]` | 对比多个操作方案的预期结果 |
| `simulate` | `actions[], timeframe` | 模拟一组操作的预期结果 |
| `followPublisher` | `address, reason` | 建议关注某个高准确率 publisher |

### 收益类

| Action | 参数 | 说明 |
|--------|------|------|
| `claimFees` | `token` | 提醒 publisher 领取累积的费率分成 |
| `becomePublisher` | `stakeAmount, targetPools[]` | 建议用户成为 publisher（如果有 AI Agent） |
| `increaseStake` | `amount, reason` | 建议增加质押以提高信号权重 |

---

## Output Format（LLM 输出格式）

```json
{
  "advice": {
    "summary": "ETH 近期风险信号密集，建议减仓并等待费率回落",
    "reasoning": "3 个高准确率 Publisher 同时发布 riskScore>70，链上数据显示巨鲸向交易所转入 500 ETH，流动性被撤出 8%。历史上类似模式 48h 内平均跌幅 6-10%。",
    "confidence": 0.78,
    "signalSources": ["0xPublisherA (92%)", "0xPublisherB (85%)", "0xPublisherC (79%)"],
    "actions": [
      {
        "type": "swap",
        "params": {"tokenFrom": "WETH", "tokenTo": "USDT", "percentage": 30},
        "priority": "high",
        "reason": "降低 ETH 风险暴露"
      },
      {
        "type": "waitForFee",
        "params": {"pool": "WETH/USDC", "targetFee": 3000, "maxWait": "25min"},
        "priority": "medium",
        "reason": "当前费率 8000 bps，信号 25 分钟后过期，届时费率回落"
      }
    ],
    "simulation": {
      "before": {"portfolioRisk": 72, "ethExposure": "80%", "estimatedMaxDrawdown": "-18%"},
      "after": {"portfolioRisk": 45, "ethExposure": "56%", "estimatedMaxDrawdown": "-9%"}
    },
    "alternatives": [
      {
        "description": "激进方案：swap 50% ETH → USDT + 设置止损",
        "tradeoff": "更安全但如果反弹会错过收益"
      },
      {
        "description": "保守方案：只设 alert，暂不操作",
        "tradeoff": "保留上行空间但承受下行风险"
      }
    ]
  }
}
```

---

## Onchain Signals 数据源

Advisor 需要聚合以下链上数据作为 context 输入：

| 数据类型 | 来源 | 用途 |
|---------|------|------|
| 巨鲸钱包行为 | 监控大额 transfer 事件（>100 ETH） | 判断买卖压力方向 |
| 流动性变化 | Pool 的 ModifyLiquidity 事件 | 判断 LP 信心 |
| 交易量异常 | Swap 事件聚合，对比历史均值 | 识别异常活动 |
| 合约状态 | 借贷协议清算事件、大额借贷 | 系统性风险信号 |
| Holder 分布 | Token 持有者集中度变化 | 抛压/囤积信号 |
| 市场叙事 | 社交媒体情绪、新闻事件 | 宏观情绪判断 |
| 跨池价格偏差 | 同一 token 在不同池子的价差 | 套利机会/异常 |
| Gas 费趋势 | 网络拥堵程度 | 执行时机优化 |

---

## Prompt 设计原则

1. **Context 完整但精简** — 只传入与用户持仓相关的信号和数据，不传全量
2. **Action 边界明确** — LLM 只能推荐已定义的 action type，不能发明新动作
3. **必须给出 simulation** — 每个建议必须附带执行前后的量化对比
4. **必须给出 alternatives** — 至少提供一个替代方案
5. **标注置信度和来源** — 建议基于哪些信号、哪些 publisher、置信度多少
6. **尊重用户偏好** — riskPreference 影响建议的激进程度
7. **不替用户决定** — 永远是建议，不是指令
