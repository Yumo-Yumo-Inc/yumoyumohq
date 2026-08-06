# API 表面

## 5.10 API 表面

### 当前：应用程式路由

实时 API 是应用程式自身的路由表面：**位于 `yumoyumo.com` 上的 `/api/*` 下的工作阶段验证路由**，由与产品相同的 Next.js 部署提供。认证是使用者的工作阶段；目前没有单独的开发者凭证。

| 方法 | 路径 | 用途 | 认证 |
|---|---|---|---|
| POST | `/api/receipt/upload` | 上传收据图像 | 工作阶段 |
| POST | `/api/receipt/analyze` | 在上传上运行管线 | 工作阶段 |
| GET  | `/api/receipts` | 列出使用者的收据 | 工作阶段（仅限自身） |
| GET  | `/api/receipts/{id}` | 读取收据记录 | 工作阶段（仅限自身） |
| GET  | `/api/wallet/summary` | 点数余额与历史 | 工作阶段 |
| GET  | `/api/prices/epoch/{epoch}` | 公开价格 epoch 资料：epoch 元资料、观测页面与 Merkle 纳入证明（`?proof=<leaf_hash>`） | 公开 |
| GET  | `/api/prices/product/{productId}` | 目录商品的公开价格历史 | 公开 |

价格分类帐路由是现今的公开读取表面：任何人都可以获取密封的 epoch、拉取其观测，并请求一份包含到链上根的纳入证明。已发布的 Arweave 资讯清单独立于这些路由提供相同资料。

### 计划中：版本化公开 REST API

第三方应用程式的版本化公开 REST API 是 **计划中的未来工作**。设计概要：`yumoyumo.com` 上的 `/v1` 基础、第三方客户端的标准委托授权、资源风格的收据与奖励端点，以及状态变更的事件订阅（收据已验证、奖励已记帐、epoch 已密封）。具体表面将在开发者计划开放时指定；上述应用程式路由是在此之前的契约。

---
