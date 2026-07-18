---
title: "How to Calculate Real Crypto Arbitrage Profits (Including Hidden Fees)"
description: "A step-by-step guide to calculating true net profit from cross-exchange crypto arbitrage, including maker/taker fees, withdrawal costs, and slippage."
date: "2026-07-14"
author: "Net-Cost Arbitrage Team"
tags: ["Arbitrage", "Fee Calculation", "Trading", "Tutorial"]
---

Most beginner arbitrage traders make the same mistake: they look at the price difference between two exchanges and assume that is their profit. In reality, hidden fees can turn a seemingly profitable trade into a loss. Here is how to calculate your **real** net profit.

## Step 1: Identify the Gross Spread

The gross spread is the raw price difference. For example:

- BTC on Binance: $67,450 (ask price — what you pay to buy)
- BTC on Kraken: $67,620 (bid price — what you receive when selling)
- **Gross spread:** $170 or approximately 0.25%

This looks great on paper. But we are not done.

## Step 2: Subtract Trading Fees

Every exchange charges a fee when you execute a trade. These are typically split into:

- **Maker fees:** When you place a limit order (cheaper, usually 0.01%–0.1%)
- **Taker fees:** When you place a market order (more expensive, usually 0.05%–0.1%)

For arbitrage, you usually need market orders for speed, so assume taker fees on both sides:

- Binance taker fee: 0.1% of $67,450 = **$67.45**
- Kraken taker fee: 0.26% of $67,620 = **$175.81**
- **Total trading fees: $243.26**

Our $170 gross spread is now **-$73.26** — a loss! This is why fee awareness is critical.

## Step 3: Factor in Withdrawal Fees

To move BTC from Binance to Kraken, you pay a withdrawal fee. On the Bitcoin network, this is typically 0.0001–0.0005 BTC (approximately $6.75–$33.75).

Even using the cheapest option: **$6.75 additional cost.**

## Step 4: Consider Slippage

If you are trading larger amounts, the order book might not have enough liquidity at the quoted price. A $50,000 market buy could push the price up by 0.02–0.05%, adding another **$10–$25** in hidden cost.

## The Net-Cost Formula

**Net Profit = Gross Spread − Buy Fee − Sell Fee − Withdrawal Fee − Slippage**

For our example:
$170 − $67.45 − $175.81 − $6.75 − $10 = **-$90.01**

This trade would be a loss. Our [Net-Cost Arbitrage Calculator](/) does this math for you in real-time across all major exchanges.

## How to Actually Make It Profitable

- **Use exchanges with lower fees:** Compare taker fees on our [Exchange Comparison](/compare) page
- **Hold native tokens:** BNB on Binance gives you a 25% fee discount
- **Trade larger volumes:** Fees are percentage-based, but withdrawal fees are flat — bigger trades dilute the fixed cost
- **Pick altcoins with wider spreads:** SOL, XRP, and DOGE often have 0.3–0.5% spreads vs BTC's 0.1–0.2%
- **Use cheap withdrawal networks:** TRC-20 and Solana cost under $1 vs Ethereum's $5+

## Key Takeaway

Never evaluate an arbitrage opportunity by the gross spread alone. Always calculate the full net cost. Use our [live arbitrage scanner](/arbitrage) to see which pairs are **genuinely profitable** after all fees are deducted.
