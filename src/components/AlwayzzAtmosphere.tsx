import React from "react";

const TICKER_ITEMS = [
  "Public Commitments",
  "Source-Grounded Resolution",
  "Multi-Validator Consensus",
  "Verbatim Evidence",
  "On-Chain Records",
];

const TRUSTED_DOMAINS: Array<[string, string]> = [
  ["wikipedia.org", "logo-notion"],
  ["reuters.com", "logo-linear"],
  ["apnews.com", "logo-webflow"],
  ["bbc.com", "logo-stripe"],
  ["nasa.gov", "logo-vercel"],
  ["noaa.gov", "logo-figma"],
  ["ecb.europa.eu", "logo-framer"],
  ["GenLayer Studionet", "logo-slack"],
  ["strict_eq Consensus", "logo-shopify"],
  ["Source-Grounded", "logo-airbnb"],
];

export const AlwayzzLines: React.FC = () => {
  return (
    <>
      <div className="hero-lines side-lines left-lines" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => (
          <span
            key={`left-${i}`}
            className="curve-line"
            style={{
              animationDelay: `-${i * 0.25}s`,
              width: `${60 + i * 10}px`,
            }}
          />
        ))}
      </div>
      <div className="hero-lines side-lines right-lines" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => (
          <span
            key={`right-${i}`}
            className="curve-line"
            style={{
              animationDelay: `-${i * 0.25}s`,
              width: `${60 + i * 10}px`,
            }}
          />
        ))}
      </div>
      <div className="hero-lines top-lines" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={`top-${i}`}
            className="top-line"
            style={{
              animationDelay: `-${i * 0.25}s`,
              width: `${72 + i * 9}px`,
            }}
          />
        ))}
      </div>
    </>
  );
};

export const AlwayzzTicker: React.FC<{ items?: string[]; ariaLabel?: string }> = ({
  items = TICKER_ITEMS,
  ariaLabel = "Protocol capabilities",
}) => {
  const repeatedItems: string[] = [];
  for (let copy = 0; copy < 4; copy++) {
    items.forEach((item) => repeatedItems.push(item));
  }

  return (
    <div className="ticker" aria-label={ariaLabel}>
      <div className="ticker-track">
        {repeatedItems.map((item, idx) => (
          <span key={`${item}-${idx}`} className="ticker-item">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export const AlwayzzTrustedSection: React.FC = () => {
  const repeatedDomains: Array<[string, string]> = [];
  for (let copy = 0; copy < 2; copy++) {
    TRUSTED_DOMAINS.forEach((entry) => repeatedDomains.push(entry));
  }

  return (
    <section id="trusted" className="trusted-section">
      <p className="trusted-label">Resolves against 7 fixed allowlisted public sources</p>
      <div className="trusted-marquee" aria-label="Allowlisted public reference domains">
        <div className="trusted-track">
          {repeatedDomains.map(([name, className], idx) => (
            <span key={`${name}-${idx}`} className={`company-logo ${className}`}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
