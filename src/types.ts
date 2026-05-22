export interface Feature {
  id: string;
  name: string;
}

export interface PlanFeature {
  featureId: string;
  spotonIncluded: boolean;
  currentIncluded: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  spotonMonthly: number;
  currentMonthly: number;
  hardwarePrice: number;
  totalInvestment: number;
  features: PlanFeature[];
}

export interface ProposalData {
  clientName: string;
  clientCompany: string;
  clientLogoUrl: string;
  date: string;
  companyName: string;
  features: Feature[];
  plans: Plan[];
}
