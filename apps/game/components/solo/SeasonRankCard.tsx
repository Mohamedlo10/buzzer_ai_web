import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy } from 'lucide-react-native';

import { useLeaderboard } from '~/lib/query/hooks';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';

/** Nombre de joueurs du podium affichés sous ma position. */
const PODIUM_SIZE = 3;

/**
 * Ma position au classement de la saison, sur l'accueil.
 *
 * <p>Remplace la carte de position <b>globale</b>, qui reposait sur {@code global_rankings} —
 * un cumul à vie alimenté par le multijoueur et trié par la cote Glicko. Ce n'était pas la
 * bonne mesure à mettre en avant : la boucle de rétention du produit est saisonnière, un
 * nouveau joueur ne peut rien y gagner à court terme, et un joueur assidu n'y voit aucun
 * progrès d'un jour sur l'autre. Le classement de saison, lui, se recompose chaque mois et
 * répond à « où j'en suis en ce moment ».
 *
 * <p><b>Une seule requête.</b> {@code useLeaderboard('SEASON', 0)} rapporte à la fois le
 * libellé de la période, le podium, le nombre total de joueurs et <b>ma position même si je
 * suis hors de la première page</b>. Interroger séparément {@code /leaderboards/me} aurait
 * doublé le trafic pour une donnée déjà présente.
 *
 * <p>Le libellé de période vient du serveur : le reconstruire ici demanderait sa propre locale
 * et son propre calendrier, pour un résultat qui divergerait tôt ou tard de celui de l'écran
 * des classements.
 */
export function SeasonRankCard() {
  const router = useRouter();
  const { data, isLoading } = useLeaderboard('SEASON', 0);

  // Pendant le chargement, la carte ne s'affiche pas : un squelette pour une donnée
  // secondaire ferait sauter la mise en page de l'accueil pour rien.
  if (isLoading || !data) return null;

  const me = data.me;
  const podium = data.entries.slice(0, PODIUM_SIZE);

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 18,
        gap: 14,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      {/* En-tête : le libellé de saison remplace un titre figé. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
          <Trophy size={16} color={palette.gold} />
          <Text
            style={{ fontFamily: font.nativeFamily.display, fontSize: 16, color: palette.txt }}
            numberOfLines={1}
          >
            {data.periodLabel}
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/(tabs)/rankings')} activeOpacity={0.7}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: palette.primary }}>
            complet →
          </Text>
        </TouchableOpacity>
      </View>

      {me ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: palette.bg,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
            <View
              style={{
                backgroundColor: palette.gold + '22',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                minWidth: 42,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: palette.gold }}>
                #{me.rank}
              </Text>
            </View>
            <Avatar name={me.username} size={32} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }} numberOfLines={1}>
                {me.username}
              </Text>
              <Text style={{ fontSize: 11, color: palette.inkSoft }}>
                sur {data.totalPlayers.toLocaleString('fr-FR')} joueur
                {data.totalPlayers > 1 ? 's' : ''} · {me.challengesPlayed} défi
                {me.challengesPlayed > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontFamily: font.nativeFamily.display,
              fontSize: 12,
              lineHeight: 20,
              color: palette.txt,
              paddingTop: 2,
            }}
          >
            {me.points.toLocaleString('fr-FR')} pts
          </Text>
        </View>
      ) : (
        /* Pas encore classé : on le dit, plutôt que d'afficher « #— » ou un rang inventé.
           Le serveur répond 204 tant que le joueur n'a rien joué de la saison. */
        <View
          style={{
            backgroundColor: palette.bg,
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor: palette.line,
            gap: 3,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: palette.txt }}>
            Pas encore classé
          </Text>
          <Text style={{ fontSize: 12, color: palette.inkSoft }}>
            Relève le Défi du Jour pour entrer au classement de la saison.
          </Text>
        </View>
      )}

      {podium.length > 0 && (
        <View style={{ gap: 2, paddingTop: 4 }}>
          {podium.map((entry, i) => (
            <View
              key={entry.userId}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderBottomWidth: i < podium.length - 1 ? 1 : 0,
                borderBottomColor: palette.line,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 }}>
                <Text
                  style={{
                    fontFamily: font.nativeFamily.display,
                    fontSize: 10,
                    lineHeight: 18,
                    color: i === 0 ? palette.gold : palette.inkSoft,
                    minWidth: 28,
                    paddingTop: 2,
                  }}
                >
                  #{entry.rank}
                </Text>
                <Avatar name={entry.username} size={32} />
                <Text
                  style={{
                    // `isMe` est calculé serveur : le client n'a pas à comparer des pseudonymes,
                    // ce que faisait l'ancienne carte — et qui se trompait sur les homonymes.
                    fontSize: 13,
                    fontWeight: entry.isMe ? '800' : '600',
                    color: entry.isMe ? palette.primary : palette.txt,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {entry.username}
                  {entry.isMe ? ' (Moi)' : ''}
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: font.nativeFamily.display,
                  fontSize: 10,
                  lineHeight: 16,
                  color: palette.txt,
                  paddingTop: 2,
                }}
              >
                {entry.points.toLocaleString('fr-FR')} pts
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
