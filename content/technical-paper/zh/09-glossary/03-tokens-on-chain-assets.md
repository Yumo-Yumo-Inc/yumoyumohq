# 代币与链上资产

## 代币与链上资产

- **INT** — Yumo Yumo 的可转移功能性代币，于 Solana 上以 SPL 代币发行（小数位数 = 6，总供应量 = 99,000,000,000）。*见：04 代币经济学机制。*
- **bINT** — 用于记录使用者已验证贡献的链下帐务额度。符合条件的余额会在 epoch 结算时，按固定 1:1 比率形成 INT 领取权。*见：04 代币经济学机制。*
- **Proof-of-expense SBT（支出证明 SBT）** — 每个帐号仅铸造一次、发送至使用者钱包的 Token-2022 NonTransferable 代币，标记该帐号为已验证的支出贡献者。*见：04 代币经济学机制、06 可验证发布。*
- **SPL Token** — Solana Program Library 代币标准。Solana 的「ERC-20」。INT 使用此标准。
- **Token-2022** — Solana 的扩充功能代币标准。支出证明 SBT 使用 NonTransferable 扩充功能。
- **Soulbound（灵魂绑定）** — 代币行为于资产生命周期中绑定至单一钱包。
