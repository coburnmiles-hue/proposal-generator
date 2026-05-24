import { forwardRef } from 'react';
import type { ProposalData } from '../types';
import { SpotOnLogo } from './SpotOnLogo';

interface Props {
  data: ProposalData;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export const ProposalPreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {


  return (
    <div className="doc-root" ref={ref}>
      {/* Page header */}
      <div className="doc-page-header">
        <div className="better-together">
          Better <strong>together</strong><span className="bt-dot">.</span>
        </div>
        <div className="doc-page-meta">
          {data.clientName && <span>{data.clientName}</span>}
        </div>
      </div>

      {/* Prepared for intro */}
      {(data.clientCompany || data.clientName) && (
        <div className="doc-intro">
          <p className="doc-intro-label">Prepared for</p>
          <h1 className="doc-intro-name">{data.clientCompany || data.clientName}</h1>
          {data.clientCompany && data.clientName && (
            <p className="doc-intro-contact">{data.clientName}</p>
          )}
        </div>
      )}

      {/* What's Included + Logo Stack */}
      {data.features.length > 0 && data.plans.length > 0 && (() => {
        const ref = data.plans[0];
        return (
          <div className="features-area">
            {/* Table */}
            <div className="shared-features">
              <h2 className="doc-heading">What's Included</h2>
              <div className="shared-feature-table">
                <div className="sft-header">
                  <span className="sft-name"></span>
                  <span className="sft-col sft-col-spoton">SpotOn</span>
                  <span className="sft-col">Current</span>
                </div>
                {data.features.filter((f) => f.enabled !== false).map((f) => {
                  const pf = ref.features.find((x) => x.featureId === f.id);
                  const spoton = pf?.spotonIncluded ?? false;
                  const current = pf?.currentIncluded ?? false;
                  return (
                    <div key={f.id} className="sft-row">
                      <span className="sft-name">{f.name}</span>
                      <span className="sft-col">
                        <span className={`cf-icon ${spoton ? 'check' : 'cross'}`}>{spoton ? '✓' : '✗'}</span>
                      </span>
                      <span className="sft-col">
                        <span className={`cf-icon ${current ? 'check' : 'cross'}`}>{current ? '✓' : '✗'}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Logo stack */}
            <div className="features-logo-stack">
              <SpotOnLogo size="large" variant="dark" />
              <svg className="fls-x" width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
                <line x1="2" y1="2" x2="14" y2="14" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="14" y1="2" x2="2" y2="14" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {data.clientLogoUrl ? (
                <img src={data.clientLogoUrl} alt={data.clientCompany || 'Client'} className="fls-client-logo" />
              ) : (
                <div className="fls-placeholder">
                  {data.clientCompany || 'Client Logo'}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Current Rate Reference */}
      {data.currentRate && (data.currentRate.basisPoints > 0 || data.currentRate.interchangePerTx > 0 ||
        data.currentRate.flatPercentage > 0 || data.currentRate.flatPerTx > 0 ||
        data.currentRate.vmcPercentage > 0 || data.currentRate.amexPercentage > 0 ||
        data.currentRate.vmcNonQualPercentage > 0 || data.currentRate.vmcQualPercentage > 0 ||
        data.currentRate.amexNonQualPercentage > 0 || data.currentRate.amexQualPercentage > 0) && (
        <div className="doc-current-rate">
          <span className="dcr-label">Current Rate</span>
          <span className="dcr-badge">
            {data.currentRate.type === 'interchange+' ? 'Interchange+'
              : data.currentRate.type === 'flat' ? 'Flat Rate'
              : data.currentRate.type === 'dual-pricing' ? 'Dual Pricing'
              : data.currentRate.type === 'tiered-simple' ? 'Tiered Simple'
              : 'Tiered'}
          </span>
          <div className="dcr-details">
            {data.currentRate.type === 'interchange+' && (
              <span>{data.currentRate.basisPoints} bps + ${data.currentRate.interchangePerTx.toFixed(2)}</span>
            )}
            {(data.currentRate.type === 'flat' || data.currentRate.type === 'dual-pricing') && (
              <span>{data.currentRate.flatPercentage.toFixed(2)}% + ${data.currentRate.flatPerTx.toFixed(2)}</span>
            )}
            {data.currentRate.type === 'tiered-simple' && (
              <>
                <span><strong>Visa/MC/Disc:</strong> {data.currentRate.vmcPercentage.toFixed(2)}% + ${data.currentRate.vmcPerTx.toFixed(2)}</span>
                <span><strong>AMEX:</strong> {data.currentRate.amexPercentage.toFixed(2)}% + ${data.currentRate.amexPerTx.toFixed(2)}</span>
              </>
            )}
            {data.currentRate.type === 'tiered' && (
              <>
                <span><strong>Visa/MC/Disc</strong></span>
                <span>Non-Qual: {data.currentRate.vmcNonQualPercentage.toFixed(2)}%&nbsp;&nbsp;Qual: {data.currentRate.vmcQualPercentage.toFixed(2)}%&nbsp;&nbsp;Per Tx: ${data.currentRate.vmcPerTx.toFixed(2)}</span>
                <span><strong>AMEX</strong></span>
                <span>Non-Qual: {data.currentRate.amexNonQualPercentage.toFixed(2)}%&nbsp;&nbsp;Qual: {data.currentRate.amexQualPercentage.toFixed(2)}%&nbsp;&nbsp;Per Tx: ${data.currentRate.amexPerTx.toFixed(2)}</span>
              </>
            )}
          </div>
        </div>
      )}

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
                      : plan.rate.type === 'dual-pricing' ? 'Dual Pricing'
                      : plan.rate.type === 'tiered-simple' ? 'Tiered Simple'
                      : 'Tiered'}
                  </span>
                  <div className="card-rate-details">
                    {plan.rate.type === 'interchange+' && (
                      <span>{plan.rate.basisPoints} bps + ${plan.rate.interchangePerTx.toFixed(2)}</span>
                    )}
                    {plan.rate.type === 'flat' && (
                      <span>{plan.rate.flatPercentage.toFixed(2)}% + ${plan.rate.flatPerTx.toFixed(2)}</span>
                    )}
                    {plan.rate.type === 'dual-pricing' && (
                      <span>{plan.rate.flatPercentage.toFixed(2)}% + ${plan.rate.flatPerTx.toFixed(2)}</span>
                    )}
                    {plan.rate.type === 'tiered-simple' && (
                      <>
                        <span><strong>Visa/MC/Disc:</strong> {plan.rate.vmcPercentage.toFixed(2)}% + ${plan.rate.vmcPerTx.toFixed(2)}</span>
                        <span><strong>AMEX:</strong> {plan.rate.amexPercentage.toFixed(2)}% + ${plan.rate.amexPerTx.toFixed(2)}</span>
                      </>
                    )}
                    {plan.rate.type === 'tiered' && (
                      <>
                        <span><strong>Visa/MC/Disc</strong></span>
                        <span>Non-Qual: {plan.rate.vmcNonQualPercentage.toFixed(2)}%&nbsp;&nbsp;Qual: {plan.rate.vmcQualPercentage.toFixed(2)}%&nbsp;&nbsp;Per Tx: ${plan.rate.vmcPerTx.toFixed(2)}</span>
                        <span><strong>AMEX</strong></span>
                        <span>Non-Qual: {plan.rate.amexNonQualPercentage.toFixed(2)}%&nbsp;&nbsp;Qual: {plan.rate.amexQualPercentage.toFixed(2)}%&nbsp;&nbsp;Per Tx: ${plan.rate.amexPerTx.toFixed(2)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="card-summary">
                  <div className="card-summary-row">
                    <span className="cs-label">Monthly Software</span>
                    <span className="cs-amount cs-spoton">{fmt(plan.spotonMonthly)}</span>
                  </div>
                  <div className="card-summary-row">
                    <span className="cs-label">Current Software</span>
                    <span className="cs-amount cs-current">{fmt(data.currentMonthly)}</span>
                  </div>
                  <div className="card-summary-row cs-hardware-row">
                    <span className="cs-label">Hardware + Implementation</span>
                    <span className="cs-amount cs-hardware">{fmt(plan.hardwarePrice)}</span>
                  </div>
                </div>
              </div>

              {/* Card footer */}
              <div className="card-footer">
                <div className="card-footer-label">Savings</div>
                <div className="card-footer-savings">
                  {(() => {
                    const monthly = (data.currentMonthly - plan.spotonMonthly) + (data.currentProcessing - plan.spotonProcessing);
                    return (
                      <>
                        <div className="card-footer-savings-item">
                          <span className="savings-period">Monthly</span>
                          <span className="savings-amount">{fmt(monthly)}</span>
                        </div>
                        <div className="card-footer-savings-item">
                          <span className="savings-period">Yearly</span>
                          <span className="savings-amount">{fmt(monthly * 12)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
});

ProposalPreview.displayName = 'ProposalPreview';
