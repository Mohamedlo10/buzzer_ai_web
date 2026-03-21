'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Eye, EyeOff, User, Lock, ArrowRight, Sparkles, Crown } from 'lucide-react';
import { useAuthStore } from '~/stores/useAuthStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  // Refs to read DOM values directly — handles browser autofill which bypasses onChange
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  function validate(u: string, p: string): boolean {
    const newErrors: typeof errors = {};
    if (!u.trim()) {
      newErrors.username = "Nom d'utilisateur requis";
    }
    if (!p) {
      newErrors.password = 'Mot de passe requis';
    } else if (p.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (isLoading) return;

    // Read from DOM to capture autofilled values that didn't trigger onChange
    const u = usernameRef.current?.value ?? username;
    const p = passwordRef.current?.value ?? password;

    if (!validate(u, p)) return;

    try {
      await login(u.trim(), p);
      window.location.replace('/dashboard');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? 'Échec de la connexion. Veuillez réessayer.';
      setErrors({ password: message });
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(to bottom, #292349, #1a1633)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-10">
          {/* Outer Glow Ring */}
          <div
            className="flex items-center justify-center mb-6"
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              boxShadow: '0 0 30px 0 rgba(0, 211, 151, 0.4)',
            }}
          >
            {/* Gradient Ring */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 70,
                padding: 4,
                background: 'linear-gradient(135deg, #FFD700, #D5442F, #00D397)',
              }}
            >
              {/* Inner Circle */}
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden relative"
                style={{
                  borderRadius: 66,
                  backgroundColor: '#292349',
                }}
              >
                {/* Background subtle gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,211,151,0.125), rgba(213,68,47,0.125))',
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
                    top: 10,
                    right: 20,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
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
              textShadow: '0 0 15px #D5442F',
              letterSpacing: 1,
            }}
          >
            Quiz Buzzer - AI
          </h1>

          {/* Subtitle Badge */}
          <div
            className="flex flex-row items-center mt-2 px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.125)',
              border: '1px solid rgba(255, 215, 0, 0.314)',
            }}
          >
            <Crown size={14} color="#FFD700" />
            <span className="text-[#FFD700] text-sm font-semibold ml-2 tracking-wide">
              MOUHA_DEV
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div
          className="w-full max-w-md bg-[#342D5B] rounded-3xl p-8 border border-[#3E3666]"
          style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}
        >
          <h2 className="text-white text-2xl font-bold mb-8 text-center">Connexion</h2>

          {/* Username Input */}
          <div className="mb-6">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Nom d&apos;utilisateur
            </label>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 flex items-center z-10">
                <User size={20} color="rgba(255,255,255,0.502)" />
              </div>
              <input
                ref={usernameRef}
                type="text"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#292349] text-white text-lg outline-none focus:ring-2 focus:ring-[#00D397]/50 placeholder:text-white/25"
                style={{
                  border: `1px solid ${errors.username ? '#D5442F' : '#3E3666'}`,
                }}
                placeholder="Entrez votre pseudo"
                value={username}
                autoComplete="username"
                autoCapitalize="none"
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                disabled={isLoading}
              />
            </div>
            {errors.username && (
              <p className="text-[#D5442F] text-sm mt-2 ml-2">{errors.username}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="mb-8">
            <label className="block text-white/80 text-sm font-medium mb-2">Mot de passe</label>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 flex items-center z-10">
                <Lock size={20} color="rgba(255,255,255,0.502)" />
              </div>
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-12 pr-16 py-4 rounded-2xl bg-[#292349] text-white text-lg outline-none focus:ring-2 focus:ring-[#00D397]/50 placeholder:text-white/25"
                style={{
                  border: `1px solid ${errors.password ? '#D5442F' : '#3E3666'}`,
                }}
                placeholder="Entrez votre mot de passe"
                value={password}
                autoComplete="current-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                disabled={isLoading}
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

          {/* Login Button */}
          <button
            type="button"
            onClick={handleLogin}
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
                <span className="text-white font-bold text-lg">Connexion...</span>
              </div>
            ) : (
              <div className="flex flex-row items-center gap-2">
                <span className="text-white font-bold text-lg">Se connecter</span>
                <ArrowRight size={20} color="#FFFFFF" />
              </div>
            )}
          </button>
          <div  className="mt-4 flex w-full sm:flex-row flex-col items-center justify-center">
          <span className="text-white/60 text-base">Pas encore de compte ? </span>
          <button
            type="button"
            onClick={() => router.push('register')}
            className="flex flex-row items-center ml-1"
          >
            <span className="text-[#00D397] text-base font-bold mr-1">Créer un compte</span>
            <Sparkles size={16} color="#FFD700" />
          </button>          
          </div>
          
        </div>

        {/* Footer */}
    
      </div>
    </div>
  );
}
