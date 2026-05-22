import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import { ProposalForm } from './components/ProposalForm';
import { ProposalPreview } from './components/ProposalPreview';
import type { ProposalData } from './types';

const DEFAULT_FEATURES = [
  { id: uuidv4(), name: 'Handhelds' },
  { id: uuidv4(), name: 'POS' },
  { id: uuidv4(), name: 'KDS' },
  { id: uuidv4(), name: 'Marketing' },
  { id: uuidv4(), name: 'Online Ordering' },
  { id: uuidv4(), name: 'Website' },
  { id: uuidv4(), name: 'Profit Assist' },
  { id: uuidv4(), name: 'Scheduling' },
  { id: uuidv4(), name: 'Tip Automation' },
  { id: uuidv4(), name: 'Employee Instant Deposit' },
  { id: uuidv4(), name: 'Loyalty' },
  { id: uuidv4(), name: 'Reserve' },
  { id: uuidv4(), name: 'Success Agent' },
];

const DEFAULT_RATE = {
  type: 'interchange+' as const,
  basisPoints: 0,
  interchangePerTx: 0,
  flatPercentage: 0,
  flatPerTx: 0,
  vmcPercentage: 0,
  vmcPerTx: 0,
  amexPercentage: 0,
  amexPerTx: 0,
};

const makeDefaultPlan = (name: string, features: typeof DEFAULT_FEATURES) => ({
  id: uuidv4(),
  name,
  description: '',
  rate: DEFAULT_RATE,
  totalInvestment: 0,
  features: features.map((f) => ({ featureId: f.id, spotonIncluded: false, currentIncluded: false })),
});

const defaultData: ProposalData = {
  clientName: '',
  clientCompany: '',
  clientLogoUrl: '',
  date: new Date().toISOString().split('T')[0],
  companyName: 'SpotOn',
  spotonMonthly: 0,
  currentMonthly: 0,
  hardwarePrice: 0,
  features: DEFAULT_FEATURES,
  plans: [
    makeDefaultPlan('SpotOn Basic', DEFAULT_FEATURES),
    makeDefaultPlan('SpotOn Advanced', DEFAULT_FEATURES),
    makeDefaultPlan('SpotOn Core', DEFAULT_FEATURES),
  ],
};

function App() {
  const [data, setData] = useState<ProposalData>(defaultData);
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: `${data.clientCompany || 'Proposal'} - Options`,
  });

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">Proposal Generator</h1>
        <button className="btn-export" onClick={() => handlePrint()}>
          Export PDF
        </button>
      </div>
      <div className="app-body">
        <ProposalForm data={data} onChange={setData} />
        <div className="preview-panel">
          <ProposalPreview ref={previewRef} data={data} />
        </div>
      </div>
    </div>
  );
}

export default App;
