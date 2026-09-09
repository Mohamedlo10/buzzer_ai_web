import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';

import { palette, font } from '~/lib/theme/tokens';
import { PatternZigzag } from './PatternZigzag';
import type { ActiveRoomSummary } from './QuizOfTheDayCard';

interface ActiveSessionCardProps {
  activeRoom: ActiveRoomSummary | null;
}

/**
 * Raccourci vers la partie en cours dans un salon.
 *
 * <p>Extraite de {@code QuizOfTheDayCard}, où elle occupait une branche {@code isLive} qui
 * <b>remplaçait</b> le Défi du Jour. C'était le défaut : un joueur ayant une partie en cours ne
 * voyait plus du tout le défi, alors que les deux ne s'excluent pas — l'un est une invitation à
 * rejoindre des amis, l'autre le rendez-vous quotidien. Deux cartes distinctes les rendent
 * visibles ensemble, le défi en premier.
 *
 * <p>Se masque d'elle-même quand aucune partie n'est en cours, plutôt que d'occuper la place
 * avec un état vide : c'est la même règle que pour les emplacements publicitaires.
 */
export function ActiveSessionCard({ activeRoom }: ActiveSessionCardProps) {
  const router = useRouter();

  if (!activeRoom) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/room/${activeRoom.id}` as any)}
      activeOpacity={0.9}
      style={{
        backgroundColor: palette.primary,
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
          Partie active
        </Text>

        <Text
          style={{
            fontFamily: font.nativeFamily.display,
            fontSize: 22,
            lineHeight: 34,
            color: '#FFFFFF',
            paddingTop: 4,
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {activeRoom.name}
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
          numberOfLines={1}
        >
          Hôte : {activeRoom.ownerName}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11.5, color: '#FFFFFF', opacity: 0.85, fontWeight: '500' }}>
            {activeRoom.memberCount} membre{activeRoom.memberCount > 1 ? 's' : ''} · En direct
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
            <Text style={{ color: palette.txt, fontSize: 12, fontWeight: '700' }}>Rejoindre</Text>
            <ArrowRight size={14} color={palette.txt} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
