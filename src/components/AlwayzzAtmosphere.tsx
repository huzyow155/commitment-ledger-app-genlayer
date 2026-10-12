import React, { useEffect } from "react";

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

export const AlwayzzLines: React.FC<{ variant?: "light" | "ocean" }> = ({
  variant = "light",
}) => {
  const variantClass = variant === "ocean" ? "ocean-lines" : "";
  return (
    <>
      <div
        className={`hero-lines side-lines left-lines ${variantClass}`}
        aria-hidden="true"
      >
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
      <div
        className={`hero-lines side-lines right-lines ${variantClass}`}
        aria-hidden="true"
      >
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
      <div className={`hero-lines top-lines ${variantClass}`} aria-hidden="true">
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

/**
 * Progressive-enhancement one-shot IntersectionObserver hook.
 * Content defaults to visible in CSS if JS is disabled or reduced motion is preferred.
 * Each observed element animates in once when entering the viewport and never replays.
 */
export function useScrollReveal(triggerKey?: unknown): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const selector = ".reveal-heading, .reveal-on-scroll";

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      document.documentElement.classList.remove("js-scroll-ready");
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    document.documentElement.classList.add("js-scroll-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -24px 0px",
      }
    );

    const registerElements = () => {
      const elements = document.querySelectorAll<HTMLElement>(
        ".reveal-heading:not(.is-revealed), .reveal-on-scroll:not(.is-revealed)"
      );
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          el.classList.add("is-revealed");
        } else {
          observer.observe(el);
        }
      });
    };

    registerElements();

    const mutationObserver = new MutationObserver(() => {
      registerElements();
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [triggerKey]);
}

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
