import { useState } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { ImageOff } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';

interface IdentificationQuestionDisplayProps {
  imageUrl: string;
  category: string;
  text?: string;
}

export function IdentificationQuestionDisplay({
  imageUrl,
  category,
  text,
}: IdentificationQuestionDisplayProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ color: palette.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {category} — Identification
        </Text>
        {text && <Text style={{ color: palette.txt, fontSize: 16, fontWeight: '500', marginTop: 4 }}>{text}</Text>}
      </View>

      <View style={{ width: '100%', minHeight: 200, position: 'relative' }}>
        {!loaded && !error && (
          <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
            <ActivityIndicator size="small" color={palette.primary} />
          </View>
        )}

        {error ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, backgroundColor: palette.bg, gap: 8 }}>
            <ImageOff size={36} color={palette.inkSoft} />
            <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Image indisponible</Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: 224, opacity: loaded ? 1 : 0 }}
            resizeMode="cover"
            onLoad={() => setLoaded(true)}
            onError={() => {
              setError(true);
              setLoaded(true);
            }}
          />
        )}
      </View>
    </View>
  );
}
