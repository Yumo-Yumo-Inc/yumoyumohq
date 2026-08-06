# B2B API（计划中）

## 5.11 B2B API（计划中）

B2B 资料产品的 API 是 **计划中的未来工作**；目前没有 B2B 端点上线。B2B 相关资料目前通过公开价格分类帐（5.10）及其 Arweave 资讯清单到达外部世界。

计划表面的设计概要 —— 单独的基础路径、单独的凭证、与公开 API 分离的配额：

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/inflation-pulse` | 通膨脉冲数列 |
| GET | `/basket-panel` | 购物篮面板查询 |
| GET | `/merchant-benchmarks` | 商家基准 |
| POST | `/cohort-query` | 自订群组，强制执行 k-底线 |
| GET | `/catalog` | 可用产品 + 新鲜度 + 定价 |
| GET | `/methodology/{version}` | 特定版本的方法论文件 |

计划认证：具重播保护的请求签名的 API 密钥；签署方案与重播视窗保留在内部营运层。

每个计划 B2B 回应包含 `methodology_version`、k-匿名性底线指示符与回应的贡献者数量，使买方的合规团队能审计发布内容。

---
