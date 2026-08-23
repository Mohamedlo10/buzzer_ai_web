import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, User, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@xalaat/core';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
      const user = useAuthStore.getState().user;
      if (user && user.role === 'SUPER_ADMIN') {
        toast.success('Connexion réussie');
        navigate('/', { replace: true });
      } else {
        setError("Ce compte n'a pas les droits d'administration (SUPER_ADMIN requis).");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-3xl border border-line p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gold/15 flex items-center justify-center mx-auto mb-3">
            <Crown size={28} color="var(--gold)" />
          </div>
          <h1 className="text-txt font-bold text-2xl font-display tracking-tight">Xalaat Admin</h1>
          <p className="text-txt-60 text-sm">Console d'administration de la plateforme</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-txt font-semibold text-xs block mb-1.5">Identifiant</label>
            <div className="flex items-center bg-bg rounded-xl border border-line px-3.5 focus-within:border-host">
              <User size={16} color="var(--txt-40)" className="shrink-0" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin username..."
                autoCapitalize="none"
                required
                className="w-full bg-transparent text-txt text-sm py-3 px-2.5 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-txt font-semibold text-xs block mb-1.5">Mot de passe</label>
            <div className="flex items-center bg-bg rounded-xl border border-line px-3.5 focus-within:border-host">
              <Lock size={16} color="var(--txt-40)" className="shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-transparent text-txt text-sm py-3 px-2.5 outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-bad/10 border border-bad/30 rounded-xl p-3 flex items-center gap-2 text-bad text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password}
            className="w-full py-3.5 rounded-xl bg-host text-primary-ink font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
