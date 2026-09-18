import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Info, TrendingUp, Layers, Sparkles } from 'lucide-react';
import { calculateFairPrice, getCostBreakdown, formatRupees } from '../../utils/pricing';
import type { PricingCalculation } from '../../types';

interface CostInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

/**
 * Stably defined at module scope so React NEVER destroys and recreates
 * the DOM <input> element across re-renders.
 * Using type="text" with inputMode="decimal":
 * - Preserves standard DOM caret selection and cursor positioning
 * - Enables mobile numeric keypad with decimal support
 * - Eliminates browser DOMException when reading or navigating selection
 * - Keeps focus completely stable across continuous typing
 */
function CostInputField({ id, label, value, onChange, placeholder = '0' }: CostInputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty string or numbers with optional single decimal point
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-500 font-medium pointer-events-none select-none">
          ₹
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          className="input pl-8"
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

function parseCost(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) || n < 0 ? 0 : n;
}

export function PricingPage() {
  const navigate = useNavigate();
  // Batch quantity state (defaults to 1, positive whole numbers only)
  const [quantity, setQuantity] = useState<string>('1');

  // Individual stable controlled state variables for each cost input
  const [rawMaterial, setRawMaterial] = useState<string>('');
  const [labour, setLabour] = useState<string>('');
  const [packaging, setPackaging] = useState<string>('');
  const [transportation, setTransportation] = useState<string>('');
  const [other, setOther] = useState<string>('');
  const [productionTime, setProductionTime] = useState<string>('1');
  const [desiredMargin, setDesiredMargin] = useState<number>(25);

  const [hasTriggeredCalc, setHasTriggeredCalc] = useState(false);

  // Validate Quantity input
  let quantityError = '';
  const parsedQty = parseInt(quantity, 10);
  if (quantity === '') {
    quantityError = 'Quantity is required.';
  } else if (quantity === '0' || parsedQty === 0) {
    quantityError = 'Quantity must be at least 1.';
  } else if (quantity.startsWith('-') || parsedQty < 0) {
    quantityError = 'Quantity must be a positive number.';
  } else if (isNaN(parsedQty)) {
    quantityError = 'Quantity must be a whole number.';
  }

  const validQuantity = quantityError ? 1 : Math.max(1, parsedQty);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow digits and minus sign (to trigger informative validation if entered)
    const sanitized = val.replace(/[^0-9-]/g, '');
    setQuantity(sanitized);
  };

  // Convert inputs to numbers safely; empty input evaluates to 0
  const rawMaterialNum = parseCost(rawMaterial);
  const labourNum = parseCost(labour);
  const packagingNum = parseCost(packaging);
  const transportationNum = parseCost(transportation);
  const otherNum = parseCost(other);
  const productionTimeNum = parseCost(productionTime) || 1;

  const totalCost = rawMaterialNum + labourNum + packagingNum + transportationNum + otherNum;
  const costPerUnit = totalCost / validQuantity;

  // Live calculation that updates smoothly without causing input re-creation or blur
  const liveCalculation: PricingCalculation | null = useMemo(() => {
    if (totalCost === 0) return null;
    const calc = calculateFairPrice(
      rawMaterialNum,
      labourNum,
      packagingNum,
      transportationNum,
      otherNum,
      desiredMargin,
      validQuantity
    );
    calc.productionTime = productionTimeNum;
    return calc;
  }, [
    rawMaterialNum,
    labourNum,
    packagingNum,
    transportationNum,
    otherNum,
    desiredMargin,
    validQuantity,
    productionTimeNum,
    totalCost,
  ]);

  const handleCalculate = () => {
    setHasTriggeredCalc(true);
  };

  // Show results live when costs are entered or when calculate is clicked
  const showResults = (hasTriggeredCalc || totalCost > 0) && liveCalculation !== null;
  const breakdown = liveCalculation ? getCostBreakdown(liveCalculation) : [];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <Calculator className="w-5 h-5 text-brand-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-earth-900">Fair Price Assistant</h1>
      </div>
      <p className="text-earth-600 mb-8 ml-0 sm:ml-13">
        Calculate fair selling prices per unit and total batch profits based on your real costs.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card p-6">
          <h2 className="font-semibold text-earth-900 mb-4">Production Costs & Batch Details</h2>

          <div className="space-y-4">
            {/* 1. Quantity / Number of Items */}
            <div>
              <label htmlFor="cost-quantity" className="label font-semibold text-earth-900">
                Quantity / Number of Items <span className="text-brand-600">*</span>
              </label>
              <div className="relative">
                <input
                  id="cost-quantity"
                  type="text"
                  inputMode="numeric"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className={`input ${quantityError ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="1"
                  autoComplete="off"
                />
              </div>
              {quantityError ? (
                <p className="text-red-500 text-xs mt-1 font-medium">{quantityError}</p>
              ) : (
                <p className="text-[11px] text-earth-500 mt-1">
                  Batch size you are producing (e.g. 1, 5, 10, 25, 100)
                </p>
              )}
            </div>

            {/* Helper text */}
            <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
              <p className="text-xs text-earth-600">
                💡 <strong>Important:</strong> Enter the total production costs for the quantity you are producing.
              </p>
            </div>

            {/* 2. Cost inputs (Total for the batch) */}
            <CostInputField
              id="cost-raw-material"
              label="Raw Material Cost"
              value={rawMaterial}
              onChange={setRawMaterial}
            />

            <CostInputField
              id="cost-labour"
              label="Labour Cost"
              value={labour}
              onChange={setLabour}
            />

            <CostInputField
              id="cost-packaging"
              label="Packaging Cost"
              value={packaging}
              onChange={setPackaging}
            />

            <CostInputField
              id="cost-transportation"
              label="Transportation Cost"
              value={transportation}
              onChange={setTransportation}
            />

            <CostInputField
              id="cost-other"
              label="Other Costs"
              value={other}
              onChange={setOther}
            />

            {/* Summary: Total Cost + Cost Per Unit */}
            <div className="pt-3 border-t border-earth-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-earth-600 font-medium">Total Production Cost (Batch):</span>
                <span className="text-xl font-bold text-earth-900">{formatRupees(totalCost)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-earth-600 font-medium">
                  Cost Per Unit ({validQuantity} {validQuantity === 1 ? 'item' : 'items'}):
                </span>
                <span className="text-base font-bold text-brand-700">
                  {formatRupees(Math.round(costPerUnit))} <span className="text-xs font-normal text-earth-500">/ item</span>
                </span>
              </div>
            </div>

            {/* 3. Production Time */}
            <div>
              <label htmlFor="cost-production-time" className="label">
                Production Time (days)
              </label>
              <input
                id="cost-production-time"
                type="text"
                inputMode="numeric"
                value={productionTime}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setProductionTime(val);
                  }
                }}
                className="input"
                placeholder="1"
                autoComplete="off"
              />
              <p className="text-[11px] text-earth-400 mt-1">
                Time required to produce this batch of {validQuantity} {validQuantity === 1 ? 'item' : 'items'}.
              </p>
            </div>

            {/* 4. Profit Margin Slider */}
            <div>
              <label htmlFor="cost-desired-margin" className="label">
                Desired Profit Margin: <span className="text-brand-600 font-bold">{desiredMargin}%</span>
              </label>
              <input
                id="cost-desired-margin"
                type="range"
                min="5"
                max="100"
                value={desiredMargin}
                onChange={(e) => setDesiredMargin(Number(e.target.value))}
                className="w-full h-2 bg-earth-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-xs text-earth-400 mt-1">
                <span>5% (Minimal)</span>
                <span>50% (Standard)</span>
                <span>100% (Premium)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculate}
              disabled={totalCost === 0}
              className="btn-primary w-full justify-center !py-3.5"
            >
              <Calculator className="w-5 h-5" />
              Calculate Fair Price
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {!showResults || !liveCalculation ? (
            <div className="card p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
              <TrendingUp className="w-14 h-14 text-earth-200 mb-4" />
              <h3 className="font-semibold text-earth-500 mb-2">Enter your costs to see results</h3>
              <p className="text-sm text-earth-400 max-w-xs">
                Fill in the batch quantity and production costs on the left to calculate unit pricing and total profits live.
              </p>
            </div>
          ) : (
            <>
              {/* Price Result Card */}
              <div className="card p-6 bg-gradient-to-br from-brand-50 to-earth-50 border-brand-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-earth-900 text-lg">Pricing Results</h3>
                  <span className="badge-brand text-xs font-semibold">
                    {validQuantity} {validQuantity === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Total Batch Production Cost */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-earth-600">Total Production Cost</span>
                    <span className="font-bold text-earth-900">{formatRupees(liveCalculation.totalCost)}</span>
                  </div>

                  {/* Quantity */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-earth-600">Quantity</span>
                    <span className="font-semibold text-earth-900">{validQuantity} items</span>
                  </div>

                  {/* Cost Per Unit */}
                  <div className="flex justify-between items-center text-sm pb-2 border-b border-earth-200">
                    <span className="text-earth-600">Cost Per Unit</span>
                    <span className="font-bold text-earth-900">{formatRupees(Math.round(costPerUnit))}</span>
                  </div>

                  {/* Suggested Selling Price Per Unit */}
                  <div className="py-2.5 px-3.5 bg-white/80 rounded-xl border border-brand-300 shadow-xs flex justify-between items-center">
                    <div>
                      <span className="text-xs text-brand-600 font-semibold uppercase tracking-wider block">
                        Suggested Selling Price
                      </span>
                      <span className="text-[11px] text-earth-500">Per unit (+{desiredMargin}% margin)</span>
                    </div>
                    <span className="text-2xl font-bold text-brand-700">
                      {formatRupees(liveCalculation.suggestedPrice)}{' '}
                      <span className="text-xs font-normal text-earth-600">/ item</span>
                    </span>
                  </div>

                  {/* Recommended Range Per Unit */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-earth-600">Recommended Range</span>
                    <span className="font-semibold text-earth-900">
                      {formatRupees(liveCalculation.recommendedMin)} – {formatRupees(liveCalculation.recommendedMax)} / item
                    </span>
                  </div>

                  {/* Estimated Profit Per Unit */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-earth-600">Estimated Profit</span>
                    <span className="font-bold text-green-600">
                      {formatRupees(Math.round(liveCalculation.estimatedProfit))} / item
                    </span>
                  </div>

                  {/* Estimated Total Profit for Batch */}
                  <div className="flex justify-between items-center text-sm pt-2.5 border-t border-earth-200">
                    <span className="text-earth-700 font-medium">Estimated Total Profit</span>
                    <span className="font-bold text-green-700 text-lg">
                      {formatRupees(Math.round(liveCalculation.totalEstimatedProfit || 0))}
                    </span>
                  </div>

                  {/* Estimated Total Batch Value */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-earth-700 font-medium">Estimated Total Selling Value</span>
                    <span className="font-bold text-earth-900">
                      {formatRupees(liveCalculation.totalSellingValue || 0)}
                    </span>
                  </div>

                  {/* Use in Smart Catalog Action */}
                  <div className="pt-3 mt-1 border-t border-earth-100">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem('jc_recent_pricing', JSON.stringify({
                            suggestedPrice: liveCalculation.suggestedPrice,
                            totalCost: liveCalculation.totalCost,
                            unitCost: liveCalculation.costPerUnit,
                            productionTime: productionTimeNum,
                            quantity: validQuantity,
                            savedAt: new Date().toISOString()
                          }));
                        } catch (_) {}
                        navigate(`/artisan/smart-catalog?price=${liveCalculation.suggestedPrice}&days=${productionTimeNum}&qty=${validQuantity}`);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Use Price in Smart Catalog →</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown Chart */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-earth-900">Cost Breakdown</h3>
                  <span className="text-xs text-earth-500 font-medium">
                    Total Batch: {formatRupees(liveCalculation.totalCost)}
                  </span>
                </div>
                <div className="space-y-3">
                  {breakdown.map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-earth-700">{item.label}</span>
                        <span className="font-medium">
                          {formatRupees(item.value)} ({item.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-earth-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="card p-4 bg-amber-50 border border-amber-200">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <strong>Important:</strong> This is an estimated price based on your entered costs and selected margin.
                    It is not a guaranteed market price. Actual market prices may vary based on demand, competition, and other factors.
                    Use this as a starting point for pricing decisions.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
