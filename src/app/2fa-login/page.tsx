'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TwoFactorLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');

  const [status, setStatus] =
    useState<'loading' | 'success' | 'error'>('loading');

  const [message, setMessage] = useState(
    'Verifying your secure login...'
  );

  useEffect(() => {
    const verifyLogin = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }

      try {
        const res = await fetch(
          '/api/auth/2fa/verify-login',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(
            data.error ||
              'Verification failed.'
          );
        }

        if (data.token) {
          localStorage.setItem(
            'kora_token',
            data.token
          );
        }

        if (data.user) {
          localStorage.setItem(
            'user',
            JSON.stringify(data.user)
          );

          if (data.user.fullName) {
            localStorage.setItem(
              'userName',
              data.user.fullName
            );
          }
        }

        setStatus('success');
        setMessage(
          'Login verified successfully. Redirecting...'
        );

        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      } catch (error: any) {
        setStatus('error');

        setMessage(
          error.message ||
            'Verification failed.'
        );
      }
    };

    verifyLogin();
  }, [token, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        {status === 'loading' && (
          <>
            <h1 className="text-2xl font-bold text-slate-900">
              Verifying Login
            </h1>

            <p className="mt-4 text-slate-600">
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-green-600">
              Login Verified
            </h1>

            <p className="mt-4 text-slate-600">
              {message}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-red-600">
              Verification Failed
            </h1>

            <p className="mt-4 text-slate-600">
              {message}
            </p>

            <button
              onClick={() => router.push('/')}
              className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-white"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </main>
  );
}