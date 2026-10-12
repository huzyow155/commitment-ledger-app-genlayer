import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, ExternalLink, Key, RefreshCw, Download, Upload, Shield } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  CONTRACT_ADDRESS,
  NETWORK_STATUS,
  getExplorerAddressUrl,
} from "../config/chain";

export const Header: React.FC = () => {
  const { address, privateKey, resetWallet, importKey } = useWallet();
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

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E3DC] bg-[#FCFAF8]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Network */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 font-serif text-xl font-bold text-[#141413]">
            <span>CommitmentLedger</span>
            <span className="font-mono text-xs font-normal text-[#9E3A26]">v2.2.0</span>
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
            {NETWORK_STATUS}
          </span>
        </div>

        {/* Contract & Wallet Controls */}
        <div className="flex items-center gap-3">
          {/* Contract Address Pill */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-[#E7E3DC] bg-[#F7F4EF] px-2.5 py-1 text-xs md:flex">
            <Shield size={13} className="text-[#9E3A26]" />
            <span className="text-[#63625E]">Contract:</span>
            <span className="font-mono text-[#141413]">
              {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}
            </span>
            <button
              type="button"
              onClick={copyContract}
              title="Copy Contract Address"
              className="text-[#63625E] hover:text-[#141413]"
            >
              {copiedContract ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
            </button>
            <a
              href={getExplorerAddressUrl(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#63625E] hover:text-[#9E3A26]"
              title="View on Explorer"
            >
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Throwaway Wallet Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E7E3DC] bg-[#141413] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#333]"
            >
              <Key size={13} className="text-[#FCFAF8]" />
              <span className="font-mono">
                {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Wallet"}
              </span>
            </button>

            {/* Wallet Menu Popover */}
            {showWalletMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#E7E3DC] bg-white p-4 shadow-xl">
                <div className="border-b border-[#E7E3DC] pb-3">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#9E3A26]">
                    Throwaway Dev Account
                  </span>
                  <p className="mt-1 text-xs text-[#63625E] leading-relaxed">
                    Throwaway key for Studionet only. Do not put real funds or reuse a real key.
                  </p>
                  {address && (
                    <div className="mt-2 flex items-center justify-between rounded bg-[#F7F4EF] p-2 font-mono text-xs text-[#141413]">
                      <span>{address.slice(0, 10)}…{address.slice(-6)}</span>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="inline-flex items-center gap-1 text-[#63625E] hover:text-[#141413]"
                      >
                        {copiedAddr ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowExportKey(!showExportKey)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[#141413] hover:bg-[#F7F4EF]"
                  >
                    <Download size={13} />
                    <span>{showExportKey ? "Hide Private Key" : "Export Private Key"}</span>
                  </button>

                  {showExportKey && privateKey && (
                    <div className="break-all rounded bg-amber-50 p-2 font-mono text-[11px] text-amber-900 border border-amber-200">
                      {privateKey}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowImportForm(!showImportForm)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[#141413] hover:bg-[#F7F4EF]"
                  >
                    <Upload size={13} />
                    <span>Import Private Key</span>
                  </button>

                  {showImportForm && (
                    <form onSubmit={handleImport} className="mt-2 space-y-2">
                      <input
                        type="text"
                        placeholder="0x..."
                        value={importKeyInput}
                        onChange={(e) => setImportKeyInput(e.target.value)}
                        className="w-full rounded border border-[#E7E3DC] p-1.5 font-mono text-xs focus:border-[#141413] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-full rounded bg-[#141413] py-1 text-xs font-semibold text-white hover:bg-[#333]"
                      >
                        Load Key
                      </button>
                    </form>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-rose-700 hover:bg-rose-50"
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
