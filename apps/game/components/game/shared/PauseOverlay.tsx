import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { palette, font } from '~/lib/theme/tokens';

interface PauseOverlayProps {
  isPaused: boolean;
  isManager: boolean;
  isPauseToggling: boolean;
  onResume: () => void;
}

export function PauseOverlay({ isPaused, isManager, isPauseToggling, onResume }: PauseOverlayProps) {
  if (!isPaused) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ backgroundColor: palette.surface, paddingHorizontal: 32, paddingVertical: 32, borderRadius: 24, borderWidth: 2, borderColor: palette.warn, alignItems: 'center', width: '100%', maxWidth: 360 }}>
        <Text style={{ fontFamily: font.nativeFamily.display, color: palette.warn, fontSize: 32, textAlign: 'center', letterSpacing: 2, paddingTop: 4 }}>PAUSE</Text>
        <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, textAlign: 'center', marginTop: 12, fontSize: 16 }}>Le jeu est en pause</Text>

        {isManager && (
          <TouchableOpacity
            onPress={onResume}
            disabled={isPauseToggling}
            activeOpacity={0.8}
            style={{ marginTop: 32, paddingHorizontal: 32, paddingVertical: 16, backgroundColor: palette.primary, borderRadius: 16, opacity: isPauseToggling ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            {isPauseToggling && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text style={{ fontFamily: font.nativeFamily.display, color: '#FFFFFF', fontSize: 18, paddingTop: 2 }}>Reprendre</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
