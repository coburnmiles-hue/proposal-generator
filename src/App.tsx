import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import { ProposalForm } from './components/ProposalForm';
import { ProposalPreview } from './components/ProposalPreview';
import type { ProposalData } from './types';

const STORAGE_KEY = 'spoton-saved-proposals';

interface SavedProposal {
  id: string;
  name: string;
  savedAt: string;
  data: ProposalData;
}

function loadSaved(): SavedProposal[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function persistSaved(list: SavedProposal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

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
  { id: uuidv4(), name: 'Instant Cash Tip Deposit' },
  { id: uuidv4(), name: 'Loyalty' },
  { id: uuidv4(), name: 'Reservation Manager' },
  { id: uuidv4(), name: 'Local & 24/7 Support' },
  { id: uuidv4(), name: 'DD / UE Integrations' },
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
  features: features.map((f) => ({ featureId: f.id, spotonIncluded: false, currentIncluded: false })),
});

const defaultData: ProposalData = {
  clientName: '',
  clientCompany: '',
  clientLogoUrl: '',
  date: new Date().toISOString().split('T')[0],
  companyName: 'SpotOn',
  currentProcessing: 0,
  spotonProcessing: 0,
  features: DEFAULT_FEATURES,
  plans: [
    makeDefaultPlan('SpotOn Basic', DEFAULT_FEATURES),
    makeDefaultPlan('SpotOn Advanced', DEFAULT_FEATURES),
    makeDefaultPlan('SpotOn Core', DEFAULT_FEATURES),
  ],
};

function App() {
  const [data, setData] = useState<ProposalData>(defaultData);
  const [saved, setSaved] = useState<SavedProposal[]>(loadSaved);
  const [showSaved, setShowSaved] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const savedDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (savedDropdownRef.current && !savedDropdownRef.current.contains(e.target as Node)) {
        setShowSaved(false);
      }
    }
    if (showSaved) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showSaved]);

  const handleSave = () => {
    const name = (data.clientCompany || data.clientName || 'Untitled').trim();
    const entry: SavedProposal = { id: uuidv4(), name, savedAt: new Date().toISOString(), data };
    const updated = [entry, ...saved];
    setSaved(updated);
    persistSaved(updated);
  };

  const handleLoad = (entry: SavedProposal) => {
    setData(entry.data);
    setShowSaved(false);
  };

  const handleDelete = (id: string) => {
    const updated = saved.filter((s) => s.id !== id);
    setSaved(updated);
    persistSaved(updated);
  };

  const handleNew = () => setData(defaultData);

  const handleExportPDF = async () => {
    const docRoot = previewRef.current;
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
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleNew}>New</button>
          <button className="btn-secondary" onClick={handleSave}>Save</button>
          <div className="saved-dropdown" ref={savedDropdownRef}>
            <button
              className={`btn-secondary${showSaved ? ' active' : ''}`}
              onClick={() => setShowSaved((v) => !v)}
            >
              Saved{saved.length > 0 ? ` (${saved.length})` : ''}
            </button>
            {showSaved && (
              <div className="saved-panel">
                {saved.length === 0 ? (
                  <p className="saved-empty">No saved proposals yet.</p>
                ) : (
                  saved.map((entry) => (
                    <div key={entry.id} className="saved-item">
                      <div className="saved-item-info">
                        <span className="saved-item-name">{entry.name}</span>
                        <span className="saved-item-date">
                          {new Date(entry.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="saved-item-btns">
                        <button onClick={() => handleLoad(entry)}>Load</button>
                        <button className="saved-item-del" onClick={() => handleDelete(entry.id)}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button className="btn-export" onClick={handleExportPDF}>Export PDF</button>
        </div>
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
