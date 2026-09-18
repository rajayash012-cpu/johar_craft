import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Info, TrendingUp, Layers, Sparkles } from 'lucide-react';
import { calculateFairPrice, getCostBreakdown, formatRupees } from '../../utils/pricing';
import type { PricingCalculation } from '../../types';
import { useLanguage } from '../../i18n';

interface CostInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

function CostInputField({ id, label, value, onChange, placeholder = '0' }: CostInputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="label">
        {label} (₹)
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400 font-medium text-sm select-none pointer-events-none">
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
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState<string>('1');

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
    quantityError = t('pricing.qty_required_error');
  } else if (quantity === '0' || parsedQty === 0) {
    quantityError = t('pricing.qty_min_error');
  } else if (quantity.startsWith('-') || parsedQty < 0) {
    quantityError = t('pricing.qty_pos_error');
  } else if (isNaN(parsedQty)) {
    quantityError = t('pricing.qty_whole_error');
  }

  const validQuantity = quantityError ? 1 : Math.max(1, parsedQty);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const sanitized = val.replace(/[^0-9-]/g, '');
    setQuantity(sanitized);
  };

  const rawMaterialNum = parseCost(rawMaterial);
  const labourNum = parseCost(labour);
  const packagingNum = parseCost(packaging);
  const transportationNum = parseCost(transportation);
  const otherNum = parseCost(other);
  const productionTimeNum = parseCost(productionTime) || 1;

  const totalCost = rawMaterialNum + labourNum + packagingNum + transportationNum + otherNum;
  const costPerUnit = totalCost / validQuantity;

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

  const showResults = (hasTriggeredCalc || totalCost > 0) && liveCalculation !== null;
  const breakdown = liveCalculation ? getCostBreakdown(liveCalculation) : [];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <Calculator className="w-5 h-5 text-brand-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-earth-900">{t('pricing.title')}</h1>
      </div>
      <p className="text-earth-600 mb-8 ml-0 sm:ml-13">
        {t('pricing.subtitle')}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card p-6">
          <h2 className="font-semibold text-earth-900 mb-4">{t('pricing.production_costs_batch')}</h2>

          <div className="space-y-4">
            {/* 1. Quantity / Number of Items */}
            <div>
              <label htmlFor="cost-quantity" className="label font-semibold text-earth-900">
                {t('pricing.quantity')} <span className="text-brand-600">*</span>
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
                  {t('pricing.batch_size_help')}
                </p>
              )}
            </div>

            {/* Helper text */}
            <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
              <p className="text-xs text-earth-600">
                {t('pricing.important_cost_note')}
              </p>
            </div>

            {/* 2. Cost inputs (Total for the batch) */}
            <CostInputField
              id="cost-raw-material"
              label={t('pricing.raw_material')}
              value={rawMaterial}
              onChange={setRawMaterial}
            />

            <CostInputField
              id="cost-labour"
              label={t('pricing.labour')}
              value={labour}
              onChange={setLabour}
            />

            <CostInputField
              id="cost-packaging"
              label={t('pricing.packaging')}
              value={packaging}
              onChange={setPackaging}
            />

            <CostInputField
              id="cost-transportation"
              label={t('pricing.transportation')}
              value={transportation}
              onChange={setTransportation}
            />

            <CostInputField
              id="cost-other"
              label={t('pricing.other_costs')}
              value={other}
              onChange={setOther}
            />

            {/* Summary: Total Cost + Cost Per Unit */}
            <div className="pt-3 border-t border-earth-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-earth-600 font-medium">{t('pricing.total_batch_cost')}:</span>
                <span className="text-xl font-bold text-earth-900">{formatRupees(totalCost)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-earth-600 font-medium">
                  {t('pricing.cost_per_unit_batch', { count: validQuantity, unit: validQuantity === 1 ? t('common.item') : t('common.items') })}
                </span>
                <span className="text-base font-bold text-brand-700">
                  {formatRupees(Math.round(costPerUnit))} <span className="text-xs font-normal text-earth-500">/ {t('common.item')}</span>
                </span>
              </div>
            </div>

            {/* 3. Production Time */}
            <div>
              <label htmlFor="cost-production-time" className="label">
                {t('pricing.production_time')}
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
                {t('pricing.time_required_help', { count: validQuantity, unit: validQuantity === 1 ? t('common.item') : t('common.items') })}
              </p>
            </div>

            {/* 4. Profit Margin Slider */}
            <div>
              <label htmlFor="cost-desired-margin" className="label">
                {t('pricing.desired_margin')} <span className="text-brand-600 font-bold">{desiredMargin}%</span>
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
                <span>{t('pricing.margin_minimal')}</span>
                <span>{t('pricing.margin_standard')}</span>
                <span>{t('pricing.margin_premium')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculate}
              disabled={totalCost === 0}
              className="btn-primary w-full justify-center !py-3.5 cursor-pointer"
            >
              <Calculator className="w-5 h-5" />
              {t('pricing.calculate_btn')}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {!showResults || !liveCalculation ? (
            <div className="card p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
              <TrendingUp className="w-14 h-14 text-earth-200 mb-4" />
              <h3 className="font-semibold text-earth-500 mb-2">{t('pricing.enter_costs_prompt')}</h3>
              <p className="text-sm text-earth-400 max-w-xs">
                {t('pricing.enter_costs_desc')}
              </p>
            </div>
          ) : (
            <>
              {/* Price Result Card */}
              <div className="card p-6 bg-gradient-to-br from-brand-50 to-earth-50 border-brand-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-earth-900 text-lg">{t('pricing.pricing_results')}</h3>
                  <span className="badge-brand text-xs font-semibold">
                    {validQuantity} {validQuantity === 1 ? t('common.item') : t('common.items')}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Total Batch Production Cost */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-earth-600">{t('pricing.total_production_cost')}</span>
                    <span className="font-bold text-earth-900">{formatRupees(liveCalculation.totalCost)}</span>
                  </div>

                  {/* Quantity */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-earth-600">{t('pricing.quantity')}</span>
                    <span className="font-semibold text-earth-900">{validQuantity} {t('common.items')}</span>
                  </div>

                  {/* Cost Per Unit */}
                  <div className="flex justify-between items-center text-sm pb-2 border-b border-earth-200">
                    <span className="text-earth-600">{t('pricing.cost_per_unit')}</span>
                    <span className="font-bold text-earth-900">{formatRupees(Math.round(costPerUnit))}</span>
                  </div>

                  {/* Suggested Selling Price Per Unit */}
                  <div className="py-2.5 px-3.5 bg-white/80 rounded-xl border border-brand-300 shadow-xs flex justify-between items-center">
                    <div>
                      <span className="text-xs text-brand-600 font-semibold uppercase tracking-wider block">
                        {t('pricing.suggested_price_unit')}
                      </span>
                      <span className="text-[11px] text-earth-500">Per unit (+{desiredMargin}% margin)</span>
                    </div>
                    <span className="text-2xl font-bold text-brand-700">
                      {formatRupees(liveCalculation.suggestedPrice)}{' '}
                      <span className="text-xs font-normal text-earth-600">/ {t('common.item')}</span>
                    </span>
                  </div>

                  {/* Estimated Profit Per Unit */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-earth-600">{t('pricing.profit_per_unit')}</span>
                    <span className="font-bold text-green-600">
                      {formatRupees(Math.round(liveCalculation.estimatedProfit))} / {t('common.item')}
                    </span>
                  </div>

                  {/* Estimated Total Profit for Batch */}
                  <div className="flex justify-between items-center text-sm pt-2.5 border-t border-earth-200">
                    <span className="text-earth-700 font-medium">{t('pricing.total_profit')}</span>
                    <span className="font-bold text-green-700 text-lg">
                      {formatRupees(Math.round(liveCalculation.totalEstimatedProfit || 0))}
                    </span>
                  </div>

                  {/* Estimated Total Batch Value */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-earth-700 font-medium">{t('pricing.total_batch_value')}</span>
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
                      <span>{t('pricing.apply_to_product')} →</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown Chart */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-earth-900">{t('pricing.breakdown')}</h3>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
