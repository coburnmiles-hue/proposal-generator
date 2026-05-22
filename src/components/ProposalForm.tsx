import { v4 as uuidv4 } from 'uuid';
import type { Feature, Plan, PlanFeature, ProposalData } from '../types';

interface Props {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

export function ProposalForm({ data, onChange }: Props) {
  const set = <K extends keyof ProposalData>(field: K, value: ProposalData[K]) =>
    onChange({ ...data, [field]: value });

  // ---- Features ----
  const addFeature = () => {
    const feature: Feature = { id: uuidv4(), name: '' };
    const newFeatures = [...data.features, feature];
    // sync all plans
    const plans = data.plans.map((p) => ({
      ...p,
      features: [...p.features, { featureId: feature.id, spotonIncluded: false, currentIncluded: false }],
    }));
    onChange({ ...data, features: newFeatures, plans });
  };

  const updateFeature = (id: string, name: string) => {
    set('features', data.features.map((f) => (f.id === id ? { ...f, name } : f)));
  };

  const removeFeature = (id: string) => {
    const features = data.features.filter((f) => f.id !== id);
    const plans = data.plans.map((p) => ({
      ...p,
      features: p.features.filter((pf) => pf.featureId !== id),
    }));
    onChange({ ...data, features, plans });
  };

  // ---- Plans ----
  const addPlan = () => {
    if (data.plans.length >= 3) return;
    const plan: Plan = {
      id: uuidv4(),
      name: `Option ${data.plans.length + 1}`,
      description: '',
      spotonMonthly: 0,
      currentMonthly: 0,
      hardwarePrice: 0,
      totalInvestment: 0,
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

  const toggleFeature = (planId: string, featureId: string, col: 'spotonIncluded' | 'currentIncluded') => {
    set(
      'plans',
      data.plans.map((p) =>
        p.id !== planId
          ? p
          : {
              ...p,
              features: p.features.map((pf) =>
                pf.featureId === featureId ? { ...pf, [col]: !pf[col] } : pf
              ),
            }
      )
    );
  };

  const getPlanFeature = (plan: Plan, featureId: string): PlanFeature =>
    plan.features.find((pf) => pf.featureId === featureId) ?? {
      featureId,
      spotonIncluded: false,
      currentIncluded: false,
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
      </section>

      {/* Features List */}
      <section className="form-section">
        <div className="section-header">
          <h3>Features</h3>
          <button className="btn-add" onClick={addFeature}>+ Add</button>
        </div>
        <p className="form-hint">These appear as rows in every plan's comparison table.</p>
        <div className="feature-list">
          {data.features.map((f, i) => (
            <div key={f.id} className="feature-row">
              <span className="line-num">#{i + 1}</span>
              <input
                value={f.name}
                onChange={(e) => updateFeature(f.id, e.target.value)}
                placeholder="e.g. Online Ordering"
              />
              <button className="btn-remove" onClick={() => removeFeature(f.id)}>✕</button>
            </div>
          ))}
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

            <div className="field-group">
              <label>
                {data.companyName || 'SpotOn'} Monthly ($)
                <input
                  type="number"
                  min={0}
                  value={plan.spotonMonthly}
                  onChange={(e) => updatePlan(plan.id, 'spotonMonthly', parseFloat(e.target.value) || 0)}
                />
              </label>
              <label>
                Current Monthly ($)
                <input
                  type="number"
                  min={0}
                  value={plan.currentMonthly}
                  onChange={(e) => updatePlan(plan.id, 'currentMonthly', parseFloat(e.target.value) || 0)}
                />
              </label>
            </div>

            <div className="field-group">
              <label>
                Hardware + Implementation ($)
                <input
                  type="number"
                  min={0}
                  value={plan.hardwarePrice}
                  onChange={(e) => updatePlan(plan.id, 'hardwarePrice', parseFloat(e.target.value) || 0)}
                />
              </label>
              <label>
                Total Investment ($)
                <input
                  type="number"
                  min={0}
                  value={plan.totalInvestment}
                  onChange={(e) => updatePlan(plan.id, 'totalInvestment', parseFloat(e.target.value) || 0)}
                />
              </label>
            </div>

            {/* Feature toggles */}
            {data.features.length > 0 && (
              <div className="feature-toggles">
                <div className="feature-toggle-header">
                  <span className="ft-name">Feature</span>
                  <span className="ft-col">{data.companyName || 'SpotOn'}</span>
                  <span className="ft-col">Current</span>
                </div>
                {data.features.map((f) => {
                  const pf = getPlanFeature(plan, f.id);
                  return (
                    <div key={f.id} className="feature-toggle-row">
                      <span className="ft-name">{f.name || <em>unnamed</em>}</span>
                      <span className="ft-col">
                        <button
                          className={`toggle-btn ${pf.spotonIncluded ? 'on' : 'off'}`}
                          onClick={() => toggleFeature(plan.id, f.id, 'spotonIncluded')}
                        >
                          {pf.spotonIncluded ? '✓' : '✗'}
                        </button>
                      </span>
                      <span className="ft-col">
                        <button
                          className={`toggle-btn ${pf.currentIncluded ? 'on' : 'off'}`}
                          onClick={() => toggleFeature(plan.id, f.id, 'currentIncluded')}
                        >
                          {pf.currentIncluded ? '✓' : '✗'}
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
