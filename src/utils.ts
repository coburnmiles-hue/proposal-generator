import type { PlanRate, RateAnalysis } from './types';

/** True when rate analysis has enough volume data to drive calculations */
export function hasRateAnalysisData(ra: RateAnalysis | null | undefined): boolean {
  if (!ra) return false;
  return ra.vmcVolume > 0 || ra.amexVolume > 0;
}

/**
 * Projected monthly processing cost for a proposed plan rate applied to the
 * volumes captured in the rate analysis.
 *
 * Returns null for interchange+ plans because the interchange pass-through
 * cost is unknown — those plans should use a manually entered value.
 */
export function calcProjectedProcessing(rate: PlanRate, ra: RateAnalysis | null | undefined): number | null {
  if (!hasRateAnalysisData(ra)) return null;
  const r = ra!;

  const totalVolume = r.vmcVolume + r.amexVolume;
  const totalTx = r.vmcTransactions + r.amexTransactions;

  switch (rate.type) {
    case 'flat':
    case 'dual-pricing':
      return totalVolume * (rate.flatPercentage / 100) + totalTx * rate.flatPerTx;

    case 'tiered-simple':
      return (
        r.vmcVolume * (rate.vmcPercentage / 100) +
        r.vmcTransactions * rate.vmcPerTx +
        r.amexVolume * (rate.amexPercentage / 100) +
        r.amexTransactions * rate.amexPerTx
      );

    case 'tiered': {
      // Use average of qual / non-qual as an effective blended rate
      const vmcAvg = (rate.vmcQualPercentage + rate.vmcNonQualPercentage) / 2;
      const amexAvg = (rate.amexQualPercentage + rate.amexNonQualPercentage) / 2;
      return (
        r.vmcVolume * (vmcAvg / 100) +
        r.vmcTransactions * rate.vmcPerTx +
        r.amexVolume * (amexAvg / 100) +
        r.amexTransactions * rate.amexPerTx
      );
    }

    // Interchange+ — interchange itself is a pass-through that varies by card;
    // we cannot compute the total without knowing the underlying interchange cost.
    case 'interchange+':
    default:
      return null;
  }
}
