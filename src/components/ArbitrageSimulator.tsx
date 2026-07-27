'use client';

import React, { useState, useMemo, useEffect } from 'react';

interface Pair {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

interface LivePrice {
  exchangeId: string;
  pairId: string;
  bidPrice: number;
  askPrice: number;
  exchange: {
    id: string;
    name: string;
    slug: string;
  };
  pair: {
    symbol: string;
  };
}

interface FeeTier {
  exchangeId: string;
  makerFee: number;
  takerFee: number;
}

interface WithdrawalFee {
  exchangeId: string;
  networkId: string;
  asset: string;
  fee: number;
  minWithdrawal: number;
  exchange: {
    name: string;
  };
  network: {
    name: string;
  };
}

interface Exchange {
  id: string;
  name: string;
  slug: string;
  url?: string;
  nativeToken?: string;
  nativeDiscountAvailable?: boolean;
  discountPercentage?: number;
}

interface ArbitrageSimulatorProps {
  pairs: Pair[];
  livePrices: LivePrice[];
  feeTiers: FeeTier[];
  withdrawalFees: WithdrawalFee[];
  exchanges: Exchange[];
}

export default function ArbitrageSimulator({
  pairs,
  livePrices,
  feeTiers,
  withdrawalFees,
  exchanges,
}: ArbitrageSimulatorProps) {
  const [capitalInput, setCapitalInput] = useState<string>('1000');
  const [selectedPair, setSelectedPair] = useState<string>('ALL');
  const [hideLosses, setHideLosses] = useState<boolean>(false);
  const [hideBelowMin, setHideBelowMin] = useState<boolean>(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Pagination / Lazy Loading state
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const observer = React.useRef<IntersectionObserver | null>(null);
  const lastElementRef = React.useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + 20);
      }
    });
    if (node) observer.current.observe(node);
  }, []);

  // Exchange discount toggles
  const [useNativeDiscounts, setUseNativeDiscounts] = useState<Record<string, boolean>>({});

  // States for custom pair creation
  const [showAddPair, setShowAddPair] = useState<boolean>(false);
  const [newBase, setNewBase] = useState<string>('');
  const [newQuote, setNewQuote] = useState<string>('USDT');
  const [isAddingPair, setIsAddingPair] = useState<boolean>(false);
  const [addPairError, setAddPairError] = useState<string | null>(null);

  // Client-side registered custom pairs & prices fetched on the fly
  const [clientPairs, setClientPairs] = useState<Pair[]>([]);
  const [customPrices, setCustomPrices] = useState<any[]>([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState<boolean>(false);

  const capital = useMemo(() => {
    const val = parseFloat(capitalInput);
    return isNaN(val) || val <= 0 ? 0 : val;
  }, [capitalInput]);

  // Combine static DB pairs with client-created custom pairs
  const allPairs = useMemo(() => {
    return [...pairs, ...clientPairs];
  }, [pairs, clientPairs]);

  // Combine static DB price ticks with dynamically fetched API prices
  const allPrices = useMemo(() => {
    return [...livePrices, ...customPrices];
  }, [livePrices, customPrices]);

  // Fetch prices for custom pairs dynamically if they don't exist in DB price ticks
  useEffect(() => {
    if (selectedPair === 'ALL') {
      setCustomPrices([]);
      return;
    }

    const hasDbPrices = livePrices.some((p) => p.pair.symbol === selectedPair);
    if (hasDbPrices) {
      setCustomPrices([]);
      return;
    }

    const fetchCustomPrices = async () => {
      setIsLoadingCustom(true);
      try {
        const res = await fetch(`/api/prices?symbol=${selectedPair}`);
        if (res.ok) {
          const data = await res.json();
          const targetPair = allPairs.find((p) => p.symbol === selectedPair);
          
          if (targetPair && data.prices) {
            const formatted = data.prices.map((p: any) => {
              const exchangeObj = exchanges.find((e) => e.slug === p.exchangeSlug) || {
                id: p.exchangeSlug,
                name: p.exchangeSlug.toUpperCase(),
                slug: p.exchangeSlug,
              };

              return {
                id: `${p.exchangeSlug}-${selectedPair}`,
                exchangeId: exchangeObj.id,
                pairId: targetPair.id,
                bidPrice: p.bidPrice,
                askPrice: p.askPrice,
                bidQty: 0,
                askQty: 0,
                exchange: exchangeObj,
                pair: targetPair,
              };
            });
            setCustomPrices(formatted);
          }
        }
      } catch (err) {
        console.error('Failed to fetch custom prices:', err);
      } finally {
        setIsLoadingCustom(false);
      }
    };

    fetchCustomPrices();
  }, [selectedPair, livePrices, allPairs, exchanges]);

  const opportunities = useMemo(() => {
    if (capital <= 0) return [];

    const ops: any[] = [];

    allPairs.forEach((pair) => {
      // Filter out if pair is selected
      if (selectedPair !== 'ALL' && pair.symbol !== selectedPair) return;

      const pairPrices = allPrices.filter((p) => p.pairId === pair.id);
      if (pairPrices.length < 2) return;

      pairPrices.forEach((buyPrice) => {
        pairPrices.forEach((sellPrice) => {
          if (buyPrice.exchangeId === sellPrice.exchangeId) return;

          const buyFeeTier = feeTiers.find((f) => f.exchangeId === buyPrice.exchangeId) || { takerFee: 0.1 };
          const sellFeeTier = feeTiers.find((f) => f.exchangeId === sellPrice.exchangeId) || { takerFee: 0.1 };

          let buyTakerFeePct = buyFeeTier.takerFee;
          let sellTakerFeePct = sellFeeTier.takerFee;

          const buyExchangeDetails = exchanges.find(e => e.id === buyPrice.exchangeId);
          const sellExchangeDetails = exchanges.find(e => e.id === sellPrice.exchangeId);

          if (buyExchangeDetails?.nativeDiscountAvailable && useNativeDiscounts[buyPrice.exchangeId]) {
            buyTakerFeePct = buyTakerFeePct * (1 - (buyExchangeDetails.discountPercentage! / 100));
          }

          if (sellExchangeDetails?.nativeDiscountAvailable && useNativeDiscounts[sellPrice.exchangeId]) {
            sellTakerFeePct = sellTakerFeePct * (1 - (sellExchangeDetails.discountPercentage! / 100));
          }

          const assetWithdrawalFees = withdrawalFees.filter(
            (w) => w.exchangeId === buyPrice.exchangeId && w.asset === pair.baseAsset
          );

          let cheapestNetworkFee = 0;
          let cheapestNetworkName = 'Default Network';
          let minWithdrawalAmount = 0;

          if (assetWithdrawalFees.length > 0) {
            const sortedWFs = [...assetWithdrawalFees].sort((a, b) => a.fee - b.fee);
            cheapestNetworkFee = sortedWFs[0].fee;
            cheapestNetworkName = sortedWFs[0].network.name;
            minWithdrawalAmount = sortedWFs[0].minWithdrawal;
          } else {
            // Smart fallback fee estimation for custom pairs (e.g. standard low flat fee)
            cheapestNetworkFee = 0.01;
            cheapestNetworkName = 'Estimate Network';
            minWithdrawalAmount = 0.02;
          }

          const buyPriceVal = buyPrice.askPrice;
          const sellPriceVal = sellPrice.bidPrice;

          // 1. Buy Leg
          const grossBaseBought = capital / buyPriceVal;
          const buyFeeUsdt = capital * (buyTakerFeePct / 100);
          const netBaseBought = (capital - buyFeeUsdt) / buyPriceVal;

          const meetsMinWithdrawal = netBaseBought >= minWithdrawalAmount;

          // 2. Withdrawal / Transfer Leg
          const netBaseArrived = netBaseBought - cheapestNetworkFee;
          const withdrawalFeeUsdt = cheapestNetworkFee * buyPriceVal;

          // 3. Sell Leg
          const grossSellUsdt = Math.max(0, netBaseArrived) * sellPriceVal;
          const sellFeeUsdt = grossSellUsdt * (sellTakerFeePct / 100);
          const netSellUsdt = Math.max(0, grossSellUsdt - sellFeeUsdt);

          // Profit metrics
          const grossSpread = ((sellPriceVal - buyPriceVal) / buyPriceVal) * 100;
          const netProfitUsdt = netBaseArrived <= 0 ? -capital : netSellUsdt - capital;
          const netProfitPct = (netProfitUsdt / capital) * 100;

          ops.push({
            id: `${buyPrice.exchangeId}-${sellPrice.exchangeId}-${pair.id}`,
            pair,
            buyExchange: buyExchangeDetails || buyPrice.exchange,
            sellExchange: sellExchangeDetails || sellPrice.exchange,
            buyPrice: buyPriceVal,
            sellPrice: sellPriceVal,
            buyTakerFeePct,
            sellTakerFeePct,
            buyFeeUsdt,
            sellFeeUsdt,
            withdrawalNetworkName: cheapestNetworkName,
            withdrawalFee: cheapestNetworkFee,
            withdrawalFeeUsdt,
            minWithdrawalAmount,
            meetsMinWithdrawal,
            grossSpread,
            netBaseBought,
            netBaseArrived,
            grossSellUsdt,
            netSellUsdt,
            netProfitUsdt,
            netProfitPct,
            isProfitable: netProfitUsdt > 0 && meetsMinWithdrawal,
          });
        });
      });
    });

    let filtered = ops;
    if (hideLosses) {
      filtered = filtered.filter((op) => op.isProfitable);
    }
    if (hideBelowMin) {
      filtered = filtered.filter((op) => op.meetsMinWithdrawal);
    }

    return filtered.sort((a, b) => b.netProfitPct - a.netProfitPct);
  }, [allPairs, allPrices, feeTiers, withdrawalFees, capital, selectedPair, hideLosses, hideBelowMin, useNativeDiscounts, exchanges]);

  useEffect(() => {
    setVisibleCount(20);
  }, [opportunities]);

  const handleCapitalSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCapitalInput(e.target.value);
  };

  const handleCapitalTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setCapitalInput(val);
  };

  const handleAddPairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBase.trim()) {
      setAddPairError('Base asset is required (e.g. ADA)');
      return;
    }

    setIsAddingPair(true);
    setAddPairError(null);

    try {
      const res = await fetch('/api/pairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseAsset: newBase.trim().toUpperCase(),
          quoteAsset: newQuote.toUpperCase(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create pair');
      }

      const data = await res.json();
      const createdPair = data.pair;

      // Add to client state list to make it selectable immediately
      setClientPairs((prev) => {
        if (prev.some((p) => p.symbol === createdPair.symbol)) return prev;
        return [...prev, createdPair];
      });

      // Select it and reset creation form
      setSelectedPair(createdPair.symbol);
      setNewBase('');
      setShowAddPair(false);
    } catch (err: any) {
      setAddPairError(err.message || 'Error creating custom pair');
    } finally {
      setIsAddingPair(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCard((prev) => (prev === id ? null : id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Dynamic Controls Card */}
      <div className="glass-card" style={{ padding: 'var(--space-lg)' }}>
        <h3 style={{ marginBottom: 'var(--space-md)' }}>Simulator Settings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
          
          {/* Capital Slider & Inputs */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)', fontWeight: 'bold' }}>
              <span>Trading Capital</span>
              <span className="text-gradient" style={{ fontFamily: 'var(--font-mono)' }}>
                ${capital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
              </span>
            </label>
            <input
              type="range"
              min="100"
              max="50000"
              step="100"
              value={parseFloat(capitalInput) || 100}
              onChange={handleCapitalSliderChange}
              style={{
                width: '100%',
                height: '6px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-full)',
                outline: 'none',
                accentColor: 'var(--accent-cyan)',
                cursor: 'pointer',
                marginBottom: 'var(--space-sm)',
              }}
            />
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input
                type="text"
                value={capitalInput}
                onChange={handleCapitalTextChange}
                placeholder="Enter capital"
                style={{
                  flex: 1,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
              {['500', '1000', '5000', '10000', '25000'].map((val) => (
                <button
                  key={val}
                  onClick={() => setCapitalInput(val)}
                  style={{
                    background: capitalInput === val ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  ${parseInt(val).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Filtering & Custom Pair Setup */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                <label style={{ fontWeight: 'bold' }}>Trading Pair</label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPair(!showAddPair);
                    setAddPairError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  {showAddPair ? 'Cancel' : '+ Create Custom Pair'}
                </button>
              </div>

              {!showAddPair ? (
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 12px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Pairs</option>
                  <optgroup label="Commonly Compared Pairs">
                    {pairs.map((pair) => (
                      <option key={pair.id} value={pair.symbol}>
                        {pair.symbol}
                      </option>
                    ))}
                  </optgroup>
                  {clientPairs.length > 0 && (
                    <optgroup label="Your Custom Pairs">
                      {clientPairs.map((pair) => (
                        <option key={pair.id} value={pair.symbol}>
                          {pair.symbol}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              ) : (
                <form onSubmit={handleAddPairSubmit} style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <input
                    type="text"
                    placeholder="Base (e.g. ADA)"
                    value={newBase}
                    onChange={(e) => setNewBase(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      textTransform: 'uppercase',
                    }}
                  />
                  <select
                    value={newQuote}
                    onChange={(e) => setNewQuote(e.target.value)}
                    style={{
                      width: '90px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="USDT">USDT</option>
                    <option value="USDC">USDC</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isAddingPair}
                    style={{
                      background: 'var(--gradient-primary)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    {isAddingPair ? 'Adding...' : 'Add'}
                  </button>
                </form>
              )}
              {addPairError && (
                <div style={{ color: 'var(--color-loss)', fontSize: '0.8rem', marginTop: '4px' }}>
                  {addPairError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-lg)', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={hideLosses}
                  onChange={(e) => setHideLosses(e.target.checked)}
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
                Hide unprofitable
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={hideBelowMin}
                  onChange={(e) => setHideBelowMin(e.target.checked)}
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
                Hide below min withdrawal
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Dynamic Custom Prices Indicator */}
      {isLoadingCustom && (
        <div className="glass-card" style={{ padding: 'var(--space-md)', textAlign: 'center', border: '1px solid var(--accent-cyan)' }}>
          <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <span className="spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid var(--accent-cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
            Fetching live price feeds for {selectedPair} directly from exchanges...
          </span>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}} />
        </div>
      )}

      {/* Simulator Results Header */}
      <div className="section__header" style={{ marginBottom: 'var(--space-sm)' }}>
        <h2>Dynamic Arbitrage Routes ({opportunities.length})</h2>
        <p className="section__subtitle">
          Factoring in custom volume-based taker fees and withdrawal gas costs. Click a route to view step-by-step math.
        </p>
      </div>

      {/* Opportunities List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {opportunities.length > 0 ? (
          <>
            {opportunities.slice(0, visibleCount).map((op) => {
              const isExpanded = expandedCard === op.id;
            const isProfit = op.netProfitUsdt > 0;
            const pctColor = isProfit ? 'var(--color-profit)' : 'var(--color-loss)';

            return (
              <div
                key={op.id}
                className="glass-card"
                style={{
                  border: isExpanded ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer',
                  padding: 0,
                  overflow: 'hidden',
                }}
                onClick={() => toggleExpand(op.id)}
              >
                {/* Header Row (Always visible) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 2.5fr 2fr 1.5fr auto',
                    alignItems: 'center',
                    padding: 'var(--space-md) var(--space-lg)',
                    gap: 'var(--space-md)',
                  }}
                >
                  {/* Pair Name */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '800', fontSize: '1.15rem' }}>{op.pair.symbol}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Gross spread: {op.grossSpread.toFixed(2)}%
                    </span>
                  </div>

                  {/* Route path */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>{op.buyExchange.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                    <span style={{ fontWeight: '600', color: 'var(--accent-violet)' }}>{op.sellExchange.name}</span>
                  </div>

                  {/* Profit Amount & Badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: pctColor }}>
                      {isProfit ? '+' : ''}${op.netProfitUsdt.toFixed(2)} USDT
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ROI: <span style={{ fontWeight: 'bold', color: pctColor }}>{isProfit ? '+' : ''}{op.netProfitPct.toFixed(2)}%</span>
                    </span>
                  </div>

                  {/* Execution Status / Warning */}
                  <div>
                    {!op.meetsMinWithdrawal ? (
                      <span className="badge badge--loss" style={{ fontSize: '0.75rem' }}>
                        Below Min Withdrawal
                      </span>
                    ) : isProfit ? (
                      <span className="badge badge--profit" style={{ fontSize: '0.75rem' }}>
                        Profitable
                      </span>
                    ) : (
                      <span className="badge badge--loss" style={{ fontSize: '0.75rem' }}>
                        Negative Profit
                      </span>
                    )}
                  </div>

                  {/* Expand icon */}
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform var(--transition-normal)' }}>
                    ▼
                  </div>
                </div>

                {/* Expanded cost waterfall view */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      background: 'rgba(10, 14, 26, 0.4)',
                      padding: 'var(--space-lg)',
                      cursor: 'default',
                    }}
                    onClick={(e) => e.stopPropagation()} // prevent collapsing on inside click
                  >
                    <h4 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Transaction Breakdown & Fee Waterfall</h4>
                    
                    <div className="waterfall">
                      <div className="waterfall__row waterfall__row--header">
                        <span>Transaction Phase / Action</span>
                        <span>Amount Details</span>
                      </div>

                      {/* Step 1: Initial Investment */}
                      <div className="waterfall__row">
                        <span className="waterfall__label">1. Starting Capital</span>
                        <span className="waterfall__value" style={{ color: 'var(--text-primary)' }}>
                          ${capital.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
                        </span>
                      </div>
                      <div className="waterfall__divider"></div>

                      {/* Step 2: Buy Leg */}
                      <div className="waterfall__row">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span className="waterfall__label">2. Buy {op.pair.baseAsset} on {op.buyExchange.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            Price: ${op.buyPrice.toLocaleString()} | Fee: {op.buyTakerFeePct.toFixed(4)}%
                          </span>
                          {op.buyExchange.nativeDiscountAvailable && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
                              <input 
                                type="checkbox" 
                                checked={!!useNativeDiscounts[op.buyExchange.id]}
                                onChange={(e) => setUseNativeDiscounts(prev => ({...prev, [op.buyExchange.id]: e.target.checked}))}
                                style={{ accentColor: 'var(--accent-cyan)' }}
                              />
                              Using {op.buyExchange.nativeToken} for fee discount ({op.buyExchange.discountPercentage}% off)
                            </label>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span className="waterfall__value waterfall__value--negative">
                            -${op.buyFeeUsdt.toFixed(2)} USDT Taker Fee
                          </span>
                          {isProfit && (
                            <a href={op.buyExchange.url || '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textDecoration: 'underline' }}>Trade Now ↗</a>
                          )}
                        </div>
                      </div>
                      <div className="waterfall__row" style={{ paddingLeft: 'var(--space-lg)', borderTop: 'none', background: 'transparent' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Net purchased quantity:</span>
                        <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {op.netBaseBought.toFixed(6)} {op.pair.baseAsset}
                        </span>
                      </div>
                      <div className="waterfall__divider"></div>

                      {/* Step 3: Network Transfer Leg */}
                      <div className="waterfall__row">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="waterfall__label">3. Withdraw {op.pair.baseAsset} via {op.withdrawalNetworkName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            Flat Fee: {op.withdrawalFee} {op.pair.baseAsset} | Min req: {op.minWithdrawalAmount} {op.pair.baseAsset}
                          </span>
                        </div>
                        <span className="waterfall__value waterfall__value--negative">
                          -{op.withdrawalFee.toFixed(6)} {op.pair.baseAsset} (~${op.withdrawalFeeUsdt.toFixed(2)} USDT)
                        </span>
                      </div>
                      {!op.meetsMinWithdrawal && (
                        <div style={{ padding: '8px 12px', background: 'var(--color-loss-bg)', color: 'var(--color-loss)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', margin: '4px 0 12px 0' }}>
                          ⚠️ <strong>Blocked:</strong> The purchased amount of {op.netBaseBought.toFixed(6)} {op.pair.baseAsset} is lower than the minimum withdrawal requirement of {op.minWithdrawalAmount} {op.pair.baseAsset} on {op.buyExchange.name}.
                        </div>
                      )}
                      <div className="waterfall__row" style={{ paddingLeft: 'var(--space-lg)', borderTop: 'none', background: 'transparent' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Net arrived quantity:</span>
                        <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {Math.max(0, op.netBaseArrived).toFixed(6)} {op.pair.baseAsset}
                        </span>
                      </div>
                      <div className="waterfall__divider"></div>

                      {/* Step 4: Sell Leg */}
                      <div className="waterfall__row">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span className="waterfall__label">4. Sell {op.pair.baseAsset} on {op.sellExchange.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            Price: ${op.sellPrice.toLocaleString()} | Fee: {op.sellTakerFeePct.toFixed(4)}%
                          </span>
                          {op.sellExchange.nativeDiscountAvailable && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
                              <input 
                                type="checkbox" 
                                checked={!!useNativeDiscounts[op.sellExchange.id]}
                                onChange={(e) => setUseNativeDiscounts(prev => ({...prev, [op.sellExchange.id]: e.target.checked}))}
                                style={{ accentColor: 'var(--accent-cyan)' }}
                              />
                              Using {op.sellExchange.nativeToken} for fee discount ({op.sellExchange.discountPercentage}% off)
                            </label>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span className="waterfall__value waterfall__value--negative">
                            -${op.sellFeeUsdt.toFixed(2)} USDT Taker Fee
                          </span>
                          {isProfit && (
                            <a href={op.sellExchange.url || '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textDecoration: 'underline' }}>Trade Now ↗</a>
                          )}
                        </div>
                      </div>
                      <div className="waterfall__divider"></div>

                      {/* Result */}
                      <div className={`waterfall__row waterfall__row--result ${isProfit ? 'profitable' : 'unprofitable'}`}>
                        <span className="waterfall__label" style={{ fontWeight: 'bold' }}>Net Realized Return</span>
                        <div style={{ textAlign: 'right' }}>
                          <div className="font-mono" style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                            {isProfit ? '+' : ''}${op.netProfitUsdt.toFixed(2)} USDT
                          </div>
                          <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                            ({isProfit ? '+' : ''}{op.netProfitPct.toFixed(2)}% ROI)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
            })}
            {visibleCount < opportunities.length && (
              <div ref={lastElementRef} style={{ padding: 'var(--space-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid var(--accent-cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '8px', verticalAlign: 'middle' }}></span>
                Loading more routes...
              </div>
            )}
          </>
        ) : (
          <div className="glass-card" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No active arbitrage opportunities match your current filters and capital constraints.</p>
          </div>
        )}
      </div>
    </div>
  );
}
