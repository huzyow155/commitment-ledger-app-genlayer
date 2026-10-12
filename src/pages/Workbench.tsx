import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  Search,
  BookOpen,
  CheckCircle2,
  Calendar,
  Globe,
  ArrowLeft,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  registerCommitmentFlow,
  submitResolutionFlow,
  getCommitment,
  listCommitmentsByRegistrant,
  type TxStatusReport,
  type ContractReadResult,
} from "../services/contractService";
import type { CommitmentRecord } from "../lib/outcome";
import {
  validateRawText,
  validateDeadlineDate,
  validateSourceUrl,
} from "../lib/validators";
import { CommitmentCard } from "../components/CommitmentCard";
import { TxPipelineModal } from "../components/TxPipelineModal";
import {
  ALLOWED_DOMAINS,
  CONTRACT_SCHEMA_VERSION,
  SOURCE_TRUNCATION_LIMIT,
} from "../config/chain";
import {
  AlwayzzLines,
  AlwayzzTicker,
  AlwayzzTrustedSection,
  useScrollReveal,
} from "../components/AlwayzzAtmosphere";

export const Workbench: React.FC = () => {
  const { account, address } = useWallet();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "register";

  useScrollReveal(activeTab);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Pipeline modal state
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<TxStatusReport | null>(null);
  const [pipelineStage, setPipelineStage] = useState<
    "signing" | "submitting" | "consensus" | "complete" | "reverted" | "undetermined"
  >("signing");
  const [pipelineTitle, setPipelineTitle] = useState("Consensus Transaction");

  // Form states: Register
  const [registerText, setRegisterText] = useState("");
  const [registerDeadline, setRegisterDeadline] = useState("");
  const [newlyCreatedCommitment, setNewlyCreatedCommitment] = useState<CommitmentRecord | null>(null);

  // Form states: Resolve
  const [resolveCommitmentId, setResolveCommitmentId] = useState(searchParams.get("id") || "");
  const [resolveSourceUrl, setResolveSourceUrl] = useState("");
  const [resolvedRecord, setResolvedRecord] = useState<CommitmentRecord | null>(null);

  // Lookup state
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState<ContractReadResult<CommitmentRecord> | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // My commitments state
  const [myCommitments, setMyCommitments] = useState<CommitmentRecord[]>([]);
  const [myCommitmentsLoading, setMyCommitmentsLoading] = useState(false);

  // Real on-chain example records for "Examples" tab
  const [examplesData, setExamplesData] = useState<{
    caseA: CommitmentRecord | null;
    caseB: CommitmentRecord | null;
    caseC: CommitmentRecord | null;
    loading: boolean;
    error: string | null;
  }>({
    caseA: null,
    caseB: null,
    caseC: null,
    loading: false,
    error: null,
  });

  // Client validations
  const textValidation = validateRawText(registerText);
  const deadlineValidation = validateDeadlineDate(registerDeadline);
  const urlValidation = validateSourceUrl(resolveSourceUrl);

  // Fetch my commitments
  const refreshMyCommitments = async () => {
    if (!address) return;
    setMyCommitmentsLoading(true);
    const res = await listCommitmentsByRegistrant(address, 25);
    if (res.ok && res.data) {
      setMyCommitments(res.data);
    }
    setMyCommitmentsLoading(false);
  };

  useEffect(() => {
    if (address && (activeTab === "resolve" || activeTab === "lookup")) {
      refreshMyCommitments();
    }
  }, [address, activeTab]);

  // Load real examples directly from chain when tab === "examples"
  useEffect(() => {
    if (activeTab === "examples" && !examplesData.caseA && !examplesData.loading) {
      setExamplesData((prev) => ({ ...prev, loading: true, error: null }));
      Promise.all([
        getCommitment("1fe69a47c557"), // Case A (Apollo 11 KEPT)
        getCommitment("605aa94797d3"), // Case B (Apollo 13 BROKEN)
        getCommitment("4efe7cbd0772"), // Case C (Falcon 9 NOMATCH OPEN)
      ])
        .then(([resA, resB, resC]) => {
          if (!resA.ok || !resB.ok || !resC.ok) {
            setExamplesData({
              caseA: null,
              caseB: null,
              caseC: null,
              loading: false,
              error: "Failed to read example commitments from RPC.",
            });
          } else {
            setExamplesData({
              caseA: resA.data,
              caseB: resB.data,
              caseC: resC.data,
              loading: false,
              error: null,
            });
          }
        })
        .catch((err) => {
          setExamplesData({
            caseA: null,
            caseB: null,
            caseC: null,
            loading: false,
            error: err instanceof Error ? err.message : String(err),
          });
        });
    }
  }, [activeTab, examplesData.caseA, examplesData.loading]);

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (!textValidation.ok || !deadlineValidation.ok) return;

    setPipelineTitle("Registering Public Commitment");
    setPipelineStage("signing");
    setPipelineOpen(true);
    setNewlyCreatedCommitment(null);

    try {
      setPipelineStage("consensus");
      const { commitmentId } = await registerCommitmentFlow(
        account,
        registerText,
        registerDeadline,
        (report) => {
          setPipelineStatus(report);
          if (report.statusName === "ACCEPTED") {
            if (report.leaderResult === "SUCCESS") {
              setPipelineStage("complete");
            } else {
              setPipelineStage("reverted");
            }
          } else if (report.isMajorityDisagreed) {
            setPipelineStage("undetermined");
          }
        }
      );

      // Read back the fresh record
      const freshRecord = await getCommitment(commitmentId);
      if (freshRecord.ok && freshRecord.data) {
        setNewlyCreatedCommitment(freshRecord.data);
      }
      setRegisterText("");
      refreshMyCommitments();
    } catch (err: unknown) {
      setPipelineStage("reverted");
      setPipelineStatus((prev) => ({
        txHash: prev?.txHash || "",
        statusName: "REVERTED",
        decodedRevert: err instanceof Error ? err.message : String(err),
      }));
    }
  };

  // Handle Resolve
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (!urlValidation.ok || !resolveCommitmentId.trim()) return;

    setPipelineTitle("Resolving Commitment via Source");
    setPipelineStage("signing");
    setPipelineOpen(true);
    setResolvedRecord(null);

    try {
      setPipelineStage("consensus");
      const { report } = await submitResolutionFlow(
        account,
        resolveCommitmentId.trim(),
        resolveSourceUrl.trim(),
        (rep) => {
          setPipelineStatus(rep);
          if (rep.statusName === "ACCEPTED") {
            if (rep.leaderResult === "SUCCESS") {
              setPipelineStage("complete");
            } else {
              setPipelineStage("reverted");
            }
          } else if (rep.isMajorityDisagreed) {
            setPipelineStage("undetermined");
          }
        }
      );

      if (report.leaderResult === "SUCCESS") {
        setPipelineStage("complete");
        const fresh = await getCommitment(resolveCommitmentId.trim());
        if (fresh.ok && fresh.data) {
          setResolvedRecord(fresh.data);
        }
      } else {
        setPipelineStage("reverted");
      }
      refreshMyCommitments();
    } catch (err: unknown) {
      setPipelineStage("reverted");
      setPipelineStatus((prev) => ({
        txHash: prev?.txHash || "",
        statusName: "REVERTED",
        decodedRevert: err instanceof Error ? err.message : String(err),
      }));
    }
  };

  // Handle Lookup
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    const result = await getCommitment(lookupId.trim());
    setLookupResult(result);
    setLookupLoading(false);
  };

  return (
    <div className="bg-white text-[#0a0a0a]">
      {/* DIRECT PORT OF ALWAYZZ ATMOSPHERE AROUND THE ENTIRE WORKBENCH */}
      <section className="hero workbench-shell">
        <AlwayzzLines />

        <div className="hero-content">
          <AlwayzzTicker />

          <h1
            className="hero-title"
            style={{ fontSize: "clamp(42px, 5vw, 68px)", marginTop: "20px" }}
          >
            Commitment <span className="serif-word">workbench</span>
            <sup>{CONTRACT_SCHEMA_VERSION}</sup>
          </h1>

          <p className="hero-subtitle" style={{ marginTop: "16px" }}>
            Register promises, discover IDs via snapshot-diff, and resolve commitments against allowlisted public sources.
          </p>

          {/* Workbench Tabs using Alwayzz Pill Styling */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {[
              { key: "register", label: "Register", icon: FileText },
              { key: "resolve", label: "Resolve", icon: ShieldCheck },
              { key: "lookup", label: "Lookup & History", icon: Search },
              { key: "examples", label: "Verified Examples", icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTab(tab.key)}
                  className={
                    isActive
                      ? "inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] px-5 py-3 text-xs font-semibold text-white shadow-md transition"
                      : "inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-5 py-3 text-xs font-medium text-[#6b6b6b] shadow-sm transition hover:bg-white hover:text-[#0a0a0a]"
                  }
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-4 py-3 text-xs font-medium text-[#0a0a0a] transition hover:bg-white"
            >
              <ArrowLeft size={13} />
              <span>Overview</span>
            </Link>
          </div>

          {/* WORKSPACE FOREGROUND CONTENT */}
          <div className="mt-10 w-full text-left">
            {/* 1. REGISTER TAB */}
            {activeTab === "register" && (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <form onSubmit={handleRegister} className="workbench-surface p-7 sm:p-9">
                    <span className="ticker-item inline-block mb-2">Step 01 / On-Chain Registry</span>
                    <h2 className="font-serif text-2xl font-semibold text-[#0a0a0a]">
                      Register a Public Commitment
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-[#6b6b6b] leading-relaxed">
                      Validators will execute multi-node canonical extraction of the subject and action into consensus storage.
                    </p>

                    {/* Text Area */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#0a0a0a] mb-1.5">
                        <label htmlFor="rawText">Commitment Statement</label>
                        <span
                          className={`font-mono text-[11px] ${
                            registerText.length > 400 ? "text-rose-600 font-bold" : "text-[#6b6b6b]"
                          }`}
                        >
                          {registerText.length}/400 chars
                        </span>
                      </div>
                      <textarea
                        id="rawText"
                        rows={4}
                        value={registerText}
                        onChange={(e) => setRegisterText(e.target.value)}
                        placeholder="e.g. The United States Apollo 11 mission will land human astronauts on the lunar surface before 1970."
                        className="w-full rounded-2xl border border-black/10 bg-white p-4 font-serif text-base text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none transition leading-relaxed"
                      />
                      {registerText.length > 0 && !textValidation.ok && (
                        <p className="mt-1.5 text-xs text-rose-600">{textValidation.message}</p>
                      )}
                    </div>

                    {/* Deadline Input */}
                    <div className="mt-6">
                      <label htmlFor="deadline" className="block text-xs font-semibold text-[#0a0a0a] mb-1.5">
                        Mandatory Calendar Deadline (YYYY-MM-DD)
                      </label>
                      <div className="relative">
                        <input
                          id="deadline"
                          type="text"
                          value={registerDeadline}
                          onChange={(e) => setRegisterDeadline(e.target.value)}
                          placeholder="1970-01-01"
                          className="w-full rounded-2xl border border-black/10 bg-white p-3.5 font-mono text-sm text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none transition"
                        />
                        <Calendar size={16} className="absolute right-4 top-4 text-[#6b6b6b]" />
                      </div>
                      <p className="mt-2 text-xs text-[#6b6b6b] leading-relaxed">
                        Resolution is refused on-chain by the deterministic clock before this date. Real calendar days and leap years are strictly validated.
                      </p>
                      {registerDeadline.length > 0 && !deadlineValidation.ok && (
                        <p className="mt-1.5 text-xs text-rose-600">{deadlineValidation.message}</p>
                      )}
                    </div>

                    {/* Phrasing Hint */}
                    <div className="mt-6 rounded-2xl border border-black/10 bg-[#fbfbfb] p-4 text-xs text-[#6b6b6b] leading-relaxed">
                      <strong className="text-[#0a0a0a]">Best practice phrasing:</strong> Be concrete, singular, and verifiable. State who will do what by when (e.g., &ldquo;Mission X will land on the Moon before 1970&rdquo;). Compound clauses may trigger validator disagreement if partially fulfilled.
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex justify-end">
                      <button
                        type="submit"
                        disabled={!textValidation.ok || !deadlineValidation.ok}
                        className="primary-button text-sm h-12 px-7"
                      >
                        <FileText size={15} />
                        <span>Broadcast Registration</span>
                      </button>
                    </div>
                  </form>

                  {/* Display newly created commitment */}
                  {newlyCreatedCommitment && (
                    <div className="mt-8">
                      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                        <CheckCircle2 size={15} />
                        <span>New Commitment Discovered on Ledger</span>
                      </div>
                      <CommitmentCard
                        commitment={newlyCreatedCommitment}
                        onResolveClick={(id) => {
                          setResolveCommitmentId(id);
                          setTab("resolve");
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Sidebar Guidelines */}
                <div className="space-y-6">
                  <div className="workbench-surface p-6 text-xs text-[#6b6b6b]">
                    <h3 className="font-serif text-base font-semibold text-[#0a0a0a]">
                      Discovery via Snapshot Diff
                    </h3>
                    <p className="mt-2.5 leading-relaxed">
                      Smart contract writes on GenLayer do not return values directly to browsers. To capture your fresh commitment ID, the app takes a snapshot of your records before submission, monitors for the accepted transaction, and extracts the newly added record.
                    </p>
                  </div>

                  <div className="workbench-surface p-6 text-xs text-[#6b6b6b]">
                    <h3 className="font-serif text-base font-semibold text-[#0a0a0a]">
                      Registration Guardrails
                    </h3>
                    <ul className="mt-3.5 space-y-2.5 list-disc pl-4 leading-relaxed">
                      <li>Text length: 1 to 400 characters after stripping whitespace.</li>
                      <li>Pure ASCII characters only.</li>
                      <li>Prompt injection protection: wrapped in &lt;UNTRUSTED_TEXT&gt; tags.</li>
                      <li>Multi-validator agreement on extracted predicate via <code>strict_eq</code>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 2. RESOLVE TAB */}
            {activeTab === "resolve" && (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <form onSubmit={handleResolve} className="workbench-surface p-7 sm:p-9">
                    <span className="ticker-item inline-block mb-2">Step 02 / Source-Grounded Resolution</span>
                    <h2 className="font-serif text-2xl font-semibold text-[#0a0a0a]">
                      Resolve an Open Commitment
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-[#6b6b6b] leading-relaxed">
                      Provide an allowlisted public source URL. The contract will fetch the page directly and verify a verbatim quote through consensus.
                    </p>

                    {/* Target ID */}
                    <div className="mt-6">
                      <label htmlFor="resolveId" className="block text-xs font-semibold text-[#0a0a0a] mb-1.5">
                        Commitment ID
                      </label>
                      <input
                        id="resolveId"
                        type="text"
                        value={resolveCommitmentId}
                        onChange={(e) => setResolveCommitmentId(e.target.value)}
                        placeholder="e.g. 1fe69a47c557"
                        className="w-full rounded-2xl border border-black/10 bg-white p-3.5 font-mono text-sm text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none transition"
                      />
                    </div>

                    {/* Source URL */}
                    <div className="mt-6">
                      <label htmlFor="sourceUrl" className="block text-xs font-semibold text-[#0a0a0a] mb-1.5">
                        Allowlisted Public Source URL
                      </label>
                      <div className="relative">
                        <input
                          id="sourceUrl"
                          type="text"
                          value={resolveSourceUrl}
                          onChange={(e) => setResolveSourceUrl(e.target.value)}
                          placeholder="https://en.wikipedia.org/wiki/..."
                          className="w-full rounded-2xl border border-black/10 bg-white p-3.5 font-mono text-sm text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none transition"
                        />
                        <Globe size={16} className="absolute right-4 top-4 text-[#6b6b6b]" />
                      </div>
                      {resolveSourceUrl.length > 0 && !urlValidation.ok && (
                        <p className="mt-1.5 text-xs text-rose-600">{urlValidation.message}</p>
                      )}

                      {/* Allowlist Chips */}
                      <div className="mt-4">
                        <span className="text-[11px] font-semibold text-[#6b6b6b] uppercase tracking-wider block mb-2">
                          Allowed Reference Domains:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {ALLOWED_DOMAINS.map((dom) => (
                            <button
                              key={dom}
                              type="button"
                              onClick={() => setResolveSourceUrl(`https://en.${dom}/`)}
                              className="ticker-item font-mono text-xs text-[#0a0a0a] border border-black/10 hover:border-[#0a0a0a] transition"
                            >
                              {dom}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 6,000 char note */}
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950 leading-relaxed">
                        <strong className="font-semibold">Truncation Limit ({SOURCE_TRUNCATION_LIMIT.toLocaleString()} chars):</strong>{" "}
                        The contract fetches and evaluates only the first 6,000 characters of the cited web page. If evidence details appear deeper down, validators will agree on <code>NOMATCH</code> (source does not match), leaving the commitment open.
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex justify-end">
                      <button
                        type="submit"
                        disabled={!urlValidation.ok || !resolveCommitmentId.trim()}
                        className="primary-button text-sm h-12 px-7"
                      >
                        <ShieldCheck size={15} />
                        <span>Execute Consensus Resolution</span>
                      </button>
                    </div>
                  </form>

                  {/* Resolved Record card if successful */}
                  {resolvedRecord && (
                    <div className="mt-8">
                      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                        <CheckCircle2 size={15} />
                        <span>Resolved Commitment Sealed</span>
                      </div>
                      <CommitmentCard commitment={resolvedRecord} />
                    </div>
                  )}
                </div>

                {/* Quick Picker for User's Open Commitments */}
                <div>
                  <div className="workbench-surface p-6 reveal-on-scroll" style={{ "--stagger": 1 } as React.CSSProperties}>
                    <h3 className="font-serif text-base font-semibold text-[#0a0a0a]">
                      Your Open Commitments
                    </h3>
                    <p className="mt-1 text-xs text-[#6b6b6b]">
                      Select an open commitment to pre-fill the form.
                    </p>

                    <div className="mt-4 space-y-2.5 max-h-96 overflow-y-auto">
                      {myCommitmentsLoading ? (
                        <p className="text-xs text-[#6b6b6b]">Loading your commitments...</p>
                      ) : myCommitments.filter((c) => c.status === "OPEN").length === 0 ? (
                        <p className="text-xs text-[#6b6b6b]">No open commitments found for current address.</p>
                      ) : (
                        myCommitments
                          .filter((c) => c.status === "OPEN")
                          .map((comm, idx) => (
                            <div
                              key={comm.commitment_id}
                              onClick={() => setResolveCommitmentId(comm.commitment_id)}
                              className="reveal-on-scroll cursor-pointer rounded-2xl border border-black/10 bg-white p-3.5 text-xs transition hover:border-[#0a0a0a]"
                              style={{ "--stagger": idx } as React.CSSProperties}
                            >
                              <div className="flex items-center justify-between font-mono font-semibold text-[#0a0a0a]">
                                <span>{comm.commitment_id}</span>
                                <span className="text-[11px] text-[#6b6b6b]">{comm.deadline_hint}</span>
                              </div>
                              <p className="mt-1 font-serif text-[#6b6b6b] line-clamp-2">
                                &ldquo;{comm.raw_text}&rdquo;
                              </p>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. LOOKUP & HISTORY TAB */}
            {activeTab === "lookup" && (
              <div className="space-y-8">
                {/* Lookup Input Box */}
                <div className="workbench-surface p-7 sm:p-9">
                  <h2 className="font-serif text-2xl font-semibold text-[#0a0a0a]">
                    Read Commitment by ID
                  </h2>
                  <form onSubmit={handleLookup} className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <input
                      id="lookupId"
                      type="text"
                      value={lookupId}
                      onChange={(e) => setLookupId(e.target.value)}
                      placeholder="Enter 12-hex commitment ID (e.g. 1fe69a47c557)"
                      className="flex-1 rounded-2xl border border-black/10 bg-white p-3.5 font-mono text-sm text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none transition"
                    />
                    <button
                      type="submit"
                      disabled={lookupLoading || !lookupId.trim()}
                      className="primary-button text-sm h-12 px-7"
                    >
                      <Search size={14} />
                      <span>{lookupLoading ? "Querying..." : "Query Ledger"}</span>
                    </button>
                  </form>

                  {/* Lookup Result View */}
                  {lookupResult && (
                    <div className="mt-6 border-t border-black/10 pt-6">
                      {lookupResult.ok ? (
                        lookupResult.isNotFound ? (
                          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
                            <strong>Commitment Not Found:</strong> No commitment with ID <code>{lookupId}</code> exists in contract storage.
                          </div>
                        ) : (
                          <div>
                            <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-3">
                              Record Found on Ledger
                            </span>
                            <CommitmentCard
                              commitment={lookupResult.data!}
                              onResolveClick={(id) => {
                                setResolveCommitmentId(id);
                                setTab("resolve");
                              }}
                            />
                          </div>
                        )
                      ) : (
                        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950">
                          <strong>RPC Read Error:</strong> {lookupResult.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* My Commitments List */}
                <div className="workbench-surface p-7 sm:p-9">
                  <div className="flex items-center justify-between border-b border-black/10 pb-5">
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-[#0a0a0a]">
                        Commitments Registered by Your Address
                      </h3>
                      <span className="font-mono text-xs text-[#6b6b6b]">{address}</span>
                    </div>
                    <button
                      type="button"
                      onClick={refreshMyCommitments}
                      className="text-xs text-[#0a0a0a] underline font-medium"
                    >
                      Refresh List
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    {myCommitmentsLoading ? (
                      <p className="text-xs text-[#6b6b6b]">Loading commitments...</p>
                    ) : myCommitments.length === 0 ? (
                      <p className="text-xs text-[#6b6b6b]">
                        No commitments found for this address. Use the Register tab to create your first commitment.
                      </p>
                    ) : (
                      myCommitments.map((comm, idx) => (
                        <div
                          key={comm.commitment_id}
                          className="reveal-on-scroll"
                          style={{ "--stagger": idx } as React.CSSProperties}
                        >
                          <CommitmentCard
                            commitment={comm}
                            onResolveClick={(id) => {
                              setResolveCommitmentId(id);
                              setTab("resolve");
                            }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. VERIFIED EXAMPLES TAB */}
            {activeTab === "examples" && (
              <div className="space-y-6">
                <div className="workbench-surface p-7 text-xs text-[#6b6b6b] reveal-on-scroll" style={{ "--stagger": 0 } as React.CSSProperties}>
                  <h2 className="font-serif text-2xl font-semibold text-[#0a0a0a]">
                    Real Studionet Consensus Cases
                  </h2>
                  <p className="mt-1.5 leading-relaxed text-xs sm:text-sm">
                    These three real scenarios were executed on GenLayer Studionet against contract{" "}
                    <code className="font-mono text-xs text-[#0a0a0a] font-medium">
                      0x3155c7c80f4334968d61E1b79f74EB864CF7cb08
                    </code>
                    . You can load their parameters directly into the workbench forms.
                  </p>
                </div>

                {examplesData.loading && (
                  <div className="workbench-surface p-10 text-center text-xs text-[#6b6b6b]">
                    Reading example commitments from Studionet RPC...
                  </div>
                )}

                {examplesData.error && (
                  <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950">
                    <strong>Error querying RPC:</strong> {examplesData.error}
                  </div>
                )}

                {examplesData.caseA && (
                  <div className="workbench-surface p-7 sm:p-8 reveal-on-scroll" style={{ "--stagger": 1 } as React.CSSProperties}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4">
                      <span className="font-sans text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Case A: Paraphrased Source Fulfillment (KEPT)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRegisterText(examplesData.caseA!.raw_text);
                          setRegisterDeadline(examplesData.caseA!.deadline_hint);
                          setTab("register");
                        }}
                        className="text-xs text-[#0a0a0a] underline font-medium"
                      >
                        Load into Register form
                      </button>
                    </div>
                    <div className="mt-5">
                      <CommitmentCard commitment={examplesData.caseA} showActions={false} />
                    </div>
                  </div>
                )}

                {examplesData.caseB && (
                  <div className="workbench-surface p-7 sm:p-8 reveal-on-scroll" style={{ "--stagger": 2 } as React.CSSProperties}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4">
                      <span className="font-sans text-xs font-bold uppercase tracking-wider text-rose-800">
                        Case B: Grounded Verbatim Evidence of Non-Fulfillment (BROKEN)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRegisterText(examplesData.caseB!.raw_text);
                          setRegisterDeadline(examplesData.caseB!.deadline_hint);
                          setTab("register");
                        }}
                        className="text-xs text-[#0a0a0a] underline font-medium"
                      >
                        Load into Register form
                      </button>
                    </div>
                    <div className="mt-5">
                      <CommitmentCard commitment={examplesData.caseB} showActions={false} />
                    </div>
                  </div>
                )}

                {examplesData.caseC && (
                  <div className="workbench-surface p-7 sm:p-8 reveal-on-scroll" style={{ "--stagger": 3 } as React.CSSProperties}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4">
                      <span className="font-sans text-xs font-bold uppercase tracking-wider text-amber-800">
                        Case C: Distractor Rejection (NOMATCH Revert, Commitment Stays OPEN)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setResolveCommitmentId(examplesData.caseC!.commitment_id);
                          setResolveSourceUrl("https://en.wikipedia.org/wiki/Falcon_9");
                          setTab("resolve");
                        }}
                        className="text-xs text-[#0a0a0a] underline font-medium"
                      >
                        Load into Resolve form
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-[#6b6b6b]">
                      Attempting to resolve this commitment (NASA James Webb Telescope) with the Falcon 9 Wikipedia page reverted on-chain with &ldquo;source does not match this commitment&rdquo; and preserved the commitment in the OPEN state.
                    </p>
                    <div className="mt-5">
                      <CommitmentCard commitment={examplesData.caseC} showActions={false} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="progressive-blur" aria-hidden="true" />
      </section>

      <AlwayzzTrustedSection />

      {/* Transaction Pipeline Modal */}
      <TxPipelineModal
        isOpen={pipelineOpen}
        onClose={() => setPipelineOpen(false)}
        status={pipelineStatus}
        stage={pipelineStage}
        title={pipelineTitle}
        onRetry={() => {
          setPipelineOpen(false);
        }}
      />
    </div>
  );
};
