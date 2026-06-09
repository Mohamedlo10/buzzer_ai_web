'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle, Zap } from 'lucide-react';
import * as authApi from '~/lib/api/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed) { setError('Email requis'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Format d\'email invalide'); return; }

    setIsLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(trimmed);
      setSubmitted(true);
    } catch {
      // Same message regardless of error to avoid revealing if email exists
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="flex flex-row items-center mb-10">
          <div
            className="w-10 h-10 rounded-xl mr-3 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #D5442F, #FF6B4A)' }}
          >
            <Zap size={20} color="#FFFFFF" fill="#FFFFFF" />
          </div>
          <div>
            <p className="text-txt font-display font-semibold text-lg leading-tight">Quiz Buzzer AI</p>
            <p className="text-accent text-[10px] font-bold uppercase tracking-[0.18em]">By Mouha_Dev</p>
          </div>
        </div>

        <div
          className="w-full max-w-md bg-surface rounded-3xl p-8 border border-line"
          style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}
        >
          {/* Back */}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-txt-60 text-sm mb-6 hover:text-txt transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Retour
          </button>

          {!submitted ? (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(0,211,151,0.12)', border: '1px solid rgba(0,211,151,0.3)' }}
              >
                <Mail size={28} color="#00D397" />
              </div>

              <h1 className="text-txt font-bold text-2xl mb-2">Mot de passe oublié ?</h1>
              <p className="text-txt-60 text-sm mb-7 leading-relaxed">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              <div className="mb-5">
                <label className="block text-txt-60 text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 flex items-center z-10">
                    <Mail size={20} color="rgba(255,255,255,0.4)" />
                  </div>
                  <input
                    type="email"
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-bg text-txt text-base outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-txt-25 border ${
                      error ? 'border-buzz' : 'border-line'
                    }`}
                    placeholder="votre@email.com"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-[#D5442F] text-sm mt-2 ml-2">{error}</p>}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-full py-4 rounded-2xl flex items-center justify-center font-bold text-lg text-white transition-opacity cursor-pointer ${
                  isLoading ? 'bg-surface-2 opacity-70' : 'bg-buzz shadow-[0_0_15px_rgba(213,68,47,0.5)]'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Envoi…
                  </div>
                ) : (
                  'Envoyer le lien'
                )}
              </button>
            </>
          ) : (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(0,211,151,0.12)', border: '1px solid rgba(0,211,151,0.3)' }}
              >
                <CheckCircle size={28} color="#00D397" />
              </div>
              <h1 className="text-txt font-bold text-2xl mb-3">Email envoyé !</h1>
              <p className="text-txt-60 text-sm leading-relaxed mb-7">
                Si un compte est associé à <span className="text-txt font-semibold">{email}</span>, vous recevrez un lien de réinitialisation dans quelques instants.
              </p>
              <p className="text-txt-40 text-xs leading-relaxed">
                Vérifiez également votre dossier spam. Le lien est valable <strong className="text-txt-60">1 heure</strong>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
