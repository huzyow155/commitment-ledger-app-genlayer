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
  Gavel,
  Check,
  AlertTriangle,
  History,
  X,
  Fingerprint,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  registerCommitmentFlow,
  submitResolutionFlow,
  challengeResolutionFlow,
  finalizeResolutionFlow,
  getCommitment,
  listCommitmentsByRegistrant,
  type TxStatusReport,
  type ContractReadResult,
} from "../services/contractService";
import type { CommitmentRecord } from "../lib/outcome";
import {
  type PipelineStage,
  isAcceptedReceiptStatus,
  isDisagreedReceiptStatus,
  isTimeoutReceiptStatus,
  verifyRegistrationReadback,
  verifyResolutionReadback,
  verifyChallengeReadback,
  verifyFinalizeReadback,
} from "../lib/txLifecycle";
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
  CONTRACT_ADDRESS,
  type ClaimKind,
  type ChallengeReason,
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
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("signing");
  const [pipelineTitle, setPipelineTitle] = useState("Consensus Transaction");

  // Form states: Register
  const [registerText, setRegisterText] = useState("");
  const [registerDeadline, setRegisterDeadline] = useState("");
  const [claimKind, setClaimKind] = useState<ClaimKind>("THIRD_PARTY_REPORT");
  const [retrospectiveAck, setRetrospectiveAck] = useState(false);
  const [newlyCreatedCommitment, setNewlyCreatedCommitment] = useState<CommitmentRecord | null>(null);

  // Form states: Resolve
  const [resolveCommitmentId, setResolveCommitmentId] = useState(searchParams.get("id") || "");
  const [resolveSourceUrl, setResolveSourceUrl] = useState("");
  const [resolvedRecord, setResolvedRecord] = useState<CommitmentRecord | null>(null);

  // Form states: Challenge Modal
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [challengeCid, setChallengeCid] = useState("");
  const [challengeReason, setChallengeReason] = useState<ChallengeReason>("UNSUPPORTED_CLASSIFICATION");
  const [challengeSourceUrl, setChallengeSourceUrl] = useState("");

  // Lookup state
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState<ContractReadResult<CommitmentRecord> | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // My commitments state
  const [myCommitments, setMyCommitments] = useState<CommitmentRecord[]>([]);
  const [myCommitmentsLoading, setMyCommitmentsLoading] = useState(false);

  // Real on-chain example records for "Examples" tab
  const [examplesData, setExamplesData] = useState<{
    caseP1: CommitmentRecord | null;
    caseA: CommitmentRecord | null;
    caseB: CommitmentRecord | null;
    caseC: CommitmentRecord | null;
    loading: boolean;
    error: string | null;
  }>({
    caseP1: null,
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
  const challengeUrlValidation = validateSourceUrl(challengeSourceUrl);

  // Dynamic classification: check against today / current date
  const todayIso = new Date().toISOString().slice(0, 10);
  const isRetrospective = Boolean(
    registerDeadline &&
    registerDeadline.length === 10 &&
    registerDeadline <= todayIso
  );

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
        getCommitment("15c567e44858"), // Case P1 (Prospective, OPEN)
        getCommitment("98e5aceacf75"), // Case A (Apollo 11 KEPT)
        getCommitment("cc4b8e0115bc"), // Case B (Apollo 13 BROKEN)
        getCommitment("8e8d07e65b36"), // Case C (Condition Omitted, BROKEN)
      ])
        .then(([resP1, resA, resB, resC]) => {
          setExamplesData({
            caseP1: resP1.ok && resP1.data ? resP1.data : null,
            caseA: resA.ok && resA.data ? resA.data : null,
            caseB: resB.ok && resB.data ? resB.data : null,
            caseC: resC.ok && resC.data ? resC.data : null,
            loading: false,
            error: null,
          });
        })
        .catch((err) => {
          setExamplesData({
            caseP1: null,
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
    if (isRetrospective && !retrospectiveAck) return;

    setPipelineTitle("Registering Public Commitment");
    setPipelineStage("signing");
    setPipelineOpen(true);
    setNewlyCreatedCommitment(null);

    try {
      setPipelineStage("submitting");
      const { commitmentId, report } = await registerCommitmentFlow(
        account,
        registerText,
        registerDeadline,
        claimKind,
        retrospectiveAck,
        (rep) => {
          setPipelineStatus(rep);
          if (isDisagreedReceiptStatus(rep.statusName)) {
            setPipelineStage("disagreed");
          } else if (isTimeoutReceiptStatus(rep.statusName)) {
            setPipelineStage("timed_out");
          } else if (isAcceptedReceiptStatus(rep.statusName)) {
            if (rep.leaderResult === "SUCCESS") {
              setPipelineStage("accepted");
            } else if (rep.leaderResult === "ERROR") {
              setPipelineStage("reverted");
            } else {
              setPipelineStage("consensus");
            }
          } else {
            setPipelineStage("consensus");
          }
        }
      );

      if (isDisagreedReceiptStatus(report.statusName)) {
        setPipelineStage("disagreed");
        return;
      }
      if (isTimeoutReceiptStatus(report.statusName)) {
        setPipelineStage("timed_out");
        return;
      }
      if (!isAcceptedReceiptStatus(report.statusName) || report.leaderResult === "ERROR") {
        setPipelineStage("reverted");
        return;
      }

      // Step 3: On-Chain State Confirmation via Readback
      setPipelineStage("accepted");
      const readbackRes = await verifyRegistrationReadback(
        commitmentId,
        registerText,
        getCommitment
      );

      if (readbackRes.confirmed && readbackRes.record) {
        setPipelineStage("state_confirmed");
        setNewlyCreatedCommitment(readbackRes.record);
        setRegisterText("");
        refreshMyCommitments();
      } else {
        setPipelineStage("reverted");
        setPipelineStatus((prev) => ({
          txHash: prev?.txHash || report.txHash,
          statusName: "READBACK_FAILED",
          decodedRevert: readbackRes.error || "Failed to confirm registered record on-chain.",
        }));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("timed out") || errMsg.includes("TIMEOUT")) {
        setPipelineStage("timed_out");
      } else {
        setPipelineStage("reverted");
      }
      setPipelineStatus((prev) => ({
        txHash: prev?.txHash || "",
        statusName: "REVERTED",
        decodedRevert: errMsg,
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
      setPipelineStage("submitting");
      const { report } = await submitResolutionFlow(
        account,
        resolveCommitmentId.trim(),
        resolveSourceUrl.trim(),
        (rep) => {
          setPipelineStatus(rep);
          if (isDisagreedReceiptStatus(rep.statusName)) {
            setPipelineStage("disagreed");
          } else if (isTimeoutReceiptStatus(rep.statusName)) {
            setPipelineStage("timed_out");
          } else if (isAcceptedReceiptStatus(rep.statusName)) {
            if (rep.leaderResult === "SUCCESS") {
              setPipelineStage("accepted");
            } else if (rep.leaderResult === "ERROR") {
              setPipelineStage("reverted");
            } else {
              setPipelineStage("consensus");
            }
          } else {
            setPipelineStage("consensus");
          }
        }
      );

      if (isDisagreedReceiptStatus(report.statusName)) {
        setPipelineStage("disagreed");
        return;
      }
      if (isTimeoutReceiptStatus(report.statusName)) {
        setPipelineStage("timed_out");
        return;
      }
      if (!isAcceptedReceiptStatus(report.statusName) || report.leaderResult === "ERROR") {
        setPipelineStage("reverted");
        return;
      }

      // Step 3: On-Chain State Confirmation via Readback
      setPipelineStage("accepted");
      const readbackRes = await verifyResolutionReadback(
        resolveCommitmentId.trim(),
        getCommitment
      );

      if (readbackRes.confirmed && readbackRes.record) {
        setPipelineStage("state_confirmed");
        setResolvedRecord(readbackRes.record);
        refreshMyCommitments();
      } else {
        setPipelineStage("reverted");
        setPipelineStatus((prev) => ({
          txHash: prev?.txHash || report.txHash,
          statusName: "READBACK_FAILED",
          decodedRevert: readbackRes.error || "Failed to confirm resolution mutation on-chain.",
        }));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("timed out") || errMsg.includes("TIMEOUT")) {
        setPipelineStage("timed_out");
      } else {
        setPipelineStage("reverted");
      }
      setPipelineStatus((prev) => ({
        txHash: prev?.txHash || "",
        statusName: "REVERTED",
        decodedRevert: errMsg,
      }));
    }
  };

  // Handle Challenge
  const handleChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (!challengeUrlValidation.ok || !challengeCid.trim()) return;

    setChallengeModalOpen(false);
    setPipelineTitle("Submitting Adjudication Challenge");
    setPipelineStage("signing");
    setPipelineOpen(true);

    try {
      const preRec = await getCommitment(challengeCid.trim());
      const initialCount = preRec.ok && preRec.data?.decisions ? preRec.data.decisions.length : 0;

      setPipelineStage("submitting");
      const { report } = await challengeResolutionFlow(
        account,
        challengeCid.trim(),
        challengeReason,
        challengeSourceUrl.trim(),
        (rep) => {
          setPipelineStatus(rep);
          if (isDisagreedReceiptStatus(rep.statusName)) {
            setPipelineStage("disagreed");
          } else if (isTimeoutReceiptStatus(rep.statusName)) {
            setPipelineStage("timed_out");
          } else if (isAcceptedReceiptStatus(rep.statusName)) {
            if (rep.leaderResult === "SUCCESS") {
              setPipelineStage("accepted");
            } else if (rep.leaderResult === "ERROR") {
              setPipelineStage("reverted");
            } else {
              setPipelineStage("consensus");
            }
          } else {
            setPipelineStage("consensus");
          }
        }
      );

      if (isDisagreedReceiptStatus(report.statusName)) {
        setPipelineStage("disagreed");
        return;
      }
      if (isTimeoutReceiptStatus(report.statusName)) {
        setPipelineStage("timed_out");
        return;
      }
      if (!isAcceptedReceiptStatus(report.statusName) || report.leaderResult === "ERROR") {
        setPipelineStage("reverted");
        return;
      }

      // Step 3: On-Chain State Confirmation via Readback
      setPipelineStage("accepted");
      const readbackRes = await verifyChallengeReadback(
        challengeCid.trim(),
        initialCount,
        getCommitment
      );

      if (readbackRes.confirmed) {
        setPipelineStage("state_confirmed");
        refreshMyCommitments();
      } else {
        setPipelineStage("reverted");
        setPipelineStatus((prev) => ({
          txHash: prev?.txHash || report.txHash,
          statusName: "READBACK_FAILED",
          decodedRevert: readbackRes.error || "Failed to confirm challenge decision increase on-chain.",
        }));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("timed out") || errMsg.includes("TIMEOUT")) {
        setPipelineStage("timed_out");
      } else {
        setPipelineStage("reverted");
      }
      setPipelineStatus((prev) => ({
        txHash: prev?.txHash || "",
        statusName: "REVERTED",
        decodedRevert: errMsg,
      }));
    }
  };

  // Handle Finalize
  const handleFinalize = async (commitmentId: string) => {
    if (!account) return;
    setPipelineTitle("Finalizing Resolution");
    setPipelineStage("signing");
    setPipelineOpen(true);

    try {
      setPipelineStage("submitting");
      const { report } = await finalizeResolutionFlow(
        account,
        commitmentId.trim(),
        (rep) => {
          setPipelineStatus(rep);
          if (isDisagreedReceiptStatus(rep.statusName)) {
            setPipelineStage("disagreed");
          } else if (isTimeoutReceiptStatus(rep.statusName)) {
            setPipelineStage("timed_out");
          } else if (isAcceptedReceiptStatus(rep.statusName)) {
            if (rep.leaderResult === "SUCCESS") {
              setPipelineStage("accepted");
            } else if (rep.leaderResult === "ERROR") {
              setPipelineStage("reverted");
            } else {
              setPipelineStage("consensus");
            }
          } else {
            setPipelineStage("consensus");
          }
        }
      );

      if (isDisagreedReceiptStatus(report.statusName)) {
        setPipelineStage("disagreed");
        return;
      }
      if (isTimeoutReceiptStatus(report.statusName)) {
        setPipelineStage("timed_out");
        return;
      }
      if (!isAcceptedReceiptStatus(report.statusName) || report.leaderResult === "ERROR") {
        setPipelineStage("reverted");
        return;
      }

      // Step 3: On-Chain State Confirmation via Readback
      setPipelineStage("accepted");
      const readbackRes = await verifyFinalizeReadback(commitmentId.trim(), getCommitment);

      if (readbackRes.confirmed) {
        setPipelineStage("state_confirmed");
        refreshMyCommitments();
      } else {
        setPipelineStage("reverted");
        setPipelineStatus((prev) => ({
          txHash: prev?.txHash || report.txHash,
          statusName: "READBACK_FAILED",
          decodedRevert: readbackRes.error || "Failed to confirm FINAL status on-chain.",
        }));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("timed out") || errMsg.includes("TIMEOUT")) {
        setPipelineStage("timed_out");
      } else {
        setPipelineStage("reverted");
      }
      setPipelineStatus((prev) => ({
        txHash: prev?.txHash || "",
        statusName: "REVERTED",
        decodedRevert: errMsg,
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
            Register prospective promises or historical analysis, adjudicate with multi-element ground truth, and exercise bounded challenge reconsideration.
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
                      Validators execute multi-node canonical extraction of the subject and action, recording temporal authenticity and unverified claim kind in consensus storage.
                    </p>

                    {/* Claim Kind Selector */}
                    <div className="mt-6">
                      <label className="block text-xs font-semibold text-[#0a0a0a] mb-2">
                        Claim Kind & Identity Attribution
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setClaimKind("THIRD_PARTY_REPORT")}
                          className={`rounded-2xl border p-3.5 text-left transition ${
                            claimKind === "THIRD_PARTY_REPORT"
                              ? "border-[#0a0a0a] bg-black/5"
                              : "border-black/10 bg-white hover:border-black/20"
                          }`}
                        >
                          <div className="font-semibold text-xs text-[#0a0a0a]">Third-Party Report</div>
                          <p className="mt-1 text-[11px] text-[#6b6b6b] leading-relaxed">
                            News article, press release, or organizational public announcement.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setClaimKind("SELF_DECLARED")}
                          className={`rounded-2xl border p-3.5 text-left transition ${
                            claimKind === "SELF_DECLARED"
                              ? "border-[#0a0a0a] bg-black/5"
                              : "border-black/10 bg-white hover:border-black/20"
                          }`}
                        >
                          <div className="font-semibold text-xs text-[#0a0a0a]">Self-Declared</div>
                          <p className="mt-1 text-[11px] text-[#6b6b6b] leading-relaxed">
                            Personal commitment statement. Note: signer identity is unverified on-chain.
                          </p>
                        </button>
                      </div>
                    </div>

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
                        placeholder="e.g. SpaceX will launch the USSF-481 mission for the United States Space Force from Vandenberg on or before 2026-10-16."
                        className="w-full rounded-2xl border border-black/10 bg-white p-4 font-serif text-base text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none transition leading-relaxed"
                      />
                      {registerText.length > 0 && !textValidation.ok && (
                        <p className="mt-1.5 text-xs text-rose-600">{textValidation.message}</p>
                      )}
                    </div>

                    {/* Deadline Input & Dynamic Temporal Classification */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="deadline" className="block text-xs font-semibold text-[#0a0a0a]">
                          Mandatory Calendar Deadline (YYYY-MM-DD)
                        </label>
                        {registerDeadline && deadlineValidation.ok && (
                          <span
                            className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isRetrospective
                                ? "bg-stone-100 text-stone-700 border border-stone-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {isRetrospective ? "Historical Analysis" : "Prospective Track"}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="deadline"
                          type="text"
                          value={registerDeadline}
                          onChange={(e) => setRegisterDeadline(e.target.value)}
                          placeholder="2026-10-16"
                          className="w-full rounded-2xl border border-black/10 bg-white p-3.5 font-mono text-sm text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none transition"
                        />
                        <Calendar size={16} className="absolute right-4 top-4 text-[#6b6b6b]" />
                      </div>

                      {/* Retrospective Warning & Checkbox */}
                      {isRetrospective && (
                        <div className="mt-3.5 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950">
                          <div className="flex items-center gap-2 font-semibold">
                            <AlertTriangle size={14} className="text-amber-700" />
                            <span>Retrospective Deadline Detected</span>
                          </div>
                          <p className="mt-1 leading-relaxed">
                            The entered deadline has already passed on the chain clock. To prevent counterfeit future commitments, the contract requires explicit acknowledgment to catalog this as Historical Analysis.
                          </p>
                          <label className="mt-3 flex items-start gap-2.5 cursor-pointer font-medium">
                            <input
                              type="checkbox"
                              checked={retrospectiveAck}
                              onChange={(e) => setRetrospectiveAck(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                            />
                            <span>
                              I acknowledge this deadline is in the past and wish to record a retrospective historical analysis claim.
                            </span>
                          </label>
                        </div>
                      )}

                      {!isRetrospective && registerDeadline && deadlineValidation.ok && (
                        <p className="mt-2 text-xs text-emerald-700 leading-relaxed">
                          Prospective record verified. The smart contract refuses premature resolution attempts until this deadline date arrives.
                        </p>
                      )}

                      {registerDeadline.length > 0 && !deadlineValidation.ok && (
                        <p className="mt-1.5 text-xs text-rose-600">{deadlineValidation.message}</p>
                      )}
                    </div>

                    {/* Phrasing Hint */}
                    <div className="mt-6 rounded-2xl border border-black/10 bg-[#fbfbfb] p-4 text-xs text-[#6b6b6b] leading-relaxed">
                      <strong className="text-[#0a0a0a]">Adjudication structure:</strong> The v3.1.0 contract decomposes this statement into discrete action, condition, and deadline elements. Every element must be grounded in an explicit numbered passage to qualify for a conclusive outcome.
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex justify-end">
                      <button
                        type="submit"
                        disabled={
                          !textValidation.ok ||
                          !deadlineValidation.ok ||
                          (isRetrospective && !retrospectiveAck)
                        }
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
                      Temporal Authenticity
                    </h3>
                    <p className="mt-2.5 leading-relaxed">
                      Commitments with future deadlines enter the <strong>Accountability Track</strong> and remain permanently OPEN until their calendar deadline matures on the GenVM consensus clock. Historical events are recorded under <strong>Historical Analysis</strong> with mandatory acknowledgment.
                    </p>
                  </div>

                  <div className="workbench-surface p-6 text-xs text-[#6b6b6b]">
                    <h3 className="font-serif text-base font-semibold text-[#0a0a0a]">
                      Consensus Contract Address
                    </h3>
                    <code className="mt-2 block font-mono text-[11px] text-[#0a0a0a] bg-black/5 p-2 rounded break-all">
                      {CONTRACT_ADDRESS}
                    </code>
                    <p className="mt-2 text-[11px] text-[#6b6b6b]">
                      Verified source on Studionet (Chain ID 61999).
                    </p>
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
                      Provide an allowlisted public source URL. The contract selects highest-density windows, segments text into numbered passages, and adjudicates all statement elements through comparative consensus.
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
                        placeholder="e.g. 98e5aceacf75"
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

                      {/* Window Selection & Budget Note */}
                      <div className="mt-4 rounded-2xl border border-black/10 bg-[#fafafa] p-4 text-xs text-[#6b6b6b] leading-relaxed">
                        <strong className="text-[#0a0a0a]">Deterministic Window Selection:</strong>{" "}
                        The contract inspects up to 12,000 characters across overlapping 3,000-character windows scored by relevance to the commitment statement. Every cited segment generates a SHA-256 fingerprint anchored to the transaction receipt.
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
                        <span>Resolution Record Written</span>
                      </div>
                      <CommitmentCard
                        commitment={resolvedRecord}
                        onChallengeClick={(id) => {
                          setChallengeCid(id);
                          setChallengeModalOpen(true);
                        }}
                        onFinalizeClick={handleFinalize}
                      />
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
                      placeholder="Enter 12-hex commitment ID (e.g. 98e5aceacf75)"
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
                              onChallengeClick={(id) => {
                                setChallengeCid(id);
                                setChallengeModalOpen(true);
                              }}
                              onFinalizeClick={handleFinalize}
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
                            onChallengeClick={(id) => {
                              setChallengeCid(id);
                              setChallengeModalOpen(true);
                            }}
                            onFinalizeClick={handleFinalize}
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
                    Verified On-Chain Cases
                  </h2>
                  <p className="mt-1.5 leading-relaxed text-xs sm:text-sm">
                    Verified scenarios executed on GenLayer Studionet against contract{" "}
                    <code className="font-mono text-xs text-[#0a0a0a] font-medium">
                      {CONTRACT_ADDRESS}
                    </code>
                    .
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

                {/* Case P1: Prospective */}
                {examplesData.caseP1 && (
                  <div className="workbench-surface p-7 sm:p-8 reveal-on-scroll" style={{ "--stagger": 1 } as React.CSSProperties}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4">
                      <span className="font-sans text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Case P1: Prospective Accountability Track (OPEN until 2026-10-16)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRegisterText(examplesData.caseP1!.raw_text);
                          setRegisterDeadline(examplesData.caseP1!.deadline_hint);
                          setTab("register");
                        }}
                        className="text-xs text-[#0a0a0a] underline font-medium"
                      >
                        Load into Register form
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-[#6b6b6b]">
                      Authentic future spaceflight launch recorded in advance. Premature resolution is refused on-chain by the GenVM clock until 2026-10-16.
                    </p>
                    <div className="mt-5">
                      <CommitmentCard commitment={examplesData.caseP1} showActions={false} />
                    </div>
                  </div>
                )}

                {/* Case A: KEPT */}
                {examplesData.caseA && (
                  <div className="workbench-surface p-7 sm:p-8 reveal-on-scroll" style={{ "--stagger": 2 } as React.CSSProperties}>
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

                {/* Case B: BROKEN */}
                {examplesData.caseB && (
                  <div className="workbench-surface p-7 sm:p-8 reveal-on-scroll" style={{ "--stagger": 3 } as React.CSSProperties}>
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

                {/* Case C: Condition Omitted */}
                {examplesData.caseC && (
                  <div className="workbench-surface p-7 sm:p-8 reveal-on-scroll" style={{ "--stagger": 4 } as React.CSSProperties}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4">
                      <span className="font-sans text-xs font-bold uppercase tracking-wider text-amber-800">
                        Case C: Mandatory Condition Omitted in Summarization (BROKEN)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRegisterText(examplesData.caseC!.raw_text);
                          setRegisterDeadline(examplesData.caseC!.deadline_hint);
                          setTab("register");
                        }}
                        className="text-xs text-[#0a0a0a] underline font-medium"
                      >
                        Load into Register form
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-[#6b6b6b]">
                      Statement promised &ldquo;all three of its astronauts on the lunar surface&rdquo;. The element mapper verified Action satisfied (Armstrong & Aldrin), but Condition unfulfilled (Collins remained in orbit).
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

      {/* Challenge Resolution Modal */}
      {challengeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-2">
                <Gavel size={18} className="text-[#0a0a0a]" />
                <h3 className="font-serif text-xl font-semibold text-[#0a0a0a]">
                  Challenge Provisional Decision
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChallengeModalOpen(false)}
                className="rounded-full p-1 text-[#6b6b6b] hover:bg-black/5 hover:text-[#0a0a0a] transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChallenge} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0a0a0a] mb-1">
                  Commitment ID
                </label>
                <input
                  type="text"
                  value={challengeCid}
                  disabled
                  className="w-full rounded-xl border border-black/10 bg-black/5 p-3 font-mono text-xs text-[#0a0a0a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0a0a0a] mb-1">
                  Challenge Reason
                </label>
                <select
                  value={challengeReason}
                  onChange={(e) => setChallengeReason(e.target.value as ChallengeReason)}
                  className="w-full rounded-xl border border-black/10 bg-white p-3 text-xs text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none"
                >
                  <option value="UNSUPPORTED_CLASSIFICATION">
                    UNSUPPORTED_CLASSIFICATION (Strict Grounding Re-review)
                  </option>
                  <option value="CONFLICTING_EVIDENCE">
                    CONFLICTING_EVIDENCE (New Source Document)
                  </option>
                </select>
                <p className="mt-1 text-[11px] text-[#6b6b6b]">
                  {challengeReason === "UNSUPPORTED_CLASSIFICATION"
                    ? "Requires every element to cite an explicit grounded segment; ungrounded elements result in WITHDRAWN status."
                    : "Presents alternative documented evidence from an allowlisted domain."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0a0a0a] mb-1">
                  Source URL
                </label>
                <input
                  type="text"
                  value={challengeSourceUrl}
                  onChange={(e) => setChallengeSourceUrl(e.target.value)}
                  placeholder="https://en.wikipedia.org/wiki/..."
                  className="w-full rounded-xl border border-black/10 bg-white p-3 font-mono text-xs text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none"
                />
                {challengeSourceUrl.length > 0 && !challengeUrlValidation.ok && (
                  <p className="mt-1 text-[11px] text-rose-600">{challengeUrlValidation.message}</p>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setChallengeModalOpen(false)}
                  className="rounded-full border border-black/10 px-5 py-2.5 text-xs font-semibold text-[#6b6b6b] hover:bg-black/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!challengeUrlValidation.ok || !challengeSourceUrl.trim()}
                  className="primary-button text-xs h-10 px-6"
                >
                  Broadcast Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
