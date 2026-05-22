import { forwardRef } from 'react';
import type { ProposalData } from '../types';

interface Props {
  data: ProposalData;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function fmtDate(s: string) {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export const ProposalPreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const spotonName = data.companyName || 'SpotOn';

  return (
    <div className="doc-root" ref={ref}>
      {/* Page header */}
      <div className="doc-page-header">
        {data.companyName && <div className="doc-brand">{data.companyName}</div>}
        <div className="doc-page-meta">
          {data.clientCompany && <span>{data.clientCompany}</span>}
          {data.clientName && <span>{data.clientName}</span>}
          {data.date && <span>{fmtDate(data.date)}</span>}
        </div>
      </div>

      <h2 className="doc-heading">Your Options</h2>

      {/* Cards */}
      {data.plans.length === 0 ? (
        <div className="doc-empty">Add a plan on the left to see your proposal preview.</div>
      ) : (
        <div className={`doc-cards doc-cards-${data.plans.length}`}>
          {data.plans.map((plan) => (
            <div key={plan.id} className="plan-card">
              {/* Card top */}
              <div className="card-top">
                {plan.name && <div className="card-plan-name">{plan.name}</div>}
                {plan.description && <p className="card-desc">{plan.description}</p>}

                <div className="card-pricing">
                  <div className="card-price-row">
                    <div className="card-price-block">
                      <div className="card-price-amount">{fmt(plan.spotonMonthly)}</div>
                      <div className="card-price-label">Monthly Software</div>
                    </div>
                    {plan.currentMonthly > 0 && (
                      <div className="card-price-block card-price-current">
                        <div className="card-price-amount current">{fmt(plan.currentMonthly)}</div>
                        <div className="card-price-label current">Current Monthly<br />Software</div>
                      </div>
                    )}
                  </div>

                  {plan.hardwarePrice > 0 && (
                    <div className="card-hardware-row">
                      <div className="card-price-amount hardware">{fmt(plan.hardwarePrice)}</div>
                      <div className="card-price-label hardware">Hardware + Implementation</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Feature table */}
              {data.features.length > 0 && (
                <div className="card-features">
                  <div className="card-features-header">
                    <span className="cf-name"></span>
                    <span className="cf-col">
                      <span className="cf-col-dot spoton-dot" />
                      {spotonName}
                    </span>
                    <span className="cf-col">
                      <span className="cf-col-dot current-dot" />
                      Current
                    </span>
                  </div>
                  {data.features.map((f) => {
                    const pf = plan.features.find((x) => x.featureId === f.id);
                    const spoton = pf?.spotonIncluded ?? false;
                    const current = pf?.currentIncluded ?? false;
                    return (
                      <div key={f.id} className="cf-row">
                        <span className="cf-name">{f.name}</span>
                        <span className="cf-col">
                          <span className={`cf-icon ${spoton ? 'check' : 'cross'}`}>
                            {spoton ? '✓' : '✗'}
                          </span>
                        </span>
                        <span className="cf-col">
                          <span className={`cf-icon ${current ? 'check' : 'cross'}`}>
                            {current ? '✓' : '✗'}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Card footer */}
              <div className="card-footer">
                <div className="card-footer-label">Total Investment</div>
                <div className="card-footer-amount">{fmt(plan.totalInvestment)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ProposalPreview.displayName = 'ProposalPreview';
