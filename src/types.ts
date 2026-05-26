export interface Feature {
  id: string;
  name: string;
  enabled?: boolean;
}

export interface PlanFeature {
  featureId: string;
  spotonIncluded: boolean;
  currentIncluded: boolean;
}

export type RateType = 'interchange+' | 'flat' | 'dual-pricing' | 'tiered-simple' | 'tiered';

export interface PlanRate {
  type: RateType;
  /** Interchange+ */
  basisPoints: number;
  interchangePerTx: number;
  amexBasisPoints: number;
  amexInterchangePerTx: number;
  /** Flat */
  flatPercentage: number;
  flatPerTx: number;
  /** Tiered Simple */
  vmcPercentage: number;
  vmcPerTx: number;
  amexPercentage: number;
  amexPerTx: number;
  /** Tiered (full Non-Qual / Qual) */
  vmcNonQualPercentage: number;
  vmcQualPercentage: number;
  amexNonQualPercentage: number;
  amexQualPercentage: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  rate: PlanRate;
  spotonMonthly: number;
  spotonProcessing: number;
  hardwarePrice: number;
  features: PlanFeature[];
}

export interface RateAnalysis {
  vmcTransactions: number;
  vmcVolume: number;
  amexTransactions: number;
  amexVolume: number;
  atmTransactions: number;
  atmVolume: number;
}

export interface ProposalData {
  clientName: string;
  clientCompany: string;
  clientLogoUrl: string;
  date: string;
  companyName: string;
  currentMonthly: number;
  currentProcessing: number;
  currentRate: PlanRate;
  rateAnalysis: RateAnalysis;
  features: Feature[];
  plans: Plan[];
}
