# 匿名化汇总与 B2B 资料产品

## 5.8 匿名化汇总与 B2B 资料产品

此界面用于形成 B2B 资料产品。资料发布受本节所定义的匿名化与存取控制约束。

### 转换规则

从 `receipts + line_items + price_observations` 转换为匿名化汇总是一个**单向、破坏性**的转换：

1. **取代 user_id 与 wallet_address。** 使用与使用者识别码分离的工作阶段范围杂凑。
2. **粗化地理资讯。** 仅限城市级粒度；座标若曾记录则予以舍弃。
3. **粗化时间。** 高频指数使用每日分桶；类别层级报告使用每周分桶；人口统计群组使用每月分桶。
4. **强制执行 k-匿名性。** 每笔发布的记录必须属于准识别栏位（`city`、`merchant_class`、`time_bucket`、`category_path`）上至少具有合约定义最小数量不同贡献者的储存格。低于门槛的储存格被抑制或粗化直至通过。
5. **为计数型输出添加校准的差分隐私杂讯。**
6. **从已验证的 PoE 建立汇总范围。** 订单页面收据与其他待验证记录保留于记忆层。

### 可用产品

| 产品 | 粒度 | 更新频率 | 指示性价格 |
|---|---|---|---|
| **TR 通膨脉冲** | 类别 × 区域 × 周 | 每日 | $X / 月（订阅） |
| **购物篮面板** | 标准商品 × 城市 × 周 | 每日 | $Y / 月 |
| **商家基准** | 连锁 × 类别 × 月 | 每周 | $Z / 月 |
| **自订群组查询** | API 每次查询，强制执行 k-匿名性门槛 | 随选 | $Q / 查询 |

价格与确切粒度为占位符；生产型录将于商业发布前定稿。

### B2B 回应范例

```json
// GET /b2b/v1/inflation-pulse?region=istanbul&category=food.dairy&from=2026-05-01&to=2026-05-17
{
  "region": "istanbul",
  "category": "food.dairy",
  "series": [
    { "week_start": "2026-05-04", "index": 100.0, "n_observations": "<n>", "n_distinct_contributors": "<n>" },
    { "week_start": "2026-05-11", "index": 101.7, "n_observations": "<n>", "n_distinct_contributors": "<n>" }
  ],
  "k_anonymity_floor_met": true,
  "methodology_version": "1.0.0"
}
```

每个 B2B 回应携带 `n_distinct_contributors`，使买方能审计 k-匿名性底线是否已达成。低于底线的储存格以 `suppressed: true` 回传，不含数值。具体门槛值由内部营运层管理。

### 超出范围的栏位

- 任何绑定至单一使用者的栏位。
- 任何低于所查询储存格 k-匿名性门槛的记录。
- 座标、地址、电话号码。
- 付款工具中继资料。
- 跨查询可连结的匿名化 ID（每次查询滚动新的工作阶段杂凑）。

---
