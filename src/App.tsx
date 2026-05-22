import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  spotonMonthly: 0,
  currentMonthly: 0,
  hardwarePrice: 0,
  totalInvestment: 0,
  features: features.map((f) => ({ featureId: f.id, spotonIncluded: false, currentIncluded: false })),
});

const defaultData: ProposalData = {
  clientName: '',
  clientCompany: '',
  clientLogoUrl: '',
  date: new Date().toISOString().split('T')[0],
  companyName: 'SpotOn',
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

  const handleExportPDF = async () => {
    const docRoot = previewRef.current?.querySelector<HTMLElement>('.doc-root');
    if (!docRoot) return;

    const btn = document.querySelector<HTMLButtonElement>('.btn-export');
    if (btn) btn.disabled = true;

    try {
      const canvas = await html2canvas(docRoot, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pxToMm = 25.4 / 96; // CSS px → mm at 96 dpi
      const pdfW = (canvas.width / 2) * pxToMm;
      const pdfH = (canvas.height / 2) * pxToMm;

      const pdf = new jsPDF({ unit: 'mm', format: [pdfW, pdfH] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`${data.clientCompany || 'Proposal'} - Options.pdf`);
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">Proposal Generator</h1>
        <button className="btn-export" onClick={handleExportPDF}>
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
