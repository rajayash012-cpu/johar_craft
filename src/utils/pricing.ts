import type { PricingCalculation } from '../types';

/**
 * Calculate fair price based on costs and desired margin.
 */
export function calculateFairPrice(
  rawMaterial: number,
  labour: number,
  packaging: number,
  transportation: number,
  other: number,
  desiredMarginPercent: number,
  quantity = 1
): PricingCalculation {
  const validQty = Math.max(1, Math.floor(quantity));
  const totalCost = rawMaterial + labour + packaging + transportation + other;
  const costPerUnit = totalCost / validQty;

  const marginMultiplier = 1 + desiredMarginPercent / 100;
  const suggestedPricePerUnit = Math.ceil(costPerUnit * marginMultiplier);
  const recommendedMinPerUnit = Math.ceil(costPerUnit * (1 + (desiredMarginPercent - 5) / 100));
  const recommendedMaxPerUnit = Math.ceil(costPerUnit * (1 + (desiredMarginPercent + 10) / 100));
  
  const estimatedProfitPerUnit = suggestedPricePerUnit - costPerUnit;
  const totalSellingValue = suggestedPricePerUnit * validQty;
  const totalEstimatedProfit = estimatedProfitPerUnit * validQty;

  return {
    rawMaterial,
    labour,
    packaging,
    transportation,
    other,
    productionTime: 0,
    desiredMarginPercent,
    totalCost,
    quantity: validQty,
    costPerUnit,
    suggestedPrice: suggestedPricePerUnit,
    recommendedMin: Math.max(recommendedMinPerUnit, Math.ceil(costPerUnit) + 1),
    recommendedMax: recommendedMaxPerUnit,
    estimatedProfit: estimatedProfitPerUnit,
    totalSellingValue,
    totalEstimatedProfit,
  };
}

/**
 * Format a number as Indian Rupees.
 */
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Generate a simple percentage breakdown for chart display.
 */
export function getCostBreakdown(calc: PricingCalculation) {
  const total = calc.totalCost;
  if (total === 0) return [];
  return [
    { label: 'Raw Material', value: calc.rawMaterial, color: '#c85a26' },
    { label: 'Labour', value: calc.labour, color: '#d97234' },
    { label: 'Packaging', value: calc.packaging, color: '#e28b52' },
    { label: 'Transportation', value: calc.transportation, color: '#ecb285' },
    { label: 'Other', value: calc.other, color: '#f4d1b6' },
  ].filter(item => item.value > 0).map(item => ({
    ...item,
    percent: Math.round((item.value / total) * 100),
  }));
}
