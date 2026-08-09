import { useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Zap } from 'lucide-react-native';
import { palette, inkAlpha } from '~/lib/theme/tokens';

export interface BuzzerButtonProps {
  onBuzz: () => void;
  disabled?: boolean;
  hasBuzzed?: boolean;
  queuePosition?: number | null;
  teamBuzzed?: boolean;
}

export function BuzzerButton({
  onBuzz,
  disabled = false,
  hasBuzzed = false,
  queuePosition = null,
  teamBuzzed = false,
}: BuzzerButtonProps) {
  const isActive = !disabled && !hasBuzzed && queuePosition === null;

  useEffect(() => {
    if (!isActive || Platform.OS !== 'web') return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      onBuzz();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, onBuzz]);

  const handleClick = () => {
    if (!isActive) return;
    onBuzz();
  };

  const size = 180;

  // ── Waiting in queue state ──
  if (queuePosition !== null) {
    return (
      <View className="flex-col items-center py-6">
        <View
          style={{ width: size, height: size }}
          className="flex-col items-center justify-center rounded-full border-4 border-line opacity-60 bg-surface"
        >
          <Zap size={36} color={inkAlpha.muted} strokeWidth={2} />
          <Text className="text-txt-60 font-bold text-2xl mt-1 tracking-wide">
            #{queuePosition}
          </Text>
        </View>
        <Text className="text-txt-40 mt-4 text-sm font-medium">
          En file d&apos;attente
        </Text>
      </View>
    );
  }

  // ── Disabled state ──
  if (disabled || hasBuzzed) {
    return (
      <View className="flex-col items-center py-6">
        <View
          style={{ width: size, height: size }}
          className="relative flex-col items-center justify-center rounded-full border border-line opacity-60 bg-surface"
        >
          {teamBuzzed ? (
            <Text className="text-4xl mb-1">🔒</Text>
          ) : (
            <Zap size={44} color={inkAlpha.muted} strokeWidth={2} />
          )}
          <Text className="text-txt-40 font-bold text-lg mt-2 tracking-wide">
            {teamBuzzed ? 'VERROUILLÉ' : 'BUZZ'}
          </Text>
        </View>
        <Text className="text-txt-40 mt-3 text-xs font-semibold">
          {teamBuzzed ? 'Votre équipe a déjà buzzé' : 'Buzzer désactivé'}
        </Text>
      </View>
    );
  }

  // ── Active Xalaat Buzzer ──
  return (
    <View className="flex-col items-center py-4">
      <View
        style={{
          width: size + 40,
          height: size + 40,
        }}
        className="relative flex-col items-center justify-center"
      >
        {/* Concentric Outer Ring */}
        <View
          style={{
            position: 'absolute',
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            backgroundColor: palette.primary,
            opacity: 0.2,
          }}
        />

        {/* Main Touch-Friendly Buzzer Button */}
        <TouchableOpacity
          onPress={handleClick}
          activeOpacity={0.7}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: palette.primary,
            shadowColor: palette.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 15,
            elevation: 10,
          }}
          className="flex-col items-center justify-center"
        >
          <Zap size={44} color={palette.primaryInk} strokeWidth={2.5} />
          <Text className="text-primaryInk font-bold text-xl tracking-wider mt-1">
            BUZZER
          </Text>
          {Platform.OS === 'web' ? (
            <View className="mt-1 px-2 py-0.5 rounded bg-black/20">
              <Text className="text-primaryInk text-[10px] font-semibold tracking-widest">
                ESPACE
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <Text className="text-txt-60 mt-3 text-xs font-semibold">
        {Platform.OS === 'web'
          ? 'Appuyer sur le bouton ou la touche ESPACE'
          : 'Touchez le bouton pour buzzer !'}
      </Text>
    </View>
  );
}
