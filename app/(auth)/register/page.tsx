'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock, ArrowRight, Sparkles, Crown } from 'lucide-react';
import { useAuthStore } from '~/stores/useAuthStore';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (!username.trim()) {
      newErrors.username = "Nom d'utilisateur requis";
    } else if (username.trim().length < 3) {
      newErrors.username = 'Minimum 3 caractères';
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }

    if (password && password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (isLoading) return;
    if (!validate()) return;

    try {
      await register(username.trim(), null, password);
      window.location.replace('/dashboard');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Échec de l'inscription. Veuillez réessayer.";
      setErrors({ username: message });
    }
  }

  function clearFieldError(field: keyof typeof errors) {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(to bottom, #292349, #1a1633)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-8">
          {/* Outer Glow Ring */}
          <div
            className="flex items-center justify-center mb-5"
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              boxShadow: '0 0 25px 0 rgba(0, 211, 151, 0.4)',
            }}
          >
            {/* Gradient Ring */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                padding: 3,
                background: 'linear-gradient(135deg, #FFD700, #D5442F, #00D397)',
              }}
            >
              {/* Inner Circle */}
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden relative"
                style={{
                  borderRadius: 57,
                  backgroundColor: '#292349',
                }}
              >
                {/* Background subtle gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(0,211,151,0.125), rgba(213,68,47,0.125))',
                  }}
                />
                {/* Logo Image */}
                <img
                  src="icon.png"
                  alt="BuzzMaster Logo"
                  width={96}
                  height={96}
                  style={{ objectFit: 'contain', position: 'relative', zIndex: 1 }}
                />
                {/* Shine Effect */}
                <div
                  className="absolute"
                  style={{
                    top: 8,
                    right: 18,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#FFFFFF',
                    opacity: 0.3,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-white text-3xl font-bold mb-1"
            style={{
              textShadow: '0 0 12px #D5442F',
              letterSpacing: 1,
            }}
          >
            BuzzMaster
          </h1>

          {/* Subtitle Badge */}
          <div
            className="flex flex-row items-center mt-2 px-3 py-1 rounded-full"
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.125)',
              border: '1px solid rgba(255, 215, 0, 0.314)',
            }}
          >
            <Crown size={12} color="#FFD700" />
            <span className="text-[#FFD700] text-xs font-semibold ml-1.5 tracking-wide">
              MOUHA_DEV
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div
          className="w-full max-w-md bg-[#342D5B] rounded-3xl p-8 border border-[#3E3666]"
          style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}
        >
          <h2 className="text-white text-2xl font-bold mb-8 text-center">Créer un compte</h2>

          {/* Username Input */}
          <div className="mb-5">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Nom d&apos;utilisateur
            </label>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 flex items-center z-10">
                <User size={20} color="rgba(255,255,255,0.502)" />
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#292349] text-white text-base outline-none focus:ring-2 focus:ring-[#00D397]/50 placeholder:text-white/25"
                style={{
                  border: `1px solid ${errors.username ? '#D5442F' : '#3E3666'}`,
                }}
                placeholder="Choisissez un pseudo"
                value={username}
                autoComplete="username"
                autoCapitalize="none"
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearFieldError('username');
                }}
              />
            </div>
            {errors.username && (
              <p className="text-[#D5442F] text-sm mt-2 ml-2">{errors.username}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="mb-5">
            <label className="block text-white/80 text-sm font-medium mb-2">Mot de passe</label>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 flex items-center z-10">
                <Lock size={20} color="rgba(255,255,255,0.502)" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-12 pr-16 py-3.5 rounded-2xl bg-[#292349] text-white text-base outline-none focus:ring-2 focus:ring-[#00D397]/50 placeholder:text-white/25"
                style={{
                  border: `1px solid ${errors.password ? '#D5442F' : '#3E3666'}`,
                }}
                placeholder="Minimum 8 caractères"
                value={password}
                autoComplete="new-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-0 bottom-0 flex items-center justify-center"
              >
                {showPassword ? (
                  <EyeOff size={22} color="rgba(255,255,255,0.502)" />
                ) : (
                  <Eye size={22} color="rgba(255,255,255,0.502)" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[#D5442F] text-sm mt-2 ml-2">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="mb-8">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 flex items-center z-10">
                <Lock size={20} color="rgba(255,255,255,0.502)" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full pl-12 pr-16 py-3.5 rounded-2xl bg-[#292349] text-white text-base outline-none focus:ring-2 focus:ring-[#00D397]/50 placeholder:text-white/25"
                style={{
                  border: `1px solid ${errors.confirmPassword ? '#D5442F' : '#3E3666'}`,
                }}
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError('confirmPassword');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-0 bottom-0 flex items-center justify-center"
              >
                {showConfirmPassword ? (
                  <EyeOff size={22} color="rgba(255,255,255,0.502)" />
                ) : (
                  <Eye size={22} color="rgba(255,255,255,0.502)" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[#D5442F] text-sm mt-2 ml-2">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Register Button */}
          <button
            type="button"
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl flex items-center justify-center transition-opacity"
            style={{
              backgroundColor: isLoading ? '#3E3666' : '#D5442F',
              boxShadow: isLoading ? 'none' : '0 0 15px rgba(213,68,47,0.5)',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <div className="flex flex-row items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="text-white font-bold text-lg">Création...</span>
              </div>
            ) : (
              <div className="flex flex-row items-center gap-2">
                <span className="text-white font-bold text-lg">Créer mon compte</span>
                <ArrowRight size={20} color="#FFFFFF" />
              </div>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-row justify-center mt-6 mb-6 items-center">
          <span className="text-white/60 text-base">Déjà un compte ? </span>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex flex-row items-center ml-1"
          >
            <span className="text-[#00D397] text-base font-bold mr-1">Se connecter</span>
            <Sparkles size={16} color="#FFD700" />
          </button>
        </div>
      </div>
    </div>
  );
}
