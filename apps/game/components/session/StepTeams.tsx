import { View, Text } from 'react-native';
import { Users } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
import type { TeamRequest } from '~/types/api';
import { TeamEditor } from './TeamEditor';

export interface StepTeamsProps {
  teams: TeamRequest[];
  setTeams: (teams: TeamRequest[]) => void;
}

export function StepTeams({ teams, setTeams }: StepTeamsProps) {
  return (
    <View style={{ gap: 20 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.indigo + '50',
          backgroundColor: palette.indigo + '1A',
        }}
      >
        <Users size={18} color={palette.indigo} style={{ marginTop: 2 }} />
        <Text style={{ color: palette.txt, fontSize: 12, lineHeight: 18, flex: 1 }}>
          Minimum 2 équipes · maximum 8. Touchez la pastille de couleur pour la changer.
        </Text>
      </View>

      <View>
        <Text
          style={{
            color: palette.inkSoft,
            fontSize: 9.5,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Équipes
        </Text>
        <TeamEditor teams={teams} onChange={setTeams} />
      </View>
    </View>
  );
}
