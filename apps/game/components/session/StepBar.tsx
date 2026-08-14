import { View } from 'react-native';
import { palette } from '~/lib/theme/tokens';

/** Barre de progression multi-étapes. */
export function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, width: '100%' }}>
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < step;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 9999,
              backgroundColor: isFilled ? palette.primary : palette.surface2,
              opacity: isFilled ? 1 : 0.5,
            }}
          />
        );
      })}
    </View>
  );
}
