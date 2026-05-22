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

      {/* Shared pricing banner */}
      <div className="doc-pricing-banner">
        <div className="dpb-block">
          <div className="dpb-amount">{fmt(data.spotonMonthly)}<span className="dpb-period">/mo</span></div>
          <div className="dpb-label">Proposed Monthly Software</div>
        </div>
        <div className="dpb-divider" />
        <div className="dpb-block">
          <div className="dpb-amount dpb-current">{fmt(data.currentMonthly)}<span className="dpb-period">/mo</span></div>
          <div className="dpb-label">Current Monthly Software</div>
        </div>
        <div className="dpb-divider" />
        <div className="dpb-block">
          <div className="dpb-amount">{fmt(data.hardwarePrice)}</div>
          <div className="dpb-label">Hardware + Implementation</div>
        </div>
      </div>

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

                {/* Processing rate */}
                <div className="card-rate">
                  <span className="card-rate-badge">
                    {plan.rate.type === 'interchange+' ? 'Interchange+'
                      : plan.rate.type === 'flat' ? 'Flat Rate'
                      : 'Tiered'}
                  </span>
                  <div className="card-rate-details">
                    {plan.rate.type === 'interchange+' && (
                      <span>{plan.rate.basisPoints} bps + ${plan.rate.interchangePerTx.toFixed(2)}/tx</span>
                    )}
                    {plan.rate.type === 'flat' && (
                      <span>{plan.rate.flatPercentage.toFixed(2)}% + ${plan.rate.flatPerTx.toFixed(2)}/tx</span>
                    )}
                    {plan.rate.type === 'tiered' && (
                      <>
                        <span>Visa/MC/Disc: {plan.rate.vmcPercentage.toFixed(2)}% + ${plan.rate.vmcPerTx.toFixed(2)}/tx</span>
                        <span>AMEX: {plan.rate.amexPercentage.toFixed(2)}% + ${plan.rate.amexPerTx.toFixed(2)}/tx</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Feature table */}
              {data.features.length > 0 && (
                <div className="card-features">
                  <div className="card-features-header">
                    <span className="cf-name"></span>
                    <span className="cf-col cf-col-spoton">SpotOn</span>
                    <span className="cf-col">Current</span>
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
