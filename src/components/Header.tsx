import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Copy, Check, ExternalLink, Key, RefreshCw, Download, Upload, Shield, ChevronDown, ArrowUpRight } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  CONTRACT_ADDRESS,
  NETWORK_STATUS,
  getExplorerAddressUrl,
} from "../config/chain";

export const Header: React.FC = () => {
  const { address, privateKey, resetWallet, importKey } = useWallet();
  const location = useLocation();
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [importKeyInput, setImportKeyInput] = useState("");
  const [showImportForm, setShowImportForm] = useState(false);
  const [showExportKey, setShowExportKey] = useState(false);

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

  const isWorkbench = location.pathname.startsWith("/app");

  return (
    <header className="sticky top-0 z-40 border-b border-[#E8E5DF] bg-[#FCFAF8]/92 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
        {/* Brand & Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="group inline-flex items-baseline gap-1 text-[#0E0E0D] transition">
            <span className="font-serif text-xl sm:text-2xl font-semibold italic tracking-tight group-hover:opacity-80">
              CommitmentLedger
            </span>
            <sup className="font-sans text-[10px] sm:text-[11px] font-semibold tracking-normal text-[#9E3A26]">
              v2.2
            </sup>
          </Link>

          {/* Network Pill */}
          <span className="hidden items-center gap-1.5 rounded-full border border-[#E8E5DF] bg-[#F7F4EF] px-3 py-1 text-[11px] font-medium text-[#6B6A65] md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
            <span className="text-[#0E0E0D] font-medium">{NETWORK_STATUS}</span>
          </span>
        </div>

        {/* Center / Navigation Links */}
        <nav className="hidden items-center gap-6 lg:flex text-[13px] font-medium text-[#6B6A65]">
          <Link
            to="/"
            className={`transition hover:text-[#0E0E0D] ${!isWorkbench ? "text-[#0E0E0D] font-semibold" : ""}`}
          >
            Public Ledger
          </Link>
          <a href="#how-it-works" className="transition hover:text-[#0E0E0D]">
            Consensus Lifecycle
          </a>
          <a href="#evidence" className="transition hover:text-[#0E0E0D]">
            Studionet Evidence
          </a>
          <a href="#integration" className="transition hover:text-[#0E0E0D]">
            Contract SDK
          </a>
        </nav>

        {/* Contract & Wallet Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Contract Address Pill */}
          <div className="hidden items-center gap-1.5 rounded-full border border-[#E8E5DF] bg-[#F7F4EF] px-3 py-1.5 text-xs sm:flex">
            <Shield size={12} className="text-[#9E3A26]" />
            <span className="text-[#6B6A65]">Contract:</span>
            <span className="font-mono text-[#0E0E0D] font-medium">
              {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            </span>
            <button
              type="button"
              onClick={copyContract}
              title="Copy Contract Address"
              className="ml-0.5 text-[#6B6A65] hover:text-[#0E0E0D]"
            >
              {copiedContract ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
            </button>
            <a
              href={getExplorerAddressUrl(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B6A65] hover:text-[#9E3A26]"
              title="View on Explorer"
            >
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Quick link to /app if on landing */}
          {!isWorkbench && (
            <Link
              to="/app"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#0E0E0D] bg-transparent px-3.5 py-1.5 text-xs font-semibold text-[#0E0E0D] transition hover:bg-[#0E0E0D] hover:text-white"
            >
              <span>Workbench</span>
              <ArrowUpRight size={13} />
            </Link>
          )}

          {/* Throwaway Wallet Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0E0E0D] bg-[#0E0E0D] px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#262624] sm:px-3.5"
            >
              <Key size={12} className="text-[#F7F4EF] shrink-0" />
              <span className="font-mono tracking-tight text-[11px] sm:text-xs">
                {address ? `${address.slice(0, 4)}...${address.slice(-3)}` : "Wallet"}
              </span>
              <ChevronDown size={11} className="opacity-60 shrink-0" />
            </button>

            {/* Wallet Menu Popover */}
            {showWalletMenu && (
              <div className="absolute right-0 mt-2.5 w-84 rounded-2xl border border-[#E8E5DF] bg-white p-5 shadow-2xl z-50">
                <div className="border-b border-[#E8E5DF] pb-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E3A26]">
                      Throwaway Dev Account
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                      Ephemeral
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#6B6A65] leading-relaxed">
                    Used for signing Studionet consensus transactions. Never put real funds or export outside this session.
                  </p>
                  {address && (
                    <div className="mt-2.5 flex items-center justify-between rounded-lg bg-[#F7F4EF] p-2.5 font-mono text-xs text-[#0E0E0D] border border-[#E8E5DF]">
                      <span className="truncate mr-2">{address.slice(0, 10)}...{address.slice(-6)}</span>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="inline-flex items-center gap-1 text-[#6B6A65] hover:text-[#0E0E0D] shrink-0"
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
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[#0E0E0D] hover:bg-[#F7F4EF] transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Download size={13} className="text-[#6B6A65]" />
                      <span>{showExportKey ? "Hide Private Key" : "Export Private Key"}</span>
                    </span>
                  </button>

                  {showExportKey && privateKey && (
                    <div className="break-all rounded-lg bg-amber-50 p-2.5 font-mono text-[11px] text-amber-900 border border-amber-200">
                      {privateKey}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowImportForm(!showImportForm)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[#0E0E0D] hover:bg-[#F7F4EF] transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Upload size={13} className="text-[#6B6A65]" />
                      <span>Import Private Key</span>
                    </span>
                  </button>

                  {showImportForm && (
                    <form onSubmit={handleImport} className="mt-2 space-y-2 p-2 bg-[#F7F4EF] rounded-lg border border-[#E8E5DF]">
                      <input
                        type="text"
                        placeholder="0x..."
                        value={importKeyInput}
                        onChange={(e) => setImportKeyInput(e.target.value)}
                        className="w-full rounded-md border border-[#E8E5DF] bg-white p-2 font-mono text-xs text-[#0E0E0D] focus:border-[#0E0E0D] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-md bg-[#0E0E0D] py-1.5 text-xs font-semibold text-white hover:bg-[#262624] transition"
                      >
                        Load Key
                      </button>
                    </form>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-rose-700 hover:bg-rose-50 transition"
                  >
                    <RefreshCw size={13} />
                    <span>Reset / Generate Fresh Key</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
