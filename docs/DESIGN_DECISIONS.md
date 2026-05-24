# Aurex 待定设计决策

记录已讨论但尚未确定的设计方向，供后续决策参考。

---

## 1. AUREX 代币 Utility 扩展

**当前状态：** AUREX 仅作为 Publisher 质押保证金，utility 单薄。质押后不再产生持续买压。

**讨论过的方向：**

| 方向 | 机制 | 优点 | 缺点 |
|------|------|------|------|
| Governance | 持有 AUREX 投票决定协议参数（minStake, slashPercent, publisherShareBps） | 去中心化治理，持续持有动机 | 治理攻击风险，小持有者无动力参与 |
| 信号权重 | 质押量影响信号在 Hook 中的优先级/权重 | 激励持续增持，skin in the game | 富者越富，新 publisher 难以竞争 |
| 池子创建质押 | 创建 Pool 也需要锁定 AUREX | 增加代币需求 | 提高创建门槛，与 permissionless 理念冲突 |
| Advisor 付费 | 使用 Advisor 服务消耗 AUREX | 直接 utility | 增加用户摩擦，可能降低使用率 |
| Fee share 以 AUREX 结算 | Publisher 收入强制转换为 AUREX | 强制买压 | 增加摩擦，publisher 可能不愿意 |

**待决定：** 选择 1-2 个方向实施，需要平衡代币需求 vs 用户体验。

---

## 2. 信誉层设计

**当前状态：** 链上只有 `accuracyScore`（0-100）、`signalCount`、`slashCount`。过于粗糙。

**讨论过的维度：**

| 维度 | 计算方式 | 解决的问题 |
|------|---------|-----------|
| 信号量加权准确率 | accuracy * log(signalCount) | 防止只发一次蒙对就高分 |
| 时间衰减 | 近 30 天表现权重 > 历史 | 过去准不代表现在准 |
| 领域专精 | 按 pool/token pair 分别计算准确率 | ETH 专家不一定懂 BTC |
| 收益验证 | 统计使用该 publisher 信号的池子产生的 fee revenue | 市场用脚投票 |
| 质押信心比 | stakeAmount * accuracyScore | 高质押 + 高准确 = 真信心 |
| 存活时间 | registeredAt 到现在的持续活跃天数 | 长期稳定 vs 短期运气 |

**架构选择（未确定）：**

- **链上计算** — 每次 verifySignal 时合约自动更新综合 reputation score。优点：去中心化、无需信任。缺点：gas 成本、逻辑难改。
- **链下聚合** — 合约存原始数据，API 读取后计算综合分。优点：灵活、可迭代。缺点：需要信任 API。
- **混合方案** — 核心数据链上（已有），复杂聚合链下。最可能的选择。

---

## 3. 策略分享机制

**当前状态：** Publisher 的信号历史隐式构成其"策略记录"，但没有显式的策略分享功能。

**讨论过的方向：**

| 方向 | 描述 | 复杂度 |
|------|------|--------|
| Signal History as Strategy | Publisher 的信号序列本身就是策略，通过 Advisor 的 `followPublisher` 间接跟随 | 低（已有基础） |
| Strategy Template | 用户把一组 Advisor actions 打包为可分享模板（如 "ETH 跌 5% 时 swap 30% 到 USDT"） | 中 |
| Trade History Feed | 聚合某地址的链上 swap 记录，展示为策略绩效 | 中 |
| Copy Trading | 自动跟随某 publisher 的信号执行交易 | 高（涉及自动执行、授权） |

**待决定：** 先做哪一层。Signal History 已经有了，Strategy Template 是最自然的下一步。

---

## 决策时间线

这些决策不急于在合约层确定。建议：
- Phase 3（API）开发时确定信誉层的链下计算逻辑
- Phase 4（Frontend）开发时确定策略分享的 UI 形态
- Phase 6（Agent SDK）开发时确定代币 utility 扩展（因为会影响 SDK 接口）
