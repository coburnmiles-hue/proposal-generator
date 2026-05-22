import { forwardRef } from 'react';
import type { ProposalData } from '../types';
import { SpotOnLogo } from './SpotOnLogo';

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


  return (
    <div className="doc-root" ref={ref}>
      {/* Page header */}
      <div className="doc-page-header">
        <div className="doc-logos">
          <SpotOnLogo size="normal" variant="dark" />
          {data.clientLogoUrl && (
            <>
              <span className="doc-logo-x">×</span>
              <img
                src={data.clientLogoUrl}
                alt={data.clientCompany || 'Client'}
                className="doc-client-logo"
              />
            </>
          )}
        </div>
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
          {data.plans.map((plan, idx) => (
            <div key={plan.id} className={`plan-card theme-${idx}`}>
              {/* Card top */}
              <div className="card-top">
                {plan.name && <div className="card-plan-name">{plan.name}</div>}
                {plan.description && <p className="card-desc">{plan.description}</p>}

                <div className="card-summary">
                  <div className="card-summary-row">
                    <span className="cs-label">Proposed Monthly Software</span>
                    <span className="cs-amount cs-spoton">{fmt(plan.spotonMonthly)}</span>
                  </div>
                  <div className="card-summary-row">
                    <span className="cs-label">Current Software</span>
                    <span className="cs-amount cs-current">{fmt(plan.currentMonthly)}</span>
                  </div>
                  <div className="card-summary-row cs-hardware-row">
                    <span className="cs-label">Hardware + Implementation</span>
                    <span className="cs-amount cs-hardware">{fmt(plan.hardwarePrice)}</span>
                  </div>
                </div>
              </div>

              {/* Feature table */}
              {data.features.length > 0 && (
                <div className="card-features">
                  <div className="card-features-header">
                    <span className="cf-name"></span>
                    <span className="cf-col">
                      <span className="cf-col-dot spoton-dot" />SpotOn
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
                <div className="card-footer-label">Total Savings</div>
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
