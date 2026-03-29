import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#292349] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-[#FFD70020] flex items-center justify-center mb-6">
        <Wrench size={44} color="#FFD700" />
      </div>

      <h1 className="text-white font-bold text-3xl mb-3">Maintenance en cours</h1>
      <p className="text-white/60 text-base max-w-sm leading-relaxed">
        Quiz By Mouha Dev est temporairement indisponible pour des opérations de maintenance.
        Nous serons de retour très bientôt !
      </p>

      <div className="mt-10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#FFD700] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#FFD700] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#FFD700] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
