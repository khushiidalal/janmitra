"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      setMessage(
        data.message ||
          "If this email is registered, a password reset link has been sent."
      );
    } catch (error: any) {
      setMessage(error.message || "Unable to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-900">
      <img
        src="/bgimg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

          <div className="h-1.5 flex">
            <div className="w-1/3 bg-orange-500" />
            <div className="w-1/3 bg-white border-y border-gray-100" />
            <div className="w-1/3 bg-green-700" />
          </div>

          <div className="px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Forgot Password
            </h1>

            <p className="mt-1 mb-6 text-sm text-gray-500">
              Enter your registered email address to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full rounded-lg border border-gray-300 bg-white py-3 px-4 text-sm text-gray-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            {message && (
              <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {message}
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}