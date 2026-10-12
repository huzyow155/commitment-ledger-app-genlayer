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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Banner with back link */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E3DC] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#141413]">Commitment Workbench</h1>
          <p className="text-xs text-[#63625E]">
            Register promises, discover IDs, and resolve commitments against allowlisted public sources.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#9E3A26] hover:underline"
        >
          <span>← Back to Protocol Overview</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap border-b border-[#E7E3DC]">
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
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition ${
                isActive
                  ? "border-[#9E3A26] text-[#9E3A26]"
                  : "border-transparent text-[#63625E] hover:border-[#E7E3DC] hover:text-[#141413]"
              }`}
            >
              <Icon size={15} />
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
            <form onSubmit={handleRegister} className="rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-semibold text-[#141413]">
                Register a Public Commitment
              </h2>
              <p className="mt-1 text-xs text-[#63625E]">
                Validators will execute multi-node canonical extraction of the subject and action into consensus storage.
              </p>

              {/* Text Area */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-medium text-[#141413]">
                  <label htmlFor="rawText">Commitment Statement</label>
                  <span
                    className={`font-mono ${
                      registerText.length > 400 ? "text-rose-600 font-bold" : "text-[#63625E]"
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
                  className="mt-1.5 w-full rounded-xl border border-[#E7E3DC] p-3 font-serif text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                />
                {registerText.length > 0 && !textValidation.ok && (
                  <p className="mt-1 text-xs text-rose-600">{textValidation.message}</p>
                )}
              </div>

              {/* Deadline Input */}
              <div className="mt-5">
                <label htmlFor="deadline" className="block text-xs font-medium text-[#141413]">
                  Mandatory Calendar Deadline (YYYY-MM-DD)
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="deadline"
                      type="text"
                      value={registerDeadline}
                      onChange={(e) => setRegisterDeadline(e.target.value)}
                      placeholder="1970-01-01"
                      className="w-full rounded-xl border border-[#E7E3DC] p-3 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                    />
                    <Calendar size={16} className="absolute right-3 top-3.5 text-[#63625E]" />
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-[#63625E]">
                  Resolution is refused on-chain by the deterministic clock before this date. Real calendar days and leap years are strictly validated.
                </p>
                {registerDeadline.length > 0 && !deadlineValidation.ok && (
                  <p className="mt-1 text-xs text-rose-600">{deadlineValidation.message}</p>
                )}
              </div>

              {/* Phrasing Hint */}
              <div className="mt-5 rounded-lg border border-[#E7E3DC] bg-[#F7F4EF] p-3.5 text-xs text-[#63625E]">
                <strong className="text-[#141413]">Best practice phrasing:</strong> Be concrete, singular, and verifiable. State who will do what by when (e.g., &ldquo;Mission X will land on the Moon before 1970&rdquo;). Compound clauses may trigger validator disagreement if partially fulfilled.
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={!textValidation.ok || !deadlineValidation.ok}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#9E3A26] px-5 py-2.5 font-sans text-xs font-semibold text-white shadow-sm transition hover:bg-[#7A2B1C] disabled:opacity-40"
                >
                  <FileText size={15} />
                  <span>Broadcast Registration</span>
                </button>
              </div>
            </form>

            {/* Display newly created commitment */}
            {newlyCreatedCommitment && (
              <div className="mt-6">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
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
            <div className="rounded-2xl border border-[#E7E3DC] bg-[#F7F4EF]/50 p-5 text-xs text-[#63625E]">
              <h3 className="font-serif text-sm font-semibold text-[#141413]">
                Discovery via Snapshot Diff
              </h3>
              <p className="mt-2 leading-relaxed">
                Smart contract writes on GenLayer do not return values directly to browsers. To capture your fresh commitment ID, the app takes a snapshot of your records before submission, monitors for the accepted transaction, and extracts the newly added record.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 text-xs text-[#63625E]">
              <h3 className="font-serif text-sm font-semibold text-[#141413]">
                Registration Guardrails
              </h3>
              <ul className="mt-3 space-y-2 list-disc pl-4 leading-relaxed">
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
            <form onSubmit={handleResolve} className="rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-semibold text-[#141413]">
                Resolve an Open Commitment
              </h2>
              <p className="mt-1 text-xs text-[#63625E]">
                Provide an allowlisted public source URL. The contract will fetch the page directly and verify a verbatim quote through consensus.
              </p>

              {/* Target ID */}
              <div className="mt-5">
                <label htmlFor="resolveId" className="block text-xs font-medium text-[#141413]">
                  Commitment ID
                </label>
                <input
                  id="resolveId"
                  type="text"
                  value={resolveCommitmentId}
                  onChange={(e) => setResolveCommitmentId(e.target.value)}
                  placeholder="e.g. 1fe69a47c557"
                  className="mt-1.5 w-full rounded-xl border border-[#E7E3DC] p-3 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                />
              </div>

              {/* Source URL */}
              <div className="mt-5">
                <label htmlFor="sourceUrl" className="block text-xs font-medium text-[#141413]">
                  Allowlisted Public Source URL
                </label>
                <div className="mt-1.5 relative">
                  <input
                    id="sourceUrl"
                    type="text"
                    value={resolveSourceUrl}
                    onChange={(e) => setResolveSourceUrl(e.target.value)}
                    placeholder="https://en.wikipedia.org/wiki/..."
                    className="w-full rounded-xl border border-[#E7E3DC] p-3 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
                  />
                  <Globe size={16} className="absolute right-3 top-3.5 text-[#63625E]" />
                </div>
                {resolveSourceUrl.length > 0 && !urlValidation.ok && (
                  <p className="mt-1 text-xs text-rose-600">{urlValidation.message}</p>
                )}

                {/* Allowlist Chips */}
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-[#63625E]">Allowed Domains:</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {ALLOWED_DOMAINS.map((dom) => (
                      <button
                        key={dom}
                        type="button"
                        onClick={() => setResolveSourceUrl(`https://en.${dom}/`)}
                        className="rounded-md border border-[#E7E3DC] bg-[#F7F4EF] px-2 py-0.5 font-mono text-[11px] text-[#141413] hover:border-[#141413]"
                      >
                        {dom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6,000 char note */}
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                  <strong className="font-semibold">Truncation Limit ({SOURCE_TRUNCATION_LIMIT.toLocaleString()} chars):</strong> The contract fetches and evaluates only the first 6,000 characters of the cited web page. If evidence details appear deeper down, validators will agree on <code>NOMATCH</code> (source does not match), leaving the commitment open.
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={!urlValidation.ok || !resolveCommitmentId.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#9E3A26] px-5 py-2.5 font-sans text-xs font-semibold text-white shadow-sm transition hover:bg-[#7A2B1C] disabled:opacity-40"
                >
                  <ShieldCheck size={15} />
                  <span>Execute Consensus Resolution</span>
                </button>
              </div>
            </form>

            {/* Resolved Record card if successful */}
            {resolvedRecord && (
              <div className="mt-6">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  <CheckCircle2 size={15} />
                  <span>Resolved Commitment Sealed</span>
                </div>
                <CommitmentCard commitment={resolvedRecord} />
              </div>
            )}
          </div>

          {/* Quick Picker for User's Open Commitments */}
          <div>
            <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 shadow-sm">
              <h3 className="font-serif text-sm font-semibold text-[#141413]">
                Your Open Commitments
              </h3>
              <p className="mt-1 text-xs text-[#63625E]">
                Select an open commitment to pre-fill the form.
              </p>

              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {myCommitmentsLoading ? (
                  <p className="text-xs text-[#63625E]">Loading your commitments…</p>
                ) : myCommitments.filter((c) => c.status === "OPEN").length === 0 ? (
                  <p className="text-xs text-[#63625E]">No open commitments found for current address.</p>
                ) : (
                  myCommitments
                    .filter((c) => c.status === "OPEN")
                    .map((comm) => (
                      <div
                        key={comm.commitment_id}
                        onClick={() => setResolveCommitmentId(comm.commitment_id)}
                        className="cursor-pointer rounded-lg border border-[#E7E3DC] p-3 text-xs transition hover:border-[#9E3A26] hover:bg-[#F7F4EF]"
                      >
                        <div className="flex items-center justify-between font-mono font-semibold text-[#141413]">
                          <span>{comm.commitment_id}</span>
                          <span className="text-[11px] text-[#63625E]">{comm.deadline_hint}</span>
                        </div>
                        <p className="mt-1 font-serif text-[#63625E] line-clamp-2">
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
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-[#141413]">
              Read Commitment by ID
            </h2>
            <form onSubmit={handleLookup} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Enter 12-hex commitment ID (e.g. 1fe69a47c557)"
                className="flex-1 rounded-xl border border-[#E7E3DC] p-3 font-mono text-sm text-[#141413] focus:border-[#141413] focus:outline-none"
              />
              <button
                type="submit"
                disabled={lookupLoading || !lookupId.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#141413] px-6 py-3 font-sans text-xs font-semibold text-white transition hover:bg-[#333] disabled:opacity-40"
              >
                <Search size={14} />
                <span>{lookupLoading ? "Querying…" : "Query Ledger"}</span>
              </button>
            </form>

            {/* Lookup Result View */}
            {lookupResult && (
              <div className="mt-6 border-t border-[#E7E3DC] pt-5">
                {lookupResult.ok ? (
                  lookupResult.isNotFound ? (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
                      <strong>Commitment Not Found:</strong> No commitment with ID <code>{lookupId}</code> exists in contract storage.
                    </div>
                  ) : (
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
                        Record Found
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
                  <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900">
                    <strong>RPC Read Error:</strong> {lookupResult.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* My Commitments List */}
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E7E3DC] pb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#141413]">
                  Commitments Registered by Your Address
                </h3>
                <span className="font-mono text-xs text-[#63625E]">{address}</span>
              </div>
              <button
                type="button"
                onClick={refreshMyCommitments}
                className="text-xs text-[#9E3A26] underline hover:text-[#7A2B1C]"
              >
                Refresh List
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {myCommitmentsLoading ? (
                <p className="text-xs text-[#63625E]">Loading commitments…</p>
              ) : myCommitments.length === 0 ? (
                <p className="text-xs text-[#63625E]">
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
          <div className="rounded-2xl border border-[#E7E3DC] bg-[#F7F4EF]/60 p-6 text-xs text-[#63625E]">
            <h2 className="font-serif text-lg font-semibold text-[#141413]">
              Real Studionet Consensus Cases
            </h2>
            <p className="mt-1 leading-relaxed">
              These three real scenarios were executed on GenLayer Studionet against contract <code>0x3155c7c80f4334968d61E1b79f74EB864CF7cb08</code>. You can load their parameters directly into the workbench forms.
            </p>
          </div>

          {examplesData.loading && (
            <div className="p-8 text-center text-xs text-[#63625E]">
              Reading example commitments from Studionet RPC…
            </div>
          )}

          {examplesData.error && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900">
              <strong>Error querying RPC:</strong> {examplesData.error}
            </div>
          )}

          {examplesData.caseA && (
            <div className="rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E3DC] pb-3">
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
                  className="text-xs text-[#9E3A26] underline hover:text-[#7A2B1C]"
                >
                  Load into Register form
                </button>
              </div>
              <div className="mt-4">
                <CommitmentCard commitment={examplesData.caseA} showActions={false} />
              </div>
            </div>
          )}

          {examplesData.caseB && (
            <div className="rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E3DC] pb-3">
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
                  className="text-xs text-[#9E3A26] underline hover:text-[#7A2B1C]"
                >
                  Load into Register form
                </button>
              </div>
              <div className="mt-4">
                <CommitmentCard commitment={examplesData.caseB} showActions={false} />
              </div>
            </div>
          )}

          {examplesData.caseC && (
            <div className="rounded-2xl border border-[#E7E3DC] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E3DC] pb-3">
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
                  className="text-xs text-[#9E3A26] underline hover:text-[#7A2B1C]"
                >
                  Load into Resolve form
                </button>
              </div>
              <p className="mt-3 text-xs text-[#63625E]">
                Attempting to resolve this commitment (NASA James Webb Telescope) with the Falcon 9 Wikipedia page reverted on-chain with &ldquo;source does not match this commitment&rdquo; and preserved the commitment in the OPEN state.
              </p>
              <div className="mt-4">
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
  );
};
