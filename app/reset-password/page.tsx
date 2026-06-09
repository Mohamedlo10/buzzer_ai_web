'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Zap } from 'lucide-react';
import * as authApi from '~/lib/api/auth';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string; general?: string }>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!newPassword) e.newPassword = 'Mot de passe requis';
    else if (newPassword.length < 8) e.newPassword = 'Minimum 8 caractères';
    if (newPassword && newPassword !== confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleReset() {
    if (!validate()) return;
    if (!token) { setErrors({ general: 'Token manquant. Utilisez le lien reçu par email.' }); return; }

    setIsLoading(true);
    setErrors({});
    try {
      await authApi.resetPassword(token, newPassword);
      setDone(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Lien invalide ou expiré. Recommencez la procédure.';
      setErrors({ general: msg });
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
          {!done ? (
            <>
              {/* Token missing */}
              {!token ? (
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'rgba(213,68,47,0.12)', border: '1px solid rgba(213,68,47,0.3)' }}
                  >
                    <XCircle size={28} color="#D5442F" />
                  </div>
                  <h1 className="text-txt font-bold text-2xl mb-3">Lien invalide</h1>
                  <p className="text-txt-60 text-sm mb-6">Utilisez le lien reçu par email pour réinitialiser votre mot de passe.</p>
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="text-accent text-sm font-semibold hover:underline cursor-pointer"
                  >
                    Nouvelle demande de réinitialisation
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(0,211,151,0.12)', border: '1px solid rgba(0,211,151,0.3)' }}
                  >
                    <Lock size={28} color="#00D397" />
                  </div>
                  <h1 className="text-txt font-bold text-2xl mb-2">Nouveau mot de passe</h1>
                  <p className="text-txt-60 text-sm mb-7 leading-relaxed">
                    Définissez votre nouveau mot de passe. Il doit faire au minimum 8 caractères.
                  </p>

                  {errors.general && (
                    <div
                      className="flex items-start gap-2 p-3 rounded-xl mb-5 text-sm"
                      style={{ background: 'rgba(213,68,47,0.1)', border: '1px solid rgba(213,68,47,0.3)' }}
                    >
                      <XCircle size={16} color="#D5442F" className="mt-0.5 shrink-0" />
                      <p className="text-[#D5442F]">{errors.general}</p>
                    </div>
                  )}

                  {/* New password */}
                  <div className="mb-5">
                    <label className="block text-txt-60 text-sm font-medium mb-2">Nouveau mot de passe</label>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 flex items-center z-10">
                        <Lock size={20} color="rgba(255,255,255,0.4)" />
                      </div>
                      <input
                        type={showNew ? 'text' : 'password'}
                        className={`w-full pl-12 pr-14 py-4 rounded-2xl bg-bg text-txt text-base outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-txt-25 border ${
                          errors.newPassword ? 'border-buzz' : 'border-line'
                        }`}
                        placeholder="Minimum 8 caractères"
                        value={newPassword}
                        autoComplete="new-password"
                        onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, newPassword: undefined })); }}
                        disabled={isLoading}
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-0 bottom-0 flex items-center text-txt-40 cursor-pointer">
                        {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.newPassword && <p className="text-[#D5442F] text-sm mt-2 ml-2">{errors.newPassword}</p>}
                  </div>

                  {/* Confirm password */}
                  <div className="mb-7">
                    <label className="block text-txt-60 text-sm font-medium mb-2">Confirmer le mot de passe</label>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 flex items-center z-10">
                        <Lock size={20} color="rgba(255,255,255,0.4)" />
                      </div>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        className={`w-full pl-12 pr-14 py-4 rounded-2xl bg-bg text-txt text-base outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-txt-25 border ${
                          errors.confirmPassword ? 'border-buzz' : 'border-line'
                        }`}
                        placeholder="Répétez votre mot de passe"
                        value={confirmPassword}
                        autoComplete="new-password"
                        onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                        disabled={isLoading}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-0 bottom-0 flex items-center text-txt-40 cursor-pointer">
                        {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-[#D5442F] text-sm mt-2 ml-2">{errors.confirmPassword}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
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
                        Réinitialisation…
                      </div>
                    ) : (
                      'Définir le nouveau mot de passe'
                    )}
                  </button>
                </>
              )}
            </>
          ) : (
            /* Success */
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(0,211,151,0.12)', border: '1px solid rgba(0,211,151,0.3)' }}
              >
                <CheckCircle size={28} color="#00D397" />
              </div>
              <h1 className="text-txt font-bold text-2xl mb-3">Mot de passe mis à jour !</h1>
              <p className="text-txt-60 text-sm leading-relaxed mb-7">
                Votre mot de passe a été réinitialisé avec succès. Toutes vos sessions ont été déconnectées.
              </p>
              <button
                type="button"
                onClick={() => router.replace('/login')}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-buzz shadow-[0_0_15px_rgba(213,68,47,0.5)] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Se connecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
