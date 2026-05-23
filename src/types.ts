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

export type RateType = 'interchange+' | 'flat' | 'tiered';

export interface PlanRate {
  type: RateType;
  /** Interchange+ */
  basisPoints: number;
  interchangePerTx: number;
  /** Flat */
  flatPercentage: number;
  flatPerTx: number;
  /** Tiered */
  vmcPercentage: number;
  vmcPerTx: number;
  amexPercentage: number;
  amexPerTx: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  rate: PlanRate;
  spotonMonthly: number;
  hardwarePrice: number;
  features: PlanFeature[];
}

export interface ProposalData {
  clientName: string;
  clientCompany: string;
  clientLogoUrl: string;
  date: string;
  companyName: string;
  currentMonthly: number;
  currentProcessing: number;
  spotonProcessing: number;
  features: Feature[];
  plans: Plan[];
}
