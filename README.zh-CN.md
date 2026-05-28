# Aurex

[English](./README.md) · **简体中文**

构建在 Uniswap V4 Hook 之上的开放信号市场协议 + 自托管 AI 交易应用。

部署在 X Layer 主网（Chain ID: 196）。

> 🏆 **Hook the Future 黑客松提交项目** —— 部署于 **X Layer 主网（链 ID 196）** · 4 个核心合约 + 2 个代币 **全部在 Sourcify 验证通过** · AurexAlphaHook: [`0xF8F9...00c4`](https://www.okx.com/web3/explorer/xlayer/address/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4) · 项目 X 账号：[@0xAurex_ai](https://twitter.com/0xAurex_ai)
>
> **一句话简介：** Aurex 把 Uniswap V4 Hook 变成开放的信号市场——发布者质押 AUREX 推送链上风险/Alpha 评分，X Layer 上的 Hook 在每一笔 swap 中把动态费率结算给 LP、把分润通过 `afterSwapReturnDelta` 实时打给发布者；配套自托管 MCP Advisor 让 Claude / Cursor / OpenClaw 等任意 AI 客户端从同一个钱包同时消费和发布信号。

## 🎬 Demo 视频

https://github.com/user-attachments/assets/2b5f6cd1-f1cf-4530-9952-6c627d8a81d3

## 致黑客松评委

**60 秒验证路径：**

1. **Hook 已上线 X Layer 主网** → AurexAlphaHook [`0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4`](https://www.okx.com/web3/explorer/xlayer/address/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4)（[Sourcify 源码已验证 ✓](https://repo.sourcify.dev/196/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4)）
2. **Hook 已被真实链上交易触发** → 4 个池上累计发布 8+ 条信号，所有交易哈希见 [`contracts/deployments/demo-transactions.md`](./contracts/deployments/demo-transactions.md)
3. **Hook 源码** → [`contracts/src/hooks/AurexAlphaHook.sol`](./contracts/src/hooks/AurexAlphaHook.sol) —— `beforeSwap` 读取当前活跃信号计算动态费率；`afterSwap` 通过 `afterSwapReturnDelta: true` 从 swap 输出中抽出 `publisherShareBps` 当场结算给发布者
4. **端到端复现** → `cd contracts && ./run-demo.sh`（执行 `script/FullFlowDemo.s.sol` —— 注册发布者 → 发布 4 条信号 → 全部上链）
5. **Demo 视频** → 已内嵌于上方（[脚本源文件](./docs/VIDEO_SCRIPT.md)）

**对照官方三个评分维度：**

| 评分维度 | Aurex 的回答 |
|---------|-------------|
| **创新性** | Hook 不是业务逻辑插件，而是**信号市场的结算层**。发布者质押 AUREX → 推送信号 → Hook 在 `beforeSwap` 读取信号设置动态费率 → 在 `afterSwap` 通过 `afterSwapReturnDelta` 把 `publisherShareBps` 实时分润给发布者。Alpha 第一次变成可交易、可罚没、链上可验证的资产类别——这是 V4 Hook 才让它成为可能的。 |
| **潜在市场价值** | 发布者收益来自**真实的 swap 手续费**，不是代币增发——每一笔经过 Hook 池的 swap 都在同一交易中给发布者结算。对能产出准确市场情报的 AI Agent 来说是可持续的现金流；对池创建者来说是动态费率提供的 LP 保护。 |
| **完成度** | X Layer 主网部署 4 个核心合约 + 2 个代币 · Sourcify 全部验证 · 34 个 Foundry 测试全通过 · 4 个池上 8+ 条真实信号 · 一条命令即可端到端复现 |

---

🌐 **在线 Demo（仅展示用途）**：[web-sigma-virid-60.vercel.app](https://web-sigma-virid-60.vercel.app)

> ⚠️ **托管的 Demo 仅供预览。** Aurex Advisor 的设计目标是**自托管**——每个用户运行自己的实例，使用自己的密钥、自己的数据、自己的 AI 客户端。Vercel 部署只是展示 UI；真实使用请按下方[自托管部署指南](#自托管部署指南)操作。

📜 **链上交易记录**：[contracts/deployments/demo-transactions.md](./contracts/deployments/demo-transactions.md) —— X Layer 上 8+ 条已发布的信号

🔌 **与 OKX ExchangeOS 深度集成**：Aurex Advisor 原生对接 OKX OnchainOS Agentic Wallet，实现 TEE 签名、交易安全扫描、无缝链上执行。见下方 [OnchainOS 集成](#onchainos-agentic-wallet-签名器) 章节。

---

## 自托管部署指南

Aurex 的设计原则：**你的密钥、你的数据、你的 AI**。任何环节都不应该托付给中心化服务。

```bash
# 1. 克隆并安装依赖
git clone https://github.com/Aurex-Onchain/Aurex.git
cd Aurex
pnpm install

# 2. 运行 Advisor（自托管后端）
cd apps/advisor
cp .env.example .env
# 配置 AUREX_PRIVATE_KEY 或 AUREX_SIGNER_PROVIDER=onchainos
pnpm dev          # 监听 http://localhost:3100

# 3. 运行 Web Dashboard（你本地的 UI）
cd ../web
pnpm dev          # 监听 http://localhost:3000

# 4. 通过 MCP 接入任意 AI 客户端（Claude Code、Cursor 等）
# 详见：docs/AI_CLIENT_INTEGRATION.md
```

`vercel.app` 上的 Demo 只是一个静态 UI 外壳——它无法发布信号、签名交易，也不持有任何密钥。只有你本地运行的 Advisor 实例才能完成这些操作。

---

## Aurex 是什么

Aurex 包含两个部分：

**1. 开放信号市场协议** —— 任何人都可以发布市场情报信号的无许可链上基础设施。信号质量由经济机制强制保证：发布者质押 AUREX 作为抵押品，准确的信号赚取手续费收益，错误的信号会被罚没。

**2. Aurex Advisor** —— 一个自托管的 AI 交易应用，完成完整的执行闭环：

```
链上数据 → 算法评分 → 策略生成（AI 客户端）→ 信号发布 → 钱包执行
                              ↕
        AI 客户端（OpenClaw/Cursor/Claude）基于 Advisor 的结构化上下文推理
```

协议是共享基础设施。Advisor 是推荐的使用方式——一个自托管的 MCP Server 应用，自动拉取信号、基于市场上下文推理、自己也发布信号、监控用户行为风险，并通过 Hook 强制的池执行交易。

AI 客户端（OpenClaw、Cursor、Hermes、Claude 等）通过插件接入用户的 Advisor。

---

## 工作原理

```
┌─────────────────────────────────────────────────────────────────┐
│                       Aurex 生态                                 │
│                                                                  │
│  ┌───────────────────────┐    ┌──────────────────────────────┐  │
│  │  信号协议              │    │  Aurex Advisor               │  │
│  │  （开放基础设施）       │    │  （自托管 AI 应用）           │  │
│  │                        │    │                              │  │
│  │  - SignalRegistry      │◄──►│  自动拉取 + 发布信号          │  │
│  │  - AlphaHook           │    │  AI 智能 + 执行              │  │
│  │  - PolicyManager       │    │  行为风险指标                 │  │
│  │  - PoolFactory         │    │  服务 AI 客户端的 MCP Server  │  │
│  │  - Stake/Slash         │    │  推送通知                    │  │
│  │                        │    │                              │  │
│  │  任何人都可以发布       │    │  Aurex 的旗舰产品             │  │
│  └───────────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 使用场景

### 对信号发布者（AI Agent 运营方）

你运行一个分析链上数据的 AI——巨鲸动向、流动性变化、交易量异常。你想把这些 alpha 变现。

1. 质押 ≥100 AUREX → 注册为发布者
2. 你的 AI 把信号（风险评分、Alpha 评分、推荐费率）发布到 SignalRegistry
3. 池创建者把你的地址加入白名单 → 你的信号驱动他们池的动态费率
4. 每一笔通过该池的 swap → 你获得手续费分成（publisherShareBps）
5. 你的准确率被链上追踪。准确率高 → 更多池采纳你 → 更多收益

```
你的 AI → 发布信号 → 池使用信号 → swap 发生 → 你获得手续费分成
                                                  ↓
                                  信号错误 → 罚没 10% 质押
```

### 对池创建者（LP 管理者）

你提供流动性，希望根据市场状况获得动态费率保护。

1. 调用 `PoolFactory.createPool()`，传入代币对与池策略参数
2. 设置发布者白名单——选择你信任的信号源
3. 通过你池的 swap 会基于实时信号产生动态费率
4. 高风险信号 → 高费率（保护 LP）；低风险 → 低费率（吸引交易量）
5. 你配置 `publisherShareBps`——多少比例的手续费给信号发布者

### 对交易者

标准的 Uniswap V4 swap 体验，外加智能加成：

- 动态费率反映实时市场风险（swap 前透明可见）
- 高风险阻断保护你免受恶劣行情
- 不需要额外操作——直接 swap

### 对 Advisor 用户（AI 原生交易）

你想要一个跨现有 AI 工具运作的 AI 交易助手。

1. 在本地部署 Advisor（Docker / npm）
2. Advisor 自动注册为发布者，开始拉取链上数据
3. 通过插件接入你的 AI 客户端（OpenClaw、Cursor、Hermes）
4. 提问："现在 ETH 风险怎么样？" → Advisor 返回完整上下文
5. Advisor 推送预警："巨鲸把 500 ETH 转入交易所，建议减仓"
6. 确认执行 → Advisor 通过 Hook 池下单 → 作为发布者赚取手续费收益
7. 行为指标在你交易异常时警告："你的交易频率是 30 天均值的 4 倍"

---

## 代币经济

### AUREX = 信号质量保证金

AUREX 是质押型质量保证金。它的作用是为信号质量做经济抵押。

```
发布者质押 AUREX → 发布信号 → 信号驱动池动态费率
     ↑                                          |
     └──── 准确 → 准确率↑，更多池采纳 ←──────────┘
     └──── 错误 → 罚没 10% 质押，准确率↓ ←──────┘
                                                |
     发布者从每笔 swap 中获得手续费分润 ←────────┘
```

### 机制

| 机制 | 工作方式 | 效果 |
|------|---------|------|
| 质押发布 | 质押 ≥100 AUREX 注册发布者 | 获得发布信号的权限 |
| 错误信号罚没 | 预测错误 → 10% 质押销毁 | 让操纵的代价昂贵 |
| 准确率评分 | 链上记录（0-100，初始 50） | 公开声誉 |
| 手续费分润 | Hook 从 swap 输出中按 `publisherShareBps` 抽取 → 记入发布者账户 | 准确率 = 收入 |
| 发布者白名单 | 池管理员选择信任的发布者 | 精选质量 |

### 发布者经济模型

收益来源是**真实 swap 手续费**，不是代币增发：

```
发布者为池 X 发布信号
  → 交易者通过池 X 进行 swap
    → Hook 基于信号施加动态费率
      → Hook 从 swap 输出中抽出 publisherShareBps（例如 5%）
        → 记入发布者可领取余额
          → 发布者领取累积收益
```

**成本结构：**

| 成本 | 数额 | 时机 |
|------|------|------|
| 初始质押 | ≥100 AUREX | 注册时（一次性，冷却期后可赎回） |
| 每条信号的 gas | ~0.001 OKB | 每次调用 publishSignal() |
| 罚没风险 | 10% 质押 | 每次错误预测 |

**可持续飞轮：**
- 更好的信号 → 更多池将你加入白名单 → 更多 swap 交易量 → 更多收益
- 错误信号 → 罚没 → 准确率下降 → 池将你移除 → 没有收益

### 用户与发布者之间没有硬边界

任何用户都可以通过质押成为发布者。借助 Advisor，这一过程自动完成——Advisor 代表用户注册为发布者，并管理完整的生命周期。

---

## 链上协议

### 架构

```
第 1 层 —— 链上协议（共享基础设施）
  └─ AurexAlphaHook + SignalRegistry + PolicyManager + PoolFactory
  └─ 无许可：任何人都可以创建池、发布信号、验证准确率

第 2 层 —— 信号市场（开放竞争）
  └─ 发布者质押 AUREX → 发布信号 → 准确率链上追踪
  └─ 错误信号 → 罚没；准确信号 → 准确率↑ + 更多收益
  └─ 池创建者选择信任的发布者（白名单）
```

### 合约（X Layer 主网）

全部 6 个合约**已在 Sourcify 验证通过**（链 196）。点击验证徽章查看源码：

| 合约 | 地址 | 验证 | 源码 |
|------|------|------|------|
| AurexSignalRegistry | [`0xE00f...7D45`](https://www.okx.com/web3/explorer/xlayer/address/0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45) | [✓ Sourcify (完整)](https://repo.sourcify.dev/196/0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45) | [contracts/src/registry/](./contracts/src/registry/AurexSignalRegistry.sol) |
| AurexAlphaHook | [`0xF8F9...00c4`](https://www.okx.com/web3/explorer/xlayer/address/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4) | [✓ Sourcify (完整)](https://repo.sourcify.dev/196/0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4) | [contracts/src/hooks/](./contracts/src/hooks/AurexAlphaHook.sol) |
| AurexPolicyManager | [`0xEe55...3E5F`](https://www.okx.com/web3/explorer/xlayer/address/0xEe55CF595586527d5ADE7065CD2766899b123E5F) | [✓ Sourcify (完整)](https://repo.sourcify.dev/196/0xEe55CF595586527d5ADE7065CD2766899b123E5F) | [contracts/src/policy/](./contracts/src/policy/AurexPolicyManager.sol) |
| AurexPoolFactory | [`0xD44c...8A40`](https://www.okx.com/web3/explorer/xlayer/address/0xD44cE6C6f3Eb5dd093Cc99BeE7C2142368848A40) | [✓ Sourcify (完整)](https://repo.sourcify.dev/196/0xD44cE6C6f3Eb5dd093Cc99BeE7C2142368848A40) | [contracts/src/factory/](./contracts/src/factory/AurexPoolFactory.sol) |
| PoolManager (Uniswap V4) | [`0x360e...fb32`](https://www.okx.com/web3/explorer/xlayer/address/0x360e68faccca8ca495c1b759fd9eee466db9fb32) | （外部依赖） | [v4-core](https://github.com/Uniswap/v4-core) |
| MockAUREX | [`0x8819...8c82`](https://www.okx.com/web3/explorer/xlayer/address/0x8819A7972e17C61A4eeFe0F06e4bbef521228c82) | [✓ Sourcify (部分)](https://repo.sourcify.dev/196/0x8819A7972e17C61A4eeFe0F06e4bbef521228c82) | [contracts/src/tokens/](./contracts/src/tokens/MockAUREX.sol) |
| MockUSDC | [`0x4229...231d`](https://www.okx.com/web3/explorer/xlayer/address/0x4229Df8c78F60D1Daf54035E01527B9B025C231d) | [✓ Sourcify (部分)](https://repo.sourcify.dev/196/0x4229Df8c78F60D1Daf54035E01527B9B025C231d) | [contracts/src/tokens/](./contracts/src/tokens/MockUSDC.sol) |

**自己验证：** `cd contracts && ./verify-sourcify.sh`

### 协议流程

```
1. 发布者质押 AUREX → registerPublisher() → 成为活跃发布者
2. 池创建者调用 PoolFactory.createPool() → 创建带策略的 Hook 池
3. 池管理员设置发布者白名单（可选，精选信号源）
4. 发布者发布信号 → SignalRegistry 存储信号 + 时间戳 + 价格快照
5. 交易者 swap → Hook.beforeSwap() 读取最新信号 → 计算动态费率
6. Hook.afterSwap() 从 swap 输出中按 publisherShareBps 抽取 → 记入发布者
7. 信号过期 → 任何人都可以调用 verifySignal() → 比较预测价格与实际价格
8. 准确 → 准确率 +5；错误 → 罚没 10% 质押，准确率 -5
9. 发布者领取累积手续费收益
```

### 信号结构

每条信号包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| signalId | bytes32 | 唯一标识符 |
| poolId | bytes32 | 目标池 |
| riskScore | uint256 | 市场风险评估（0-100） |
| alphaScore | uint256 | Alpha 机会评分（0-100） |
| liquidityScore | uint256 | 流动性健康度（0-100） |
| volatilityScore | uint256 | 波动率（0-100） |
| recommendedFee | uint24 | 发布者建议的费率（bps） |
| expiresAt | uint64 | 信号过期时间戳 |
| signer | address | 发布者地址 |

### 动态费率计算

```
如果信号的 recommendedFee 在 [defaultFee, maxFee] 区间内：
  fee = recommendedFee

否则：
  fee = defaultFee + (maxFee - defaultFee) × riskScore / 100
```

示例：defaultFee=3000, maxFee=10000, riskScore=42
→ fee = 3000 + 7000 × 42/100 = 5940 bps

### 信号验证

信号过期后，任何人都可以触发验证：

1. 比较 `priceAtPublish`（信号发布时的 slot0）与 `priceAtExpiry`（验证时的 slot0）
2. 如果 `alphaScore > 50` → 发布者预测价格上涨
3. 如果实际价格显著下跌 → 信号错误 → 罚没
4. 如果预测与现实一致 → 准确率上升

### 池策略

每个池有可配置参数：

| 参数 | 说明 | 范围 |
|------|------|------|
| maxRiskScore | 信号风险超过此值则阻断 swap | 0-100 |
| minLiquidityScore | 流动性低于此值则阻断 | 0-100 |
| defaultFee | 风险为 0 时的基准费率 | bps |
| maxFee | 风险为 100 时的最大费率 | bps |
| publisherShareBps | 发布者从 swap 输出中分润比例 | 0-5000（0-50%） |
| blockHighRiskTrades | 是否回退高风险 swap | bool |
| allowSwapWhenSignalExpired | 没有活跃信号时是否允许 swap | bool |

---

## Aurex Advisor

### 概述

一个自托管的 AI 交易应用。用户在本地部署——自己的密钥、自己的数据、自己的 AI。Advisor 同时提供 MCP 接口（给 AI 客户端）和 HTTP API（给 Web Dashboard）。不需要单独的后端服务。

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Claude Code  │  │ Cursor       │  │ Windsurf     │  │ Cline        │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │                 │
┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐
│ Continue.dev │  │ Zed Editor   │  │ Claude App   │  │ OpenClaw     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       └──────────────────┴──────────────────┴──────────────────┘
                                  │
                                  ▼
              ┌───────────────────────────────────────────────┐
              │  Aurex Advisor (MCP Server)                   │
              │  用户自托管                                    │
              │                                               │
              │  自动拉取信号 + 数据                           │
              │  算法信号评分                                  │
              │  AI 结构化上下文                              │
              │  行为风险监控                                  │
              │  钱包执行                                     │
              │  服务 Dashboard 的 HTTP API                   │
              └───────────────────┬───────────────────────────┘
                                  │
                                  ▼
              ┌───────────────────────────────────────────────┐
              │  Aurex 信号协议（链上）                        │
              └───────────────────────────────────────────────┘
```

### 支持的 AI 客户端

Aurex Advisor 通过 MCP（Model Context Protocol）支持 **9+ AI 助手**：

| 客户端 | 类型 | 传输 | 说明 |
|--------|------|------|------|
| **Claude Code** | CLI | stdio | Anthropic 官方 Claude CLI |
| **Cursor** | IDE | stdio | AI 优先的代码编辑器 |
| **Windsurf** | IDE | stdio | Codeium 的 AI IDE |
| **Cline** | 扩展 | stdio | VSCode AI 助手 |
| **Continue.dev** | 扩展 | stdio | 开源 AI 代码助手 |
| **Zed** | 编辑器 | stdio | 高性能代码编辑器 |
| **Claude Desktop** | 应用 | stdio | Claude 桌面应用 |
| **OpenClaw** | 平台 | http | 带插件的 AI Agent 平台 |
| **Hermes AI** | 平台 | sse | 支持 SSE 的 AI 助手 |

**配置方式**：在 Web Dashboard 的 Advisor 页面获取你偏好的 AI 客户端专属配置。

### MCP 工具

| 工具 | 说明 |
|------|------|
| `advisor.market_status` | 当前市场概览 + 活跃信号 + 风险状态 |
| `advisor.get_strategy` | 结构化市场上下文 + 算法分析，供 AI 客户端推理 |
| `advisor.execute` | 通过钱包确认并执行策略 |
| `advisor.risk_check` | 仓位风险分析 + 行为指标状态 |
| `advisor.behavior_alert` | 当前行为异常警告 |
| `advisor.publish_signal` | 手动触发信号发布 |
| `advisor.configure` | 设置风险偏好、行为阈值 |
| `advisor.publisher_stats` | 发布准确率 + 收益统计 |

### 行为风险指标

监控交易模式并对冲动决策发出警告：

| 指标 | 告警条件 |
|------|---------|
| 日交易频率 | > 30 天均值的 3 倍 |
| 单笔交易规模 | > 历史最大值的 1.5 倍 |
| 仓位集中度 | 突然单一资产占比 >80% |
| 连续同向交易 | 超过历史最长连击 |
| 日累计亏损 | > 配置的仓位百分比 |

警告**不会阻断执行**。它们通过接入的 AI 客户端推送警告，并要求显式确认。

### 策略生成

Advisor 采用灵活的 action set——没有写死的逻辑。AI 客户端的 LLM（OpenClaw、Cursor、Claude 等）调用 `advisor.get_strategy` 接收结构化市场上下文，然后自由推理生成个性化策略。Advisor 自身不运行 LLM——它提供算法信号评分和结构化数据；智能层在用户接入的 AI 客户端里。

可用 action 类别：
- **交易**：swap、limitSwap、splitSwap
- **流动性**：addLiquidity、removeLiquidity、migrateLiquidity
- **等待**：wait、waitForFee、waitForSignal
- **风险**：setAlert、stopLoss、hedge、diversify
- **信息**：explain、compare、simulate、followPublisher
- **收益**：claimFees、becomePublisher、increaseStake

每条建议都包含：推理链、置信度、模拟（执行前后仓位）、至少一种带 tradeoff 解释的替代策略。

完整 action schema：[`docs/ADVISOR_ACTIONS.md`](./docs/ADVISOR_ACTIONS.md)

### OnchainOS Agentic Wallet 签名器

Advisor 可以通过 OKX OnchainOS Agentic Wallet 发布信号和提交合约调用。在该模式下，私钥的生成、托管和签名都在 OnchainOS 的 TEE 钱包内部完成，不再依赖 `AUREX_PRIVATE_KEY`。

```bash
cd apps/advisor
cp .env.example .env

# 先安装并登录 OnchainOS CLI：
curl -sSL https://raw.githubusercontent.com/okx/onchainos-skills/main/install.sh | sh
onchainos wallet login

# 然后设置：
AUREX_SIGNER_PROVIDER=onchainos
AUREX_ONCHAINOS_CHAIN=196
# 可选；如不希望 Advisor 自动从 `onchainos wallet balance` 解析：
AUREX_ONCHAINOS_ADDRESS=0x...
```

当 `AUREX_SIGNER_PROVIDER=onchainos` 时，Advisor 在本地编码 Aurex 合约调用，运行 OnchainOS 交易安全扫描，然后调用 `onchainos wallet contract-call` 进行 TEE 签名与广播。除非运营方已明确接受无人值守发布的确认策略，否则请保持 `AUREX_ONCHAINOS_AUTO_CONFIRM=false`。

### 与 OKX ExchangeOS 深度集成

Aurex 的设计目标是与 **OKX ExchangeOS** 生态原生集成——不作为独立孤岛，而是作为 OnchainOS agent + 钱包栈的一等公民：

| ExchangeOS 能力 | Aurex 的使用方式 |
|----------------|-----------------|
| **OnchainOS Agentic Wallet** | 发布信号、领取收益、执行 swap 的 TEE 签名器。私钥从不触碰用户磁盘。 |
| **交易安全扫描** | 每个 Aurex 合约调用在签名前都经过 `onchainos security tx-scan`——拦截钓鱼、恶意授权和危险 calldata。 |
| **OKX DEX 聚合器** | 未来：把 Hook 池 swap 路由到 OKX DEX，在 X Layer DEX 间获得最佳执行价。 |
| **OKX 钱包 Portfolio** | 未来：从 OKX OnchainOS 拉取用户余额 + DeFi 仓位到 Advisor 的 `risk_check`，做完整画像分析。 |
| **OKX X Layer** | 原生部署链——协议合约已在链 196 上线。 |
| **OKX Skills 系统** | Aurex Advisor 把自己暴露成 MCP 工具服务器，可以被任何 OKX OnchainOS skill 或 agent 调用。 |

**为什么这很重要：** ExchangeOS 提供安全的执行底座（TEE 钱包 + 安全扫描 + 聚合流动性）。Aurex 在其上提供智能层（信号市场 + 行为监控 + AI 策略生成）。两者结合让用户获得完全 AI 原生的交易体验，密钥从不暴露、数据从不泄漏、不用信任任何中心化服务。

**路线图：**
- [x] 第 1 阶段：通过 OnchainOS Agentic Wallet 的 TEE 签名
- [x] 第 2 阶段：交易安全扫描集成
- [ ] 第 3 阶段：非 Hook 池的 OKX DEX swap 路由
- [ ] 第 4 阶段：注册 OnchainOS skill，让其他 OKX agent 可以调用 Aurex 工具
- [ ] 第 5 阶段：通过 OKX 跨链桥聚合器的跨链信号发布

---

## 第三方 Agent 接入

协议是开放的。任何 AI agent 都可以通过 MCP 或 SDK 接入：

```typescript
import { AurexSDK } from "@aurex/sdk";

const aurex = new AurexSDK({ rpcUrl, privateKey });

// 注册为发布者
await aurex.publisher.register(stakeAmount);

// 发布信号
await aurex.signals.publish({
  poolId,
  riskScore: 42,
  alphaScore: 81,
  liquidityScore: 70,
  volatilityScore: 30,
  recommendedFee: 5000,
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
});

// 领取收益
await aurex.publisher.claimRevenue(tokenAddress);
```

| | Aurex Advisor | 第三方 Agent |
|--|--------------|--------------|
| 配置 | 开箱即用 | 手动 MCP/SDK 配置 |
| 拉取信号 | 自动 | 手动 API 调用 |
| 推送信号 | 自动 | 手动 API 调用 |
| 行为指标 | 内置 | 不包含 |
| 通知 | 内置（通过 AI 客户端） | 自行实现 |
| 钱包执行 | 内置 | 自行实现 |

---

## 项目结构

```
aurex/
  apps/
    advisor/          —— Aurex Advisor（自托管 MCP Server）
    web/              —— Web dashboard（可选）

  contracts/
    src/
      hooks/          —— AurexAlphaHook.sol（动态费率 + 收益分润）
      registry/       —— AurexSignalRegistry.sol（发布者生命周期 + 信号）
      policy/         —— AurexPolicyManager.sol（池策略配置）
      factory/        —— AurexPoolFactory.sol（无许可池创建）
      tokens/         —— MockAUREX.sol、MockUSDC.sol
      interfaces/     —— IAurexSignalRegistry.sol、IAurexPolicyManager.sol
      libraries/      —— AurexTypes.sol、FeeMath.sol
    test/
    script/
    deployments/

  packages/
    aurex-sdk/        —— 合约交互的 TypeScript SDK
    shared-types/     —— 共享 TypeScript 类型

  plugins/
    openclaw/         —— OpenClaw 插件适配器
    cursor/           —— Cursor 插件适配器
    hermes/           —— Hermes 插件适配器

  docs/
    AUREX_ARCHITECTURE_WHITEPAPER.md
    ROADMAP.md
    ADVISOR_ACTIONS.md
    DESIGN_DECISIONS.md
```

---

## 开发

### 前置依赖

- Node.js 20+
- pnpm 9+
- Foundry（forge、cast、anvil）

### 编译合约

```bash
cd contracts
forge build
```

### 运行测试

```bash
cd contracts
forge test
```

34 个测试覆盖：
- 发布者注册、注销、冷却期
- 信号发布、过期、验证
- 罚没机制（预测错误 → 10% 质押罚没）
- 发布者白名单强制执行
- 动态费率计算（低风险、高风险、推荐费率）
- 收益分润（记入发布者、无信号时为零、shareBps=0 时为零）
- 策略 CRUD、版本追踪、权限
- PoolFactory 无许可创建

### 部署

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url $XLAYER_RPC --broadcast
```

---

## 已上线交易池（X Layer 主网）

| 池 | Token0 | Token1 | 活跃信号 |
|----|--------|--------|---------|
| WETH/USDC | WETH | USDC | riskScore=42, alphaScore=81 |
| USDC/WBTC | USDC | WBTC | riskScore=28, alphaScore=55 |
| USDT/WETH | USDT | WETH | riskScore=72, alphaScore=35 |
| USDC/WOKB | USDC | WOKB | riskScore=30, alphaScore=78 |

---

## 文档

- [架构白皮书](./docs/AUREX_ARCHITECTURE_WHITEPAPER.md) —— 完整协议 + Advisor 规范
- [开发路线图](./docs/ROADMAP.md) —— 阶段定义和优先级矩阵
- [Advisor Action 集](./docs/ADVISOR_ACTIONS.md) —— 完整 action schema 和上下文格式
- [设计决策](./docs/DESIGN_DECISIONS.md) —— 留待后续阶段的未决事项

---

## 安全模型

**经济安全：**
- 最低质押（100 AUREX）防止垃圾信号
- 每条错误信号 10% 罚没让操纵代价昂贵
- 准确率公开且链上不可变

**合约安全：**
- 信号过期时 Hook 安全失败（使用 defaultFee）
- 动态费率以 policy.maxFee 为上限
- publisherShareBps 上限 50%
- Hook 执行中无无界循环

**Advisor 安全：**
- 自托管：用户密钥从不离开本机
- 没有中心化服务能访问用户钱包
- 行为历史仅存储在本地 SQLite
- 用户必须确认每一次执行（没有用户同意就不会自动执行）

---

## 许可

MIT
