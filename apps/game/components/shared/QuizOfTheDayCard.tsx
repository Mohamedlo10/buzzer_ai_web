import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import { PatternZigzag } from './PatternZigzag';

export interface ActiveRoomSummary {
  id: string | number;
  name: string;
  ownerName: string;
  memberCount: number;
}

interface QuizOfTheDayCardProps {
  activeRoom?: ActiveRoomSummary | null;
  title?: string;
  subtitle?: string;
}

export function QuizOfTheDayCard({
  activeRoom = null,
  title = 'Lutte sénégalaise',
  subtitle = "les années d'or",
}: QuizOfTheDayCardProps) {
  const router = useRouter();
  const isLive = !!activeRoom;

  return (
    <TouchableOpacity
      onPress={() => {
        if (isLive) {
          router.push(`/room/${activeRoom!.id}` as any);
        } else {
          router.push('/solo/career/new?theme=Lutte' as any);
        }
      }}
      activeOpacity={0.9}
      style={{
        backgroundColor: isLive ? palette.primary : palette.indigo,
        borderRadius: 24,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      <PatternZigzag color="#FFFFFF" opacity={0.18} size={20} />

      <View style={{ position: 'relative', zIndex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: '#FFFFFF',
            opacity: 0.8,
            fontWeight: '700',
            marginBottom: 6,
          }}
        >
          {isLive ? 'Partie active' : 'Quiz du jour'}
        </Text>

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 22,
            lineHeight: 30,
            color: '#FFFFFF',
            paddingTop: 4,
            marginBottom: 2,
          }}
        >
          {isLive ? activeRoom!.name : title}
        </Text>

        <Text
          style={{
            fontFamily: font.nativeFamily.serif,
            fontStyle: 'italic',
            fontSize: 16,
            color: '#FFFFFF',
            opacity: 0.9,
            marginBottom: 14,
          }}
        >
          {isLive ? `Hôte: ${activeRoom!.ownerName}` : subtitle}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11.5, color: '#FFFFFF', opacity: 0.85, fontWeight: '500' }}>
            {isLive ? `${activeRoom!.memberCount} membres · En direct` : '10 questions · 4 min · +1 200 pts'}
          </Text>

          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 9999,
              backgroundColor: '#FFFFFF',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text style={{ color: palette.txt, fontSize: 12, fontWeight: '700' }}>
              {isLive ? 'Rejoindre' : 'Jouer'}
            </Text>
            <ArrowRight size={14} color={palette.txt} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
