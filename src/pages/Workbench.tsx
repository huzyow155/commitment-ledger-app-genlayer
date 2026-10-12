import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  Search,
  BookOpen,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Globe,
  ArrowLeft,
  Sparkles,
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
import { ALLOWED_DOMAINS, SOURCE_TRUNCATION_LIMIT } from "../config/chain";

export const Workbench: React.FC = () => {
  const { account, address } = useWallet();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "register";

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
    <div className="relative min-h-[calc(100vh-65px)] bg-[#FCFAF8] pb-24">
      {/* Ruled ledger motif background grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#E8E5DF_1px,transparent_1px),linear-gradient(to_bottom,#E8E5DF_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_10%,#000_60%,transparent_100%)] opacity-30" />

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-8">
        {/* Top Header with Editorial Title & Back Link */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-[#E8E5DF] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9E3A26] font-semibold">
                Consensus Registry
              </span>
              <span className="text-[#6B6A65]">·</span>
              <span className="text-xs text-[#6B6A65]">GenLayer Studionet</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#0E0E0D] tracking-tight">
              Commitment <span className="italic font-semibold">Workbench</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#6B6A65] max-w-2xl">
              Register promises, discover IDs via snapshot-diff, and resolve commitments against allowlisted public sources.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E0E0D] hover:text-[#9E3A26] transition py-1.5 px-3 rounded-full border border-[#E8E5DF] bg-white shadow-sm"
          >
            <ArrowLeft size={13} />
            <span>Protocol Overview</span>
          </Link>
        </div>

        {/* Tabs with Pill-Style Indicator */}
        <div className="mb-10 flex flex-wrap gap-2 border-b border-[#E8E5DF] pb-3">
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
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold tracking-tight transition ${
                  isActive
                    ? "bg-[#0E0E0D] text-white shadow-sm"
                    : "bg-[#F7F4EF] text-[#6B6A65] hover:bg-[#E8E5DF] hover:text-[#0E0E0D]"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}

        {/* 1. REGISTER TAB */}
        {activeTab === "register" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <form onSubmit={handleRegister} className="rounded-3xl border border-[#E8E5DF] bg-white p-7 sm:p-9 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#9E3A26] font-semibold">
                      Step 1: On-Chain Registry
                    </span>
                    <h2 className="font-serif text-2xl font-normal text-[#0E0E0D] mt-0.5">
                      Register a Public Commitment
                    </h2>
                  </div>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-[#6B6A65] leading-relaxed">
                  Validators will execute multi-node canonical extraction of the subject and action into consensus storage.
                </p>

                {/* Text Area */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#0E0E0D] mb-1.5">
                    <label htmlFor="rawText">Commitment Statement</label>
                    <span
                      className={`font-mono text-[11px] ${
                        registerText.length > 400 ? "text-rose-600 font-bold" : "text-[#6B6A65]"
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
                    className="w-full rounded-2xl border border-[#E8E5DF] bg-[#FCFAF8] p-4 font-serif text-base text-[#0E0E0D] focus:border-[#0E0E0D] focus:bg-white focus:outline-none transition leading-relaxed"
                  />
                  {registerText.length > 0 && !textValidation.ok && (
                    <p className="mt-1.5 text-xs text-rose-600">{textValidation.message}</p>
                  )}
                </div>

                {/* Deadline Input */}
                <div className="mt-6">
                  <label htmlFor="deadline" className="block text-xs font-semibold text-[#0E0E0D] mb-1.5">
                    Mandatory Calendar Deadline (YYYY-MM-DD)
                  </label>
                  <div className="relative">
                    <input
                      id="deadline"
                      type="text"
                      value={registerDeadline}
                      onChange={(e) => setRegisterDeadline(e.target.value)}
                      placeholder="1970-01-01"
                      className="w-full rounded-2xl border border-[#E8E5DF] bg-[#FCFAF8] p-3.5 font-mono text-sm text-[#0E0E0D] focus:border-[#0E0E0D] focus:bg-white focus:outline-none transition"
                    />
                    <Calendar size={16} className="absolute right-4 top-4 text-[#6B6A65]" />
                  </div>
                  <p className="mt-2 text-xs text-[#6B6A65] leading-relaxed">
                    Resolution is refused on-chain by the deterministic clock before this date. Real calendar days and leap years are strictly validated.
                  </p>
                  {registerDeadline.length > 0 && !deadlineValidation.ok && (
                    <p className="mt-1.5 text-xs text-rose-600">{deadlineValidation.message}</p>
                  )}
                </div>

                {/* Phrasing Hint */}
                <div className="mt-6 rounded-2xl border border-[#E8E5DF] bg-[#F7F4EF]/70 p-4 text-xs text-[#6B6A65] leading-relaxed">
                  <strong className="text-[#0E0E0D]">Best practice phrasing:</strong> Be concrete, singular, and verifiable. State who will do what by when (e.g., &ldquo;Mission X will land on the Moon before 1970&rdquo;). Compound clauses may trigger validator disagreement if partially fulfilled.
                </div>

                {/* Submit Button */}
                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={!textValidation.ok || !deadlineValidation.ok}
                    className="pill-button-primary text-xs shadow-md disabled:opacity-40"
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
              <div className="rounded-3xl border border-[#E8E5DF] bg-[#F7F4EF]/50 p-6 text-xs text-[#6B6A65]">
                <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">
                  Discovery via Snapshot Diff
                </h3>
                <p className="mt-2.5 leading-relaxed">
                  Smart contract writes on GenLayer do not return values directly to browsers. To capture your fresh commitment ID, the app takes a snapshot of your records before submission, monitors for the accepted transaction, and extracts the newly added record.
                </p>
              </div>

              <div className="rounded-3xl border border-[#E8E5DF] bg-white p-6 text-xs text-[#6B6A65] shadow-sm">
                <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">
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
              <form onSubmit={handleResolve} className="rounded-3xl border border-[#E8E5DF] bg-white p-7 sm:p-9 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#9E3A26] font-semibold">
                      Step 2: Source-Grounded Resolution
                    </span>
                    <h2 className="font-serif text-2xl font-normal text-[#0E0E0D] mt-0.5">
                      Resolve an Open Commitment
                    </h2>
                  </div>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-[#6B6A65] leading-relaxed">
                  Provide an allowlisted public source URL. The contract will fetch the page directly and verify a verbatim quote through consensus.
                </p>

                {/* Target ID */}
                <div className="mt-6">
                  <label htmlFor="resolveId" className="block text-xs font-semibold text-[#0E0E0D] mb-1.5">
                    Commitment ID
                  </label>
                  <input
                    id="resolveId"
                    type="text"
                    value={resolveCommitmentId}
                    onChange={(e) => setResolveCommitmentId(e.target.value)}
                    placeholder="e.g. 1fe69a47c557"
                    className="w-full rounded-2xl border border-[#E8E5DF] bg-[#FCFAF8] p-3.5 font-mono text-sm text-[#0E0E0D] focus:border-[#0E0E0D] focus:bg-white focus:outline-none transition"
                  />
                </div>

                {/* Source URL */}
                <div className="mt-6">
                  <label htmlFor="sourceUrl" className="block text-xs font-semibold text-[#0E0E0D] mb-1.5">
                    Allowlisted Public Source URL
                  </label>
                  <div className="relative">
                    <input
                      id="sourceUrl"
                      type="text"
                      value={resolveSourceUrl}
                      onChange={(e) => setResolveSourceUrl(e.target.value)}
                      placeholder="https://en.wikipedia.org/wiki/..."
                      className="w-full rounded-2xl border border-[#E8E5DF] bg-[#FCFAF8] p-3.5 font-mono text-sm text-[#0E0E0D] focus:border-[#0E0E0D] focus:bg-white focus:outline-none transition"
                    />
                    <Globe size={16} className="absolute right-4 top-4 text-[#6B6A65]" />
                  </div>
                  {resolveSourceUrl.length > 0 && !urlValidation.ok && (
                    <p className="mt-1.5 text-xs text-rose-600">{urlValidation.message}</p>
                  )}

                  {/* Allowlist Chips */}
                  <div className="mt-4">
                    <span className="text-[11px] font-semibold text-[#6B6A65] uppercase tracking-wider block mb-2">Allowed Reference Domains:</span>
                    <div className="flex flex-wrap gap-2">
                      {ALLOWED_DOMAINS.map((dom) => (
                        <button
                          key={dom}
                          type="button"
                          onClick={() => setResolveSourceUrl(`https://en.${dom}/`)}
                          className="rounded-full border border-[#E8E5DF] bg-[#F7F4EF] px-3 py-1 font-mono text-xs text-[#0E0E0D] hover:border-[#0E0E0D] transition"
                        >
                          {dom}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 6,000 char note */}
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 leading-relaxed">
                    <strong className="font-semibold">Truncation Limit ({SOURCE_TRUNCATION_LIMIT.toLocaleString()} chars):</strong> The contract fetches and evaluates only the first 6,000 characters of the cited web page. If evidence details appear deeper down, validators will agree on <code>NOMATCH</code> (source does not match), leaving the commitment open.
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={!urlValidation.ok || !resolveCommitmentId.trim()}
                    className="pill-button-primary text-xs shadow-md disabled:opacity-40"
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
              <div className="rounded-3xl border border-[#E8E5DF] bg-white p-6 shadow-sm">
                <h3 className="font-serif text-base font-semibold text-[#0E0E0D]">
                  Your Open Commitments
                </h3>
                <p className="mt-1 text-xs text-[#6B6A65]">
                  Select an open commitment to pre-fill the form.
                </p>

                <div className="mt-4 space-y-2.5 max-h-96 overflow-y-auto">
                  {myCommitmentsLoading ? (
                    <p className="text-xs text-[#6B6A65]">Loading your commitments...</p>
                  ) : myCommitments.filter((c) => c.status === "OPEN").length === 0 ? (
                    <p className="text-xs text-[#6B6A65]">No open commitments found for current address.</p>
                  ) : (
                    myCommitments
                      .filter((c) => c.status === "OPEN")
                      .map((comm) => (
                        <div
                          key={comm.commitment_id}
                          onClick={() => setResolveCommitmentId(comm.commitment_id)}
                          className="cursor-pointer rounded-2xl border border-[#E8E5DF] p-3.5 text-xs transition hover:border-[#9E3A26] hover:bg-[#F7F4EF]"
                        >
                          <div className="flex items-center justify-between font-mono font-semibold text-[#0E0E0D]">
                            <span>{comm.commitment_id}</span>
                            <span className="text-[11px] text-[#6B6A65]">{comm.deadline_hint}</span>
                          </div>
                          <p className="mt-1 font-serif text-[#6B6A65] line-clamp-2">
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
            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-7 sm:p-9 shadow-sm">
              <h2 className="font-serif text-2xl font-normal text-[#0E0E0D]">
                Read Commitment by ID
              </h2>
              <form onSubmit={handleLookup} className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="Enter 12-hex commitment ID (e.g. 1fe69a47c557)"
                  className="flex-1 rounded-2xl border border-[#E8E5DF] bg-[#FCFAF8] p-3.5 font-mono text-sm text-[#0E0E0D] focus:border-[#0E0E0D] focus:bg-white focus:outline-none transition"
                />
                <button
                  type="submit"
                  disabled={lookupLoading || !lookupId.trim()}
                  className="pill-button-primary text-xs shadow-md disabled:opacity-40"
                >
                  <Search size={14} />
                  <span>{lookupLoading ? "Querying..." : "Query Ledger"}</span>
                </button>
              </form>

              {/* Lookup Result View */}
              {lookupResult && (
                <div className="mt-6 border-t border-[#E8E5DF] pt-6">
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
            <div className="rounded-3xl border border-[#E8E5DF] bg-white p-7 sm:p-9 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E8E5DF] pb-5">
                <div>
                  <h3 className="font-serif text-xl font-normal text-[#0E0E0D]">
                    Commitments Registered by Your Address
                  </h3>
                  <span className="font-mono text-xs text-[#6B6A65]">{address}</span>
                </div>
                <button
                  type="button"
                  onClick={refreshMyCommitments}
                  className="text-xs text-[#9E3A26] underline hover:text-[#7A2B1C] font-medium"
                >
                  Refresh List
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {myCommitmentsLoading ? (
                  <p className="text-xs text-[#6B6A65]">Loading commitments...</p>
                ) : myCommitments.length === 0 ? (
                  <p className="text-xs text-[#6B6A65]">
                    No commitments found for this address. Use the Register tab to create your first commitment.
                  </p>
                ) : (
                  myCommitments.map((comm) => (
                    <CommitmentCard
                      key={comm.commitment_id}
                      commitment={comm}
                      onResolveClick={(id) => {
                        setResolveCommitmentId(id);
                        setTab("resolve");
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. VERIFIED EXAMPLES TAB */}
        {activeTab === "examples" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#E8E5DF] bg-[#F7F4EF]/60 p-7 text-xs text-[#6B6A65]">
              <h2 className="font-serif text-2xl font-normal text-[#0E0E0D]">
                Real Studionet Consensus Cases
              </h2>
              <p className="mt-1.5 leading-relaxed text-xs sm:text-sm">
                These three real scenarios were executed on GenLayer Studionet against contract <code className="font-mono text-xs text-[#0E0E0D] font-medium">0x3155c7c80f4334968d61E1b79f74EB864CF7cb08</code>. You can load their parameters directly into the workbench forms.
              </p>
            </div>

            {examplesData.loading && (
              <div className="p-10 text-center text-xs text-[#6B6A65]">
                Reading example commitments from Studionet RPC...
              </div>
            )}

            {examplesData.error && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950">
                <strong>Error querying RPC:</strong> {examplesData.error}
              </div>
            )}

            {examplesData.caseA && (
              <div className="rounded-3xl border border-[#E8E5DF] bg-white p-7 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E5DF] pb-4">
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
                    className="text-xs text-[#9E3A26] underline hover:text-[#7A2B1C] font-medium"
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
              <div className="rounded-3xl border border-[#E8E5DF] bg-white p-7 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E5DF] pb-4">
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
                    className="text-xs text-[#9E3A26] underline hover:text-[#7A2B1C] font-medium"
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
              <div className="rounded-3xl border border-[#E8E5DF] bg-white p-7 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E5DF] pb-4">
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
                    className="text-xs text-[#9E3A26] underline hover:text-[#7A2B1C] font-medium"
                  >
                    Load into Resolve form
                  </button>
                </div>
                <p className="mt-3 text-xs text-[#6B6A65]">
                  Attempting to resolve this commitment (NASA James Webb Telescope) with the Falcon 9 Wikipedia page reverted on-chain with &ldquo;source does not match this commitment&rdquo; and preserved the commitment in the OPEN state.
                </p>
                <div className="mt-5">
                  <CommitmentCard commitment={examplesData.caseC} showActions={false} />
                </div>
              </div>
            )}
          </div>
        )}

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
    </div>
  );
};
