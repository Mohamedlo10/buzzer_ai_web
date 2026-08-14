import { TouchableOpacity, View, Text, TextInput } from 'react-native';
import { Palette, X, Plus, AlertCircle } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
import type { TeamRequest } from '~/types/api';
import {
  TEAM_COLOR_TOKENS,
  teamColor,
  teamColorByIndex,
  toTeamColorToken,
} from '~/lib/game/teamColors';

export function TeamEditor({
  teams,
  onChange,
}: {
  teams: TeamRequest[];
  onChange: (teams: TeamRequest[]) => void;
}) {
  const addTeam = () => {
    if (teams.length >= TEAM_COLOR_TOKENS.length) return;
    onChange([
      ...teams,
      { name: `Équipe ${teams.length + 1}`, color: teamColorByIndex(teams.length) },
    ]);
  };

  const removeTeam = (index: number) => {
    if (teams.length <= 2) return;
    onChange(teams.filter((_, i) => i !== index));
  };

  const updateName = (index: number, name: string) => {
    onChange(teams.map((t, i) => (i === index ? { ...t, name } : t)));
  };

  const cycleColor = (index: number) => {
    const current = toTeamColorToken(teams[index].color);
    const nextColor = teamColorByIndex(TEAM_COLOR_TOKENS.indexOf(current) + 1);
    onChange(teams.map((t, i) => (i === index ? { ...t, color: nextColor } : t)));
  };

  return (
    <View style={{ gap: 12 }}>
      {teams.map((team, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 11,
            backgroundColor: palette.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 12,
          }}
        >
          {/* Color selector */}
          <TouchableOpacity
            onPress={() => cycleColor(index)}
            activeOpacity={0.8}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: teamColor(team.color),
            }}
          >
            <Palette size={17} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Name input */}
          <TextInput
            value={team.name}
            onChangeText={(text) => updateName(index, text)}
            placeholder={`Équipe ${index + 1}`}
            maxLength={20}
            placeholderTextColor={palette.inkSoft}
            style={{
              flex: 1,
              backgroundColor: palette.bg,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              color: palette.txt,
              borderWidth: 1,
              borderColor: palette.line,
              fontSize: 15,
            }}
          />

          {/* Delete */}
          <TouchableOpacity
            onPress={() => removeTeam(index)}
            disabled={teams.length <= 2}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: teams.length <= 2 ? palette.surface2 : palette.bad + '26',
              opacity: teams.length <= 2 ? 0.5 : 1,
            }}
          >
            <X size={16} color={teams.length <= 2 ? palette.inkSoft : palette.bad} />
          </TouchableOpacity>
        </View>
      ))}

      {teams.length < 8 && (
        <TouchableOpacity
          onPress={addTeam}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: palette.line,
            gap: 8,
          }}
        >
          <Plus size={16} color={palette.inkSoft} />
          <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Ajouter une équipe</Text>
        </TouchableOpacity>
      )}

      {teams.length < 2 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: palette.bad + '48',
            backgroundColor: palette.bad + '1A',
          }}
        >
          <AlertCircle size={14} color={palette.bad} />
          <Text style={{ color: palette.bad, fontSize: 12, fontWeight: '600' }}>
            Minimum 2 équipes requises
          </Text>
        </View>
      )}
    </View>
  );
}
