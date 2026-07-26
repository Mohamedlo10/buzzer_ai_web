import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-energy/15 flex items-center justify-center mb-6">
        <Wrench size={44} color="var(--gold)" />
      </div>

      <h1 className="text-txt font-bold text-3xl mb-3">Maintenance en cours</h1>
      <p className="text-txt-60 text-base max-w-sm leading-relaxed">
        Xalaat est temporairement indisponible pour des opérations de maintenance.
        Nous serons de retour très bientôt !
      </p>

      <div className="mt-10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gold-bright animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-gold-bright animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-gold-bright animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
