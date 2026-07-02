export const siteContent = {
  navigation: {
    logo: "Yumo Yumo",
    menu: [
      { label: "Technical Paper", href: "#serious-paper" },
      { label: "Roadmap", href: "#roadmap" },
      { label: "Tokenomics", href: "#tokenomics" },
    ],
    buttons: {
      login: "Log in",
      connectWallet: "Connect Wallet",
    },
  },
  footer: {
    socials: [
      { name: "X (Twitter)", url: "https://twitter.com/yumoyumo", icon: "x" },
      { name: "Telegram", url: "https://t.me/yumoyumo", icon: "telegram" },
      { name: "Discord", url: "https://discord.gg/yumoyumo", icon: "discord" },
      { name: "TikTok", url: "https://tiktok.com/@yumoyumo", icon: "tiktok" },
    ],
    copyright: "© 2025 Yumo Yumo. All rights reserved.",
  },
  hero: {
    title: "Feed the Yumbie.",
    subtitle: "Build your financial operating system.",
    description: "Receipts, routines, and price memory in one living system.",
    cta: "Upload Receipt",
  },
  about: {
    title: "About Yumo Yumo",
    description:
      "A personal financial operating system built on Proof of Expense. Upload receipts, build price memory, and create contribution records inside Yumo.",
  },
  roadmap: [
    {
      quarter: "Q1",
      title: "Journey Begins",
      status: "completed",
      items: ["Smart contracts deployed", "First Proof of Expense flows go live"],
    },
    {
      quarter: "Q2",
      title: "Party Time!",
      status: "in-progress",
      items: ["Free NFTs for early users", "Staking is coming"],
    },
    {
      quarter: "Q3",
      title: "Yumos Get Smarter",
      status: "upcoming",
      items: ["More countries on board", "New partnerships"],
    },
    {
      quarter: "Q4",
      title: "Global Expansion",
      status: "upcoming",
      items: ["Local merchant deals", "NFT marketplace opens"],
    },
  ],
  tokenomics: {
    title: "Token Distribution",
    subtitle: "How INT is shared",
    totalSupply: "Total supply: 99B $INT — designed for Proof of Expense, staking, and long-term contribution",
    distribution: [
      {
        percentage: "65%",
        label: "User Rewards (Proof of Expense)",
        description: "Primary pool for verified receipt contribution and PoE participation",
      },
      {
        percentage: "10%",
        label: "Proof of Contribution",
        description: "Published contribution rail used by the core team and outside contributors",
      },
      {
        percentage: "10%",
        label: "Staking & Long-term Incentives",
        description: "Rewards for long-term holders and stakers",
      },
      {
        percentage: "5%",
        label: "Liquidity",
        description: "Supports healthy on-chain markets and price discovery",
      },
      {
        percentage: "5%",
        label: "Airdrops & Community Quests",
        description: "Milestone campaigns and community distributions",
      },
      {
        percentage: "5%",
        label: "Referral Rewards",
        description: "Unlocks tied to verification milestones and referred activity",
      },
    ],
  },
  papers: {
    funPaper: {
      title: "Fun Paper",
      description: "The playful side of Yumo Yumo — a lighter guide to the Financial OS",
      url: "/funpaper",
    },
    seriousPaper: {
      title: "Technical Paper",
      description: "Technical paper — receipt pipeline, trust layer, data model, and token mechanics",
      url: "/technical-paper",
    },
  },
}
