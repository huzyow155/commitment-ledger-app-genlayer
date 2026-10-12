import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Copy,
  Check,
  ExternalLink,
  Key,
  RefreshCw,
  Download,
  Upload,
  Shield,
  ChevronDown,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  CONTRACT_ADDRESS,
  NETWORK_STATUS,
  getExplorerAddressUrl,
} from "../config/chain";

const ArrowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const BrandLogoMark: React.FC<{
  className?: string;
  variant?: "editorial" | "ocean";
}> = ({ className = "wordmark-logo", variant = "editorial" }) => {
  const isOcean = variant === "ocean";
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="15"
        fill={isOcean ? "#f8fbff" : "#0a0a0a"}
        stroke={isOcean ? "#7fd0ff" : "#164777"}
        strokeWidth="2"
      />
      <rect
        x="8.5"
        y="8.5"
        width="47"
        height="47"
        rx="11"
        stroke={isOcean ? "#0a1f3d" : "#ffffff"}
        strokeWidth="1.25"
        strokeOpacity={isOcean ? "0.2" : "0.24"}
      />
      <line
        x1="18.5"
        y1="17.5"
        x2="18.5"
        y2="45.5"
        stroke={isOcean ? "#164777" : "#4fa3d1"}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <line
        x1="24.5"
        y1="20.5"
        x2="39.5"
        y2="20.5"
        stroke={isOcean ? "#0a1f3d" : "#ffffff"}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <line
        x1="24.5"
        y1="28.5"
        x2="35"
        y2="28.5"
        stroke={isOcean ? "#0a1f3d" : "#ffffff"}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeOpacity="0.82"
      />
      <path
        d="M24 38.5L30.8 45.2L46.5 27.5"
        stroke={isOcean ? "#164777" : "#4fa3d1"}
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="46" cy="20.5" r="2.3" fill={isOcean ? "#1e5a8f" : "#4fa3d1"} />
    </svg>
  );
};

export const Header: React.FC = () => {
  const { address, privateKey, resetWallet, importKey } = useWallet();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [onOcean, setOnOcean] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [importKeyInput, setImportKeyInput] = useState("");
  const [showImportForm, setShowImportForm] = useState(false);
  const [showExportKey, setShowExportKey] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("menu-is-open", menuOpen);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setShowWalletMenu(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("menu-is-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const updateNavSurface = () => {
      const themedSections = document.querySelectorAll<HTMLElement>("[data-theme]");
      const probeY = 38;
      let detectedOcean = false;
      themedSections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom >= probeY) {
          detectedOcean = sec.getAttribute("data-theme") === "ocean";
        }
      });
      setOnOcean(detectedOcean);
    };

    updateNavSurface();
    window.addEventListener("scroll", updateNavSurface, { passive: true });
    window.addEventListener("resize", updateNavSurface);
    return () => {
      window.removeEventListener("scroll", updateNavSurface);
      window.removeEventListener("resize", updateNavSurface);
    };
  }, [location.pathname]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const copyContract = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleReset = () => {
    if (confirm("Reset wallet with a fresh throwaway key?")) {
      resetWallet();
      setShowWalletMenu(false);
    }
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (importKeyInput.trim()) {
      const ok = importKey(importKeyInput.trim());
      if (ok) {
        setShowImportForm(false);
        setImportKeyInput("");
        setShowWalletMenu(false);
      } else {
        alert("Invalid private key format. Must be 64-hex string.");
      }
    }
  };

  const useOceanTheme = onOcean && !menuOpen;

  return (
    <>
      <header
        className={`navbar ${useOceanTheme ? "navbar-on-ocean" : ""}`}
        data-nav-theme={useOceanTheme ? "ocean" : "editorial"}
      >
        <div className="flex items-center">
          <Link className="wordmark" to="/" aria-label="CommitmentLedger home">
            <BrandLogoMark
              className="wordmark-logo"
              variant={useOceanTheme ? "ocean" : "editorial"}
            />
            <span>CommitmentLedger</span>
            <sup>v2.2</sup>
          </Link>
        </div>

        <div className="navbar-actions flex items-center gap-2.5 sm:gap-3.5">
          {/* Contract Pill */}
          <div className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-white/88 border border-black/10 px-3.5 py-2 text-xs text-[#0a0a0a] shadow-sm backdrop-blur-sm">
            <Shield size={12} className="text-[#0a0a0a]" />
            <span className="text-[#6b6b6b]">Contract:</span>
            <span className="font-mono font-medium">
              {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            </span>
            <button
              type="button"
              onClick={copyContract}
              title="Copy Contract Address"
              className="text-[#6b6b6b] hover:text-[#0a0a0a]"
            >
              {copiedContract ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            </button>
            <a
              href={getExplorerAddressUrl(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6b6b6b] hover:text-[#0a0a0a]"
              title="View on Explorer"
            >
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Throwaway Wallet Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="wallet-pill-trigger inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/92 border border-black/10 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium text-[#0a0a0a] shadow-sm transition hover:bg-white"
            >
              <Key size={12} className="text-[#0a0a0a] shrink-0" />
              <span className="font-mono tracking-tight text-[11px] sm:text-xs">
                {address ? `${address.slice(0, 4)}...${address.slice(-3)}` : "Wallet"}
              </span>
            </button>

            {showWalletMenu && (
              <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-black/10 bg-white p-5 shadow-2xl z-50 text-left">
                <div className="border-b border-black/10 pb-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0a0a0a]">
                      Throwaway Dev Account
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                      Studionet
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#6b6b6b] leading-relaxed">
                    Ephemeral key for Studionet consensus transactions. Do not put real funds or reuse a personal key.
                  </p>
                  {address && (
                    <div className="mt-2.5 flex items-center justify-between rounded-xl bg-[#f8f8f8] p-2.5 font-mono text-xs text-[#0a0a0a] border border-black/5">
                      <span className="truncate mr-2">{address.slice(0, 10)}...{address.slice(-6)}</span>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="inline-flex items-center gap-1 text-[#6b6b6b] hover:text-[#0a0a0a] shrink-0"
                      >
                        {copiedAddr ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3.5 space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowExportKey(!showExportKey)}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[#0a0a0a] hover:bg-[#f8f8f8] transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Download size={13} className="text-[#6b6b6b]" />
                      <span>{showExportKey ? "Hide Private Key" : "Export Private Key"}</span>
                    </span>
                  </button>

                  {showExportKey && privateKey && (
                    <div className="break-all rounded-xl bg-amber-50 p-2.5 font-mono text-[11px] text-amber-900 border border-amber-200">
                      {privateKey}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowImportForm(!showImportForm)}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[#0a0a0a] hover:bg-[#f8f8f8] transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Upload size={13} className="text-[#6b6b6b]" />
                      <span>Import Private Key</span>
                    </span>
                  </button>

                  {showImportForm && (
                    <form onSubmit={handleImport} className="mt-2 space-y-2 p-2.5 bg-[#f8f8f8] rounded-xl border border-black/5">
                      <input
                        type="text"
                        placeholder="0x..."
                        value={importKeyInput}
                        onChange={(e) => setImportKeyInput(e.target.value)}
                        className="w-full rounded-lg border border-black/10 bg-white p-2 font-mono text-xs text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-full bg-[#0a0a0a] py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                      >
                        Load Key
                      </button>
                    </form>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-rose-700 hover:bg-rose-50 transition"
                  >
                    <RefreshCw size={13} />
                    <span>Reset / Generate Fresh Key</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Menu Trigger with Lucide ChevronDown */}
          <button
            className="menu-trigger"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-drawer"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span>Menu</span>
            <ChevronDown
              size={15}
              strokeWidth={2.2}
              className={`menu-chevron ${menuOpen ? "is-open" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </header>

      {/* Fullscreen Drawer */}
      <div
        id="site-drawer"
        className={`site-drawer ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="drawer-inner">
          <div className="drawer-topline">
            <button
              className="drawer-close"
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              Close <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <nav className="drawer-nav" aria-label="Main navigation">
            <Link to="/" onClick={() => setMenuOpen(false)}>
              <span>Public Ledger</span>
              <ArrowIcon />
            </Link>
            <Link to="/app" onClick={() => setMenuOpen(false)}>
              <span>Workbench</span>
              <ArrowIcon />
            </Link>
            <a href="/#how-it-works" onClick={() => setMenuOpen(false)}>
              <span>Consensus</span>
              <ArrowIcon />
            </a>
            <a href="/#evidence" onClick={() => setMenuOpen(false)}>
              <span>Evidence</span>
              <ArrowIcon />
            </a>
            <a
              href={getExplorerAddressUrl(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
            >
              <span>Explorer</span>
              <ArrowIcon />
            </a>
          </nav>
          <div className="drawer-footer">
            <span>(c) 2026 CommitmentLedger - {NETWORK_STATUS}</span>
            <span>Source-grounded consensus.</span>
          </div>
        </div>
      </div>
    </>
  );
};
