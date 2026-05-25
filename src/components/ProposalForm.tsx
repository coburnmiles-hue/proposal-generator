import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Plan, PlanFeature, PlanRate, ProposalData } from '../types';
import { hasRateAnalysisData, calcProjectedProcessing } from '../utils';

/** Controlled numeric input that allows typing values like 0.05 without swallowing zeros */
function NumericInput({ value, onChange, ...props }: {
  value: number;
  onChange: (val: number) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [raw, setRaw] = useState(value === 0 ? '' : String(value));

  useEffect(() => {
    const parsed = parseFloat(raw);
    if (isNaN(parsed) ? value !== 0 : parsed !== value) {
      setRaw(value === 0 ? '' : String(value));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={raw}
      onChange={(e) => {
        const s = e.target.value;
        if (s === '' || /^\d*\.?\d*$/.test(s)) {
          setRaw(s);
          onChange(s === '' || s === '.' ? 0 : parseFloat(s) || 0);
        }
      }}
      {...props}
    />
  );
}

function fmtCurr(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

interface Props {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

export function ProposalForm({ data, onChange }: Props) {
  const set = <K extends keyof ProposalData>(field: K, value: ProposalData[K]) =>
    onChange({ ...data, [field]: value });

  // ---- Features ----
  const [newFeatName, setNewFeatName] = useState('');

  const addFeature = (name: string) => {
    if (!name.trim()) return;
    const id = uuidv4();
    const newFeatures = [...data.features, { id, name: name.trim(), enabled: true }];
    const plans = data.plans.map((p) => ({
      ...p,
      features: [...p.features, { featureId: id, spotonIncluded: false, currentIncluded: false }],
    }));
    onChange({ ...data, features: newFeatures, plans });
  };

  const removeFeature = (id: string) => {
    const features = data.features.filter((f) => f.id !== id);
    const plans = data.plans.map((p) => ({
      ...p,
      features: p.features.filter((pf) => pf.featureId !== id),
    }));
    onChange({ ...data, features, plans });
  };

  const toggleFeatureEnabled = (id: string) => {
    set('features', data.features.map((f) =>
      f.id === id ? { ...f, enabled: !(f.enabled !== false) } : f
    ));
  };

  const moveFeature = (id: string, dir: -1 | 1) => {
    const idx = data.features.findIndex((f) => f.id === id);
    const next = idx + dir;
    if (next < 0 || next >= data.features.length) return;
    const arr = [...data.features];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    set('features', arr);
  };

  // ---- Plans ----
  const addPlan = () => {
    if (data.plans.length >= 3) return;
    const plan: Plan = {
      id: uuidv4(),
      name: `Option ${data.plans.length + 1}`,
      description: '',
      rate: {
        type: 'interchange+',
        basisPoints: 0, interchangePerTx: 0,
        flatPercentage: 0, flatPerTx: 0,
        vmcPercentage: 0, vmcPerTx: 0,
        amexPercentage: 0, amexPerTx: 0,
        vmcNonQualPercentage: 0, vmcQualPercentage: 0,
        amexNonQualPercentage: 0, amexQualPercentage: 0,
      },
      spotonMonthly: 0,
      spotonProcessing: 0,
      hardwarePrice: 0,
      features: data.features.map((f) => ({
        featureId: f.id,
        spotonIncluded: false,
        currentIncluded: false,
      })),
    };
    set('plans', [...data.plans, plan]);
  };

  const removePlan = (id: string) => {
    set('plans', data.plans.filter((p) => p.id !== id));
  };

  const updatePlan = <K extends keyof Plan>(planId: string, field: K, value: Plan[K]) => {
    set('plans', data.plans.map((p) => (p.id === planId ? { ...p, [field]: value } : p)));
  };

  // Toggle a feature across ALL plans simultaneously (shared comparison table)
  const toggleSharedFeature = (featureId: string, col: 'spotonIncluded' | 'currentIncluded') => {
    const ref = data.plans[0];
    if (!ref) return;
    const current = ref.features.find((pf) => pf.featureId === featureId)?.[col] ?? false;
    const newVal = !current;
    onChange({
      ...data,
      plans: data.plans.map((p) => ({
        ...p,
        features: p.features.map((pf) =>
          pf.featureId === featureId ? { ...pf, [col]: newVal } : pf
        ),
      })),
    });
  };

  const getPlanFeature = (plan: Plan, featureId: string): PlanFeature =>
    plan.features.find((pf) => pf.featureId === featureId) ?? {
      featureId,
      spotonIncluded: false,
      currentIncluded: false,
    };

  // ---- Rate Analysis image parsing ----
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('openai-api-key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseMsg, setParseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem('openai-api-key', trimmed);
    setShowApiKeyInput(false);
  };

  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('openai-api-key');
  };

  const parseRateAnalysis = async (file: File) => {
    if (!apiKey) {
      setParseMsg({ type: 'error', text: 'Set an OpenAI API key above to use auto-fill.' });
      return;
    }
    setIsParsing(true);
    setParseMsg(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'This is a payment processing rate analysis. Return ONLY a raw JSON object (no markdown, no explanation):\n{"vmcTransactions": <integer: transaction count from Transaction Fee row for Visa/MC/Discover>, "vmcVolume": <float: total dollar volume from Total Visa/MC/Discover row>, "vmcCurrentCost": <float: total current cost from Total Visa/MC/Discover row>, "amexTransactions": <integer: transaction count from Transaction Fee row for AMEX>, "amexVolume": <float: total dollar volume from Total AMEX row>, "amexCurrentCost": <float: total current cost from Total AMEX row>}\nIgnore ATM and any other card types. Use 0 for any value not found.',
              },
              { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
            ],
          }],
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `API error ${response.status}`);
      }

      const result = await response.json();
      const text = (result.choices?.[0]?.message?.content ?? '').trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse AI response.');

      const p = JSON.parse(jsonMatch[0]);
      const vmcTx   = Math.round(Number(p.vmcTransactions)  || 0);
      const vmcVol  = Number(p.vmcVolume)       || 0;
      const vmcCost = Number(p.vmcCurrentCost)  || 0;
      const amexTx  = Math.round(Number(p.amexTransactions) || 0);
      const amexVol = Number(p.amexVolume)      || 0;
      const amexCost= Number(p.amexCurrentCost) || 0;

      onChange({
        ...data,
        rateAnalysis: { vmcTransactions: vmcTx, vmcVolume: vmcVol, amexTransactions: amexTx, amexVolume: amexVol },
        currentProcessing: Math.round((vmcCost + amexCost) * 100) / 100,
      });

      setParseMsg({ type: 'success', text: `Auto-filled — V/MC/D: ${vmcTx.toLocaleString()} tx · ${fmtCurr(vmcVol)}  |  Amex: ${amexTx.toLocaleString()} tx · ${fmtCurr(amexVol)}  |  Current processing: ${fmtCurr(vmcCost + amexCost)}/mo` });
    } catch (err) {
      setParseMsg({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error.' });
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="form-panel">
      {/* Client Info */}
      <section className="form-section">
        <h3>Client Info</h3>
        <div className="field-group">
          <label>
            Client Name
            <input value={data.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="John Smith" />
          </label>
          <label>
            Company
            <input value={data.clientCompany} onChange={(e) => set('clientCompany', e.target.value)} placeholder="The Restaurant" />
          </label>
        </div>
        <div className="field-group">
          <label>
            Your Company
            <input value={data.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="SpotOn" />
          </label>
          <label>
            Date
            <input type="date" value={data.date} onChange={(e) => set('date', e.target.value)} />
          </label>
        </div>

        {/* Client logo upload */}
        <div className="logo-upload-field">
          <span className="logo-upload-label">Client Logo</span>
          {data.clientLogoUrl ? (
            <div className="logo-upload-preview">
              <img src={data.clientLogoUrl} alt="Client logo" />
              <button
                className="btn-remove"
                onClick={() => set('clientLogoUrl', '')}
                title="Remove logo"
              >✕</button>
            </div>
          ) : (
            <label className="logo-upload-btn">
              Upload Logo
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => set('clientLogoUrl', ev.target?.result as string);
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="form-section">
        <div className="section-header">
          <h3>Features</h3>
        </div>
        <p className="form-hint">Check to include in proposal. Toggle ✓/✗ for SpotOn vs Current coverage.</p>
        <div className="feat-header">
          <span /><span /><span />
          <span className="ft-col">{data.companyName || 'SpotOn'}</span>
          <span className="ft-col">Current</span>
          <span />
        </div>
        <div className="feat-list">
          {data.features.map((f, i) => {
            const pf = data.plans.length > 0 ? getPlanFeature(data.plans[0], f.id) : null;
            const isEnabled = f.enabled !== false;
            return (
              <div key={f.id} className={`feat-row${isEnabled ? '' : ' feat-row-disabled'}`}>
                <div className="feat-reorder">
                  <button disabled={i === 0} onClick={() => moveFeature(f.id, -1)} title="Move up">▲</button>
                  <button disabled={i === data.features.length - 1} onClick={() => moveFeature(f.id, 1)} title="Move down">▼</button>
                </div>
                <input
                  type="checkbox"
                  className="feat-checkbox"
                  checked={isEnabled}
                  onChange={() => toggleFeatureEnabled(f.id)}
                />
                <span className="feat-name">{f.name}</span>
                {pf ? (
                  <button className={`toggle-btn ${pf.spotonIncluded ? 'on' : 'off'}`}
                    onClick={() => toggleSharedFeature(f.id, 'spotonIncluded')}>
                    {pf.spotonIncluded ? '✓' : '✗'}
                  </button>
                ) : <span />}
                {pf ? (
                  <button className={`toggle-btn ${pf.currentIncluded ? 'on' : 'off'}`}
                    onClick={() => toggleSharedFeature(f.id, 'currentIncluded')}>
                    {pf.currentIncluded ? '✓' : '✗'}
                  </button>
                ) : <span />}
                <button className="btn-remove" onClick={() => removeFeature(f.id)}>✕</button>
              </div>
            );
          })}
        </div>
        <div className="feat-add-row">
          <input
            value={newFeatName}
            onChange={(e) => setNewFeatName(e.target.value)}
            placeholder="Add a feature…"
            onKeyDown={(e) => { if (e.key === 'Enter') { addFeature(newFeatName); setNewFeatName(''); } }}
          />
          <button className="btn-add" onClick={() => { addFeature(newFeatName); setNewFeatName(''); }}>+ Add</button>
        </div>
      </section>

      {/* Processing Calculator */}
      <section className="form-section calc-section">
        <div className="section-header">
          <h3>Processing Savings Calculator</h3>
        </div>

        {/* Rate Analysis */}
        <div className="ra-block">
          <div className="ra-header">
            <h4 className="ra-title">Rate Analysis</h4>
            <div className="ra-key-bar">
              {apiKey ? (
                <>
                  <span className="ra-key-set">&#128273; API key set</span>
                  <button className="ra-key-link" onClick={clearApiKey}>clear</button>
                </>
              ) : (
                <button className="ra-key-link" onClick={() => { setShowApiKeyInput(true); setApiKeyDraft(''); }}>
                  &#128273; Set OpenAI key
                </button>
              )}
            </div>
          </div>

          {showApiKeyInput && (
            <div className="ra-key-input-row">
              <input
                type="password"
                placeholder="sk-..."
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                className="ra-key-input"
                onKeyDown={(e) => { if (e.key === 'Enter') saveApiKey(apiKeyDraft); if (e.key === 'Escape') setShowApiKeyInput(false); }}
                autoFocus
              />
              <button className="btn-add" onClick={() => saveApiKey(apiKeyDraft)}>Save</button>
              <button className="btn-remove" onClick={() => setShowApiKeyInput(false)}>&#10005;</button>
            </div>
          )}

          <div className="ra-upload-row">
            <label className={`ra-upload-btn${!apiKey || isParsing ? ' ra-upload-disabled' : ''}`}>
              {isParsing ? '⏳ Parsing…' : '📄 Upload Rate Analysis'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={!apiKey || isParsing}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) parseRateAnalysis(f); }}
              />
            </label>
            {!apiKey && <span className="ra-upload-hint">Set an OpenAI API key to enable auto-fill</span>}
          </div>

          {parseMsg && (
            <div className={`ra-parse-msg ra-parse-${parseMsg.type}`}>{parseMsg.text}</div>
          )}

          <p className="form-hint" style={{ marginTop: 6 }}>Or enter manually:</p>

          <div className="rate-group-label">Visa / MC / Discover</div>
          <div className="field-group">
            <label>
              Transactions
              <NumericInput value={data.rateAnalysis.vmcTransactions} onChange={(val) => set('rateAnalysis', { ...data.rateAnalysis, vmcTransactions: val })} min={0} />
            </label>
            <label>
              Total Volume ($)
              <NumericInput value={data.rateAnalysis.vmcVolume} onChange={(val) => set('rateAnalysis', { ...data.rateAnalysis, vmcVolume: val })} min={0} />
            </label>
          </div>

          <div className="rate-group-label">AMEX</div>
          <div className="field-group">
            <label>
              Transactions
              <NumericInput value={data.rateAnalysis.amexTransactions} onChange={(val) => set('rateAnalysis', { ...data.rateAnalysis, amexTransactions: val })} min={0} />
            </label>
            <label>
              Total Volume ($)
              <NumericInput value={data.rateAnalysis.amexVolume} onChange={(val) => set('rateAnalysis', { ...data.rateAnalysis, amexVolume: val })} min={0} />
            </label>
          </div>

          {hasRateAnalysisData(data.rateAnalysis) && (() => {
            const ra = data.rateAnalysis;
            const vmcAvgTicket = ra.vmcTransactions > 0 ? ra.vmcVolume / ra.vmcTransactions : 0;
            const amexAvgTicket = ra.amexTransactions > 0 ? ra.amexVolume / ra.amexTransactions : 0;
            return (
              <div className="ra-summary">
                {vmcAvgTicket > 0 && (
                  <div className="ra-summary-row"><span>VMC Avg Ticket</span><strong>{fmtCurr(vmcAvgTicket)}</strong></div>
                )}
                {amexAvgTicket > 0 && (
                  <div className="ra-summary-row"><span>Amex Avg Ticket</span><strong>{fmtCurr(amexAvgTicket)}</strong></div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="calc-divider" />
        <p className="form-hint">Enter what the client currently pays each month.</p>
        <div className="field-group">
          <label>
            Current Monthly Software ($)
            <NumericInput value={data.currentMonthly} onChange={(val) => set('currentMonthly', val)} min={0} />
          </label>
          <label>
            Current Monthly Processing ($)
            <NumericInput value={data.currentProcessing} onChange={(val) => set('currentProcessing', val)} min={0} />
          </label>
        </div>
        <div className="calc-divider" />
        <p className="form-hint" style={{ marginTop: 4 }}>Current processing rate — shown on proposal for reference only.</p>
        <div className="rate-section">
          <label className="rate-type-label">
            Current Processing Rate
            <select
              value={data.currentRate.type}
              onChange={(e) => set('currentRate', { ...data.currentRate, type: e.target.value as PlanRate['type'] })}
            >
              <option value="interchange+">Interchange+</option>
              <option value="flat">Flat</option>
              <option value="dual-pricing">Dual Pricing</option>
              <option value="tiered-simple">Tiered Simple</option>
              <option value="tiered">Tiered</option>
            </select>
          </label>
          {data.currentRate.type === 'interchange+' && (
            <div className="field-group">
              <label>Basis Points
                <NumericInput value={data.currentRate.basisPoints} onChange={(val) => set('currentRate', { ...data.currentRate, basisPoints: val })} min={0} />
              </label>
              <label>Per Transaction ($)
                <NumericInput value={data.currentRate.interchangePerTx} onChange={(val) => set('currentRate', { ...data.currentRate, interchangePerTx: val })} min={0} />
              </label>
            </div>
          )}
          {data.currentRate.type === 'flat' && (
            <div className="field-group">
              <label>Percentage (%)
                <NumericInput value={data.currentRate.flatPercentage} onChange={(val) => set('currentRate', { ...data.currentRate, flatPercentage: val })} min={0} />
              </label>
              <label>Per Transaction ($)
                <NumericInput value={data.currentRate.flatPerTx} onChange={(val) => set('currentRate', { ...data.currentRate, flatPerTx: val })} min={0} />
              </label>
            </div>
          )}
          {data.currentRate.type === 'dual-pricing' && (
            <div className="field-group">
              <label>Percentage (%)
                <NumericInput value={data.currentRate.flatPercentage} onChange={(val) => set('currentRate', { ...data.currentRate, flatPercentage: val })} min={0} />
              </label>
              <label>Per Transaction ($)
                <NumericInput value={data.currentRate.flatPerTx} onChange={(val) => set('currentRate', { ...data.currentRate, flatPerTx: val })} min={0} />
              </label>
            </div>
          )}
          {data.currentRate.type === 'tiered-simple' && (
            <>
              <div className="rate-group-label">Visa / MC / Discover</div>
              <div className="field-group">
                <label>Rate (%)
                  <NumericInput value={data.currentRate.vmcPercentage} onChange={(val) => set('currentRate', { ...data.currentRate, vmcPercentage: val })} min={0} />
                </label>
                <label>Per Transaction ($)
                  <NumericInput value={data.currentRate.vmcPerTx} onChange={(val) => set('currentRate', { ...data.currentRate, vmcPerTx: val })} min={0} />
                </label>
              </div>
              <div className="rate-group-label">AMEX</div>
              <div className="field-group">
                <label>Rate (%)
                  <NumericInput value={data.currentRate.amexPercentage} onChange={(val) => set('currentRate', { ...data.currentRate, amexPercentage: val })} min={0} />
                </label>
                <label>Per Transaction ($)
                  <NumericInput value={data.currentRate.amexPerTx} onChange={(val) => set('currentRate', { ...data.currentRate, amexPerTx: val })} min={0} />
                </label>
              </div>
            </>
          )}
          {data.currentRate.type === 'tiered' && (
            <>
              <div className="rate-group-label">Visa / MC / Discover</div>
              <div className="field-group">
                <label>Non-Qualified (%)
                  <NumericInput value={data.currentRate.vmcNonQualPercentage} onChange={(val) => set('currentRate', { ...data.currentRate, vmcNonQualPercentage: val })} min={0} />
                </label>
                <label>Qualified (%)
                  <NumericInput value={data.currentRate.vmcQualPercentage} onChange={(val) => set('currentRate', { ...data.currentRate, vmcQualPercentage: val })} min={0} />
                </label>
              </div>
              <div className="field-group">
                <label>Per Transaction ($)
                  <NumericInput value={data.currentRate.vmcPerTx} onChange={(val) => set('currentRate', { ...data.currentRate, vmcPerTx: val })} min={0} />
                </label>
              </div>
              <div className="rate-group-label">AMEX</div>
              <div className="field-group">
                <label>Non-Qualified (%)
                  <NumericInput value={data.currentRate.amexNonQualPercentage} onChange={(val) => set('currentRate', { ...data.currentRate, amexNonQualPercentage: val })} min={0} />
                </label>
                <label>Qualified (%)
                  <NumericInput value={data.currentRate.amexQualPercentage} onChange={(val) => set('currentRate', { ...data.currentRate, amexQualPercentage: val })} min={0} />
                </label>
              </div>
              <div className="field-group">
                <label>Per Transaction ($)
                  <NumericInput value={data.currentRate.amexPerTx} onChange={(val) => set('currentRate', { ...data.currentRate, amexPerTx: val })} min={0} />
                </label>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Plans */}
      <section className="form-section">
        <div className="section-header">
          <h3>Plans ({data.plans.length}/3)</h3>
          {data.plans.length < 3 && (
            <button className="btn-add" onClick={addPlan}>+ Add Plan</button>
          )}
        </div>

        {data.plans.map((plan, pi) => (
          <div key={plan.id} className="plan-editor">
            <div className="plan-editor-header">
              <input
                className="plan-name-input"
                value={plan.name}
                onChange={(e) => updatePlan(plan.id, 'name', e.target.value)}
                placeholder={`Option ${pi + 1}`}
              />
              <button className="btn-remove" onClick={() => removePlan(plan.id)}>✕</button>
            </div>

            <label>
              Description
              <textarea
                rows={2}
                value={plan.description}
                onChange={(e) => updatePlan(plan.id, 'description', e.target.value)}
                placeholder="Sentence about this plan..."
              />
            </label>

            {/* Processing Rate */}
            <div className="rate-section">
              <label className="rate-type-label">
                Processing Rate
                <select
                  value={plan.rate.type}
                  onChange={(e) =>
                    updatePlan(plan.id, 'rate', { ...plan.rate, type: e.target.value as PlanRate['type'] })
                  }
                >
                  <option value="interchange+">Interchange+</option>
                  <option value="flat">Flat</option>
                  <option value="dual-pricing">Dual Pricing</option>
                  <option value="tiered-simple">Tiered Simple</option>
                  <option value="tiered">Tiered</option>
                </select>
              </label>

              {plan.rate.type === 'interchange+' && (
                <div className="field-group">
                  <label>
                    Basis Points
                    <NumericInput value={plan.rate.basisPoints} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, basisPoints: val })} min={0} />
                  </label>
                  <label>
                    Per Transaction ($)
                    <NumericInput value={plan.rate.interchangePerTx} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, interchangePerTx: val })} min={0} />
                  </label>
                </div>
              )}

              {plan.rate.type === 'flat' && (
                <div className="field-group">
                  <label>
                    Percentage (%)
                    <NumericInput value={plan.rate.flatPercentage} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, flatPercentage: val })} min={0} />
                  </label>
                  <label>
                    Per Transaction ($)
                    <NumericInput value={plan.rate.flatPerTx} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, flatPerTx: val })} min={0} />
                  </label>
                </div>
              )}

              {plan.rate.type === 'dual-pricing' && (
                <div className="field-group">
                  <label>
                    Percentage (%)
                    <NumericInput value={plan.rate.flatPercentage} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, flatPercentage: val })} min={0} />
                  </label>
                  <label>
                    Per Transaction ($)
                    <NumericInput value={plan.rate.flatPerTx} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, flatPerTx: val })} min={0} />
                  </label>
                </div>
              )}

              {plan.rate.type === 'tiered-simple' && (
                <>
                  <div className="rate-group-label">Visa / MC / Discover</div>
                  <div className="field-group">
                    <label>
                      Rate (%)
                      <NumericInput value={plan.rate.vmcPercentage} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, vmcPercentage: val })} min={0} />
                    </label>
                    <label>
                      Per Transaction ($)
                      <NumericInput value={plan.rate.vmcPerTx} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, vmcPerTx: val })} min={0} />
                    </label>
                  </div>
                  <div className="rate-group-label">AMEX</div>
                  <div className="field-group">
                    <label>
                      Rate (%)
                      <NumericInput value={plan.rate.amexPercentage} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, amexPercentage: val })} min={0} />
                    </label>
                    <label>
                      Per Transaction ($)
                      <NumericInput value={plan.rate.amexPerTx} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, amexPerTx: val })} min={0} />
                    </label>
                  </div>
                </>
              )}

              {plan.rate.type === 'tiered' && (
                <>
                  <div className="rate-group-label">Visa / MC / Discover</div>
                  <div className="field-group">
                    <label>
                      Non-Qualified (%)
                      <NumericInput value={plan.rate.vmcNonQualPercentage} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, vmcNonQualPercentage: val })} min={0} />
                    </label>
                    <label>
                      Qualified (%)
                      <NumericInput value={plan.rate.vmcQualPercentage} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, vmcQualPercentage: val })} min={0} />
                    </label>
                  </div>
                  <div className="field-group">
                    <label>
                      Per Transaction ($)
                      <NumericInput value={plan.rate.vmcPerTx} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, vmcPerTx: val })} min={0} />
                    </label>
                  </div>
                  <div className="rate-group-label">AMEX</div>
                  <div className="field-group">
                    <label>
                      Non-Qualified (%)
                      <NumericInput value={plan.rate.amexNonQualPercentage} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, amexNonQualPercentage: val })} min={0} />
                    </label>
                    <label>
                      Qualified (%)
                      <NumericInput value={plan.rate.amexQualPercentage} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, amexQualPercentage: val })} min={0} />
                    </label>
                  </div>
                  <div className="field-group">
                    <label>
                      Per Transaction ($)
                      <NumericInput value={plan.rate.amexPerTx} onChange={(val) => updatePlan(plan.id, 'rate', { ...plan.rate, amexPerTx: val })} min={0} />
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="field-group">
              <label>
                {data.companyName || 'SpotOn'} Monthly Software ($)
                <NumericInput value={plan.spotonMonthly} onChange={(val) => updatePlan(plan.id, 'spotonMonthly', val)} min={0} />
              </label>
              {(() => {
                const projected = calcProjectedProcessing(plan.rate, data.rateAnalysis);
                if (projected !== null) {
                  return (
                    <label className="calc-readonly-label">
                      {data.companyName || 'SpotOn'} Monthly Processing
                      <div className="calc-readonly-value">{fmtCurr(projected)}/mo</div>
                      <span className="calc-readonly-hint">auto-calculated from rate analysis</span>
                    </label>
                  );
                }
                return (
                  <label>
                    {data.companyName || 'SpotOn'} Monthly Processing ($)
                    <NumericInput value={plan.spotonProcessing} onChange={(val) => updatePlan(plan.id, 'spotonProcessing', val)} min={0} />
                  </label>
                );
              })()}
            </div>

            <div className="field-group">
              <label>
                Hardware + Implementation ($)
                <NumericInput value={plan.hardwarePrice} onChange={(val) => updatePlan(plan.id, 'hardwarePrice', val)} min={0} />
              </label>
              <label className="calc-readonly-label">
                Total Monthly Savings
                {(() => {
                  const currentProc = data.currentProcessing;
                  const projected = calcProjectedProcessing(plan.rate, data.rateAnalysis);
                  const planProc = projected !== null ? projected : plan.spotonProcessing;
                  const savings = (data.currentMonthly - plan.spotonMonthly) + (currentProc - planProc);
                  return (
                    <>
                      <div className="calc-readonly-value">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(savings)}/mo
                      </div>
                      <span className="calc-readonly-hint">software + processing savings</span>
                    </>
                  );
                })()}
              </label>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
