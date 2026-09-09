"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type InformationTopic = "privacy" | "terms" | "support";

const informationContent: Record<
  InformationTopic,
  { title: string; items: string[] }
> = {
  privacy: {
    title: "Privacy Policy",
    items: [
      "Safeguards confidential law enforcement and judicial documents, such as FIRs and charge sheets, processed under the National Crime Records Bureau.",
      "Employs advanced cryptographic standards and strict role-based access control to protect sensitive case files and personally identifiable information.",
      "Adheres to national statutory frameworks for secure data retention, handling, and eventual purging of unsealed records.",
    ],
  },
  terms: {
    title: "Terms of Use",
    items: [
      "Restricts platform access exclusively to authorized personnel from law enforcement agencies, courts, and investigative departments under the Ministry of Home Affairs.",
      "Records every document interaction, view, and transfer in an immutable audit log to maintain strict legal chain-of-custody integrity.",
      "Strictly prohibits credential sharing, unauthorized data extraction, or the export of confidential files to unencrypted personal devices.",
    ],
  },
  support: {
    title: "Help & Support",
    items: [
      "Provides a dedicated technical helpdesk and email channel (support-ncrb@gov.in) for resolving system errors, login issues, and upload failures.",
      "Maintains a 24/7 Security Operations Center (SOC) escalation pathway for immediate reporting of suspected security breaches or compromised credentials.",
    ],
  },
};

export default function Login() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openInformation, setOpenInformation] =
    useState<InformationTopic | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenInformation(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // STEP 1 → STEP 2
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setStep(2);
  };

  // STEP 2 → SIGN IN
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      const user = data.user;
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      if (rememberMe) {
        localStorage.setItem("kora_token", data.token);
        localStorage.setItem("token", data.token);
        sessionStorage.removeItem("token");
      } else {
        localStorage.removeItem("kora_token");
        localStorage.removeItem("token");
        sessionStorage.setItem("token", data.token);
      }

      localStorage.setItem("userName", username.trim());
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.message || "Unable to connect to the server. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-900">
      {/* ================= BACKGROUND ================= */}
      <img
        src="/bgimg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/20" />

      {/* ================= MAIN CONTENT ================= */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ================= HEADER ================= */}
        <header className="flex items-start justify-between px-8 py-5 pr-2">
          {/* JANMITRA BRAND */}
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden">
              <img
                src="/logo.jpg"
                alt="Janmitra"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="text-white drop-shadow-md">
              <h1 className="text-2xl font-bold tracking-[0.18em]">JANMITRA</h1>

              <p className="text-[9px] tracking-[0.22em] font-medium">
                JUSTICE • SERVICE • SOCIETY
              </p>
            </div>
          </div>

          {/* GOVERNMENT OF INDIA */}
          <div className="flex items-center gap-0 text-white drop-shadow-md">
            <div className="text-right">
              <p className="text-lg font-semibold">Government of India</p>

              <p className="text-xs tracking-wide">सत्यमेव जयते</p>
            </div>

            <div className="h-16 w-25 flex items-center justify-center -ml-7">
              <img
                src="/national-emblem.png"
                alt="State Emblem of India"
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>
        </header>

        {/* ================= LOGIN AREA ================= */}
        <main className="flex-1 flex items-center px-8 pb-10">
          <div className="w-full max-w-md">
            {/* LOGIN CARD */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* TOP TRICOLOR STRIPE */}
              <div className="h-1.5 flex">
                <div className="w-1/3 bg-orange-500" />
                <div className="w-1/3 bg-white border-y border-gray-100" />
                <div className="w-1/3 bg-green-700" />
              </div>

              <div className="px-8 py-8">
                {/* TITLE */}
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome to JANMITRA
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {step === 1
                      ? "Sign in to access your account"
                      : "Enter your username to continue"}
                  </p>
                </div>

                {/* STEP INDICATOR */}
                <div className="flex items-center gap-2 mb-6">
                  <div
                    className={`h-2 flex-1 rounded-full ${
                      step >= 1 ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />

                  <div
                    className={`h-2 flex-1 rounded-full ${
                      step >= 2 ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                </div>

                {/* ERROR */}
                {error && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* ================= STEP 1 ================= */}
                {step === 1 && (
                  <form onSubmit={handleNext}>
                    {/* EMAIL */}
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="m3 7 9 6 9-6" />
                          </svg>
                        </span>

                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* PASSWORD */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <rect x="5" y="10" width="14" height="11" rx="2" />
                            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                          </svg>
                        </span>

                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-11 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />

                        {/* EYE */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <svg
                              width="19"
                              height="19"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path d="M3 3l18 18" />
                              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                              <path d="M9.9 4.2A10.5 10.5 0 0 1 12 4c5 0 8.5 4 9.5 6-.4.8-1.4 2.2-2.9 3.4" />
                              <path d="M6.2 6.2C4.4 7.3 3.2 8.8 2.5 10c1 2 4.5 6 9.5 6 1 0 1.9-.2 2.7-.5" />
                            </svg>
                          ) : (
                            <svg
                              width="19"
                              height="19"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                              <circle cx="12" cy="12" r="2.5" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* REMEMBER + FORGOT */}
                    <div className="flex items-center justify-between mb-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />

                        <span className="text-sm text-gray-600">
                          Remember me
                        </span>
                      </label>

                      <button
                        type="button"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    {/* NEXT */}
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]"
                    >
                      <span className="flex items-center justify-center gap-2">
                        Next
                        <span className="text-lg leading-none">→</span>
                      </span>
                    </button>
                  </form>
                )}

                {/* ================= STEP 2 ================= */}
                {step === 2 && (
                  <form onSubmit={handleSignIn}>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <svg
                            width="19"
                            height="19"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                          </svg>
                        </span>

                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter your username"
                          autoFocus
                          className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        Enter the username associated with your JANMITRA
                        account.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        "Signing In..."
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Sign In
                          <span className="text-lg leading-none">→</span>
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setStep(1);
                      }}
                      className="w-full mt-3 rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      ← Back
                    </button>
                  </form>
                )}

                {/* OR */}
                <div className="my-7 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />

                  <span className="text-xs font-medium text-gray-400">OR</span>

                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* SIGN UP */}
                <div className="text-center text-sm text-gray-600">
                  <span>New user? </span>

                  <Link
                    href="/register/step1"
                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ================= FOOTER ================= */}
        <footer className="bg-[#0b1f33]/95 px-8 py-3 text-white">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p className="text-gray-300">
              © 2026 JANMITRA. All rights reserved.
            </p>

            <div className="flex items-center gap-4 text-gray-300">
              <button
                type="button"
                onClick={() => setOpenInformation("privacy")}
                className="hover:text-white transition"
              >
                Privacy Policy
              </button>

              <span className="text-gray-500">|</span>

              <button
                type="button"
                onClick={() => setOpenInformation("terms")}
                className="hover:text-white transition"
              >
                Terms of Use
              </button>

              <span className="text-gray-500">|</span>

              <button
                type="button"
                onClick={() => setOpenInformation("support")}
                className="hover:text-white transition"
              >
                Help & Support
              </button>
            </div>
          </div>
        </footer>
      </div>

      {openInformation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-md"
          role="presentation"
          onClick={() => setOpenInformation(null)}
        >
          <section
            aria-labelledby="information-modal-title"
            aria-modal="true"
            className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/70 bg-white/90 p-7 text-slate-900 shadow-2xl backdrop-blur-xl sm:p-9"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close information"
              onClick={() => setOpenInformation(null)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            >
              <span aria-hidden="true">×</span>
            </button>

            <div className="mb-6 pr-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                JANMITRA
              </p>
              <h2 id="information-modal-title" className="text-2xl font-bold">
                {informationContent[openInformation].title}
              </h2>
            </div>

            <ul className="space-y-4 text-sm leading-6 text-slate-600">
              {informationContent[openInformation].items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
