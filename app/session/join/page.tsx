'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, FolderOpen } from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';

export default function JoinSessionPage() {
  const router = useRouter();

  return (
    <SafeScreen>
      {/* Header */}
      <div className="bg-bg pt-6 pb-4 px-4 border-b border-line sticky top-0 z-10">
        <div className="flex flex-row items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mr-3 hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <p className="text-txt font-bold text-xl">Rejoindre</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-[60vh]">
        <div className="bg-surface rounded-3xl border border-line p-8 w-full max-w-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#00D39720] flex items-center justify-center mb-4">
            <FolderOpen size={28} color="#00D397" />
          </div>
          <p className="text-txt font-bold text-lg mb-2">Nouveau fonctionnement</p>
          <p className="text-txt-60 text-center text-sm px-6 mb-6">
            Les sessions se créent maintenant dans les salles. Rejoignez une salle pour participer aux parties.
          </p>
          <button
            onClick={() => router.replace('/rooms')}
            className="bg-[#00D397] px-6 py-3 rounded-xl hover:bg-[#00B377] transition-colors"
          >
            <span className="text-btn-fg font-bold">Voir mes salles</span>
          </button>
        </div>
      </div>
    </SafeScreen>
  );
}
