import Decimal from 'decimal.js';

// Configure Decimal.js for precise financial math
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });

export interface ArbitrageParams {
  buyAskPrice: number;     // Price to buy the asset (market order on Exchange A)
  sellBidPrice: number;    // Price to sell the asset (market order on Exchange B)
  tradeAmount: number;     // Amount of base asset to trade
  buyTakerFeePct: number;  // Taker fee % on Exchange A (e.g., 0.1 for 0.1%)
  sellTakerFeePct: number; // Taker fee % on Exchange B
  withdrawalFee: number;   // Absolute withdrawal fee in base asset or quote asset?
  // Let's assume withdrawal fee is always in the base asset for simplicity (e.g. BTC withdrawal fee)
  // or it could be quote asset (e.g., USDT). We will handle both cases if needed, but standard is base asset.
  isWithdrawalInBase: boolean; 
}

export interface ArbitrageResult {
  grossSpread: number;        // Percentage
  grossProfitQuote: number;   // Absolute profit in quote asset
  buyFeeQuote: number;
  sellFeeQuote: number;
  withdrawalFeeQuote: number;
  netProfitQuote: number;
  netProfitPct: number;       // Percentage return on capital
  isProfitable: boolean;
}

export class ArbitrageCalculator {
  static calculate(params: ArbitrageParams): ArbitrageResult {
    const amount = new Decimal(params.tradeAmount);
    const buyPrice = new Decimal(params.buyAskPrice);
    const sellPrice = new Decimal(params.sellBidPrice);

    // Initial investment in quote asset
    const investmentQuote = amount.mul(buyPrice);

    // Gross proceeds from selling
    const sellProceedsQuote = amount.mul(sellPrice);

    // Spread
    const grossProfitQuote = sellProceedsQuote.sub(investmentQuote);
    const grossSpread = grossProfitQuote.div(investmentQuote).mul(100);

    // Fees
    // Taker fee on buy is typically charged in base asset or quote asset.
    // If charged in base, we receive less base, meaning we can sell less.
    // For simplicity and standard comparison, we calculate the equivalent quote value of fees.
    const buyFeePct = new Decimal(params.buyTakerFeePct).div(100);
    const buyFeeQuote = investmentQuote.mul(buyFeePct);

    const sellFeePct = new Decimal(params.sellTakerFeePct).div(100);
    const sellFeeQuote = sellProceedsQuote.mul(sellFeePct);

    // Withdrawal fee
    const withdrawalFeeDec = new Decimal(params.withdrawalFee);
    const withdrawalFeeQuote = params.isWithdrawalInBase
      ? withdrawalFeeDec.mul(buyPrice) // approximate cost to replenish or value lost
      : withdrawalFeeDec;

    // True Net Profit
    const totalFees = buyFeeQuote.plus(sellFeeQuote).plus(withdrawalFeeQuote);
    const netProfitQuote = grossProfitQuote.sub(totalFees);
    const netProfitPct = netProfitQuote.div(investmentQuote).mul(100);

    return {
      grossSpread: grossSpread.toNumber(),
      grossProfitQuote: grossProfitQuote.toNumber(),
      buyFeeQuote: buyFeeQuote.toNumber(),
      sellFeeQuote: sellFeeQuote.toNumber(),
      withdrawalFeeQuote: withdrawalFeeQuote.toNumber(),
      netProfitQuote: netProfitQuote.toNumber(),
      netProfitPct: netProfitPct.toNumber(),
      isProfitable: netProfitQuote.greaterThan(0),
    };
  }
}
