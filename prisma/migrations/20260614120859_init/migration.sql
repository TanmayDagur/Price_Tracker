-- CreateTable
CREATE TABLE "Exchange" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradingPair" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingPair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeTier" (
    "id" TEXT NOT NULL,
    "exchangeId" TEXT NOT NULL,
    "tierName" TEXT NOT NULL,
    "makerFee" DOUBLE PRECISION NOT NULL,
    "takerFee" DOUBLE PRECISION NOT NULL,
    "minVolume" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Network" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Network_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalFee" (
    "id" TEXT NOT NULL,
    "exchangeId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "minWithdrawal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivePrice" (
    "id" TEXT NOT NULL,
    "exchangeId" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "bidPrice" DOUBLE PRECISION NOT NULL,
    "askPrice" DOUBLE PRECISION NOT NULL,
    "bidQty" DOUBLE PRECISION NOT NULL,
    "askQty" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LivePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArbitrageSnapshot" (
    "id" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "buyExchangeId" TEXT NOT NULL,
    "sellExchangeId" TEXT NOT NULL,
    "grossSpread" DOUBLE PRECISION NOT NULL,
    "netProfit" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArbitrageSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exchange_name_key" ON "Exchange"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Exchange_slug_key" ON "Exchange"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TradingPair_symbol_key" ON "TradingPair"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "FeeTier_exchangeId_tierName_key" ON "FeeTier"("exchangeId", "tierName");

-- CreateIndex
CREATE UNIQUE INDEX "Network_slug_key" ON "Network"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalFee_exchangeId_networkId_asset_key" ON "WithdrawalFee"("exchangeId", "networkId", "asset");

-- CreateIndex
CREATE UNIQUE INDEX "LivePrice_exchangeId_pairId_key" ON "LivePrice"("exchangeId", "pairId");

-- AddForeignKey
ALTER TABLE "FeeTier" ADD CONSTRAINT "FeeTier_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalFee" ADD CONSTRAINT "WithdrawalFee_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalFee" ADD CONSTRAINT "WithdrawalFee_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePrice" ADD CONSTRAINT "LivePrice_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivePrice" ADD CONSTRAINT "LivePrice_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "TradingPair"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArbitrageSnapshot" ADD CONSTRAINT "ArbitrageSnapshot_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "TradingPair"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArbitrageSnapshot" ADD CONSTRAINT "ArbitrageSnapshot_buyExchangeId_fkey" FOREIGN KEY ("buyExchangeId") REFERENCES "Exchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArbitrageSnapshot" ADD CONSTRAINT "ArbitrageSnapshot_sellExchangeId_fkey" FOREIGN KEY ("sellExchangeId") REFERENCES "Exchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;
