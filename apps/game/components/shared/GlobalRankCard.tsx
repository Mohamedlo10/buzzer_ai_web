import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, font } from '~/lib/theme/tokens';
import { Trophy } from 'lucide-react-native';

interface GlobalRankCardProps {
  rank: number;
  caption?: string;
}

export function GlobalRankCard({ rank, caption = 'Top 1% des joueurs' }: GlobalRankCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/rankings')}
      activeOpacity={0.85}
      style={{
        backgroundColor: palette.txt,
        borderRadius: 24,
        paddingVertical: 22,
        paddingHorizontal: 20,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Concentric Rank Badges */}
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          borderWidth: 3,
          borderColor: 'rgba(232, 166, 48, 0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            borderWidth: 3,
            borderColor: palette.gold,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(232, 166, 48, 0.1)',
          }}
        >
          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 18,
              color: palette.gold,
              fontWeight: '700',
            }}
          >
            #{rank}
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontSize: 10,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: palette.bg,
          opacity: 0.6,
          fontWeight: '700',
          marginBottom: 3,
        }}
      >
        Classement mondial
      </Text>

      <Text
        style={{
          fontFamily: font.nativeFamily.serif,
          fontStyle: 'italic',
          fontSize: 15,
          color: palette.bg,
          opacity: 0.9,
        }}
      >
        {caption}
      </Text>
    </TouchableOpacity>
  );
}
