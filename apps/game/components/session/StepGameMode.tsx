import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Zap, User, Bot, Sparkles, PenLine, Users } from 'lucide-react-native';
import { palette } from '~/lib/theme/tokens';
import type { QuestionMode, SessionMode, CreateSessionRequest } from '~/types/api';
import { ModeCard } from './ModeCard';
import { ToggleRow } from './ToggleRow';

export interface StepGameModeProps {
  handleQuickStart: () => void;
  isCreating: boolean;
  sessionMode: SessionMode;
  setSessionMode: (mode: SessionMode) => void;
  questionMode: QuestionMode;
  handleModeChange: (mode: QuestionMode) => void;
  config: CreateSessionRequest;
  setConfig: React.Dispatch<React.SetStateAction<CreateSessionRequest>>;
}

export function StepGameMode({
  handleQuickStart,
  isCreating,
  sessionMode,
  setSessionMode,
  questionMode,
  handleModeChange,
  config,
  setConfig,
}: StepGameModeProps) {
  return (
    <View style={{ gap: 20 }}>
      {/* Quick Launch Banner */}
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.primary + '50',
          backgroundColor: palette.surface,
          padding: 16,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: palette.primary + '33',
            }}
          >
            <Zap size={20} color={palette.primary} />
          </View>
          <View>
            <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 14 }}>
              Lancement Rapide
            </Text>
            <Text style={{ color: palette.inkSoft, fontSize: 11 }}>
              IA · 10s buzz · 5 questions
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleQuickStart}
          disabled={isCreating}
          activeOpacity={0.8}
          style={{
            backgroundColor: palette.primary,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            opacity: isCreating ? 0.7 : 1,
          }}
        >
          {isCreating ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Création...</Text>
            </>
          ) : (
            <>
              <Zap size={16} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                Lancer directement ⚡
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: palette.line }} />
        <Text
          style={{
            color: palette.inkSoft,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}
        >
          Ou sur-mesure
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: palette.line }} />
      </View>

      {/* Modération */}
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
          Modération
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ModeCard
            label="Sprint ⚡"
            sublabel="Tous répondent en même temps"
            icon={<Bot size={26} color={sessionMode === 'WITHOUT_MODERATOR' ? palette.violet : palette.inkSoft} />}
            active={sessionMode === 'WITHOUT_MODERATOR'}
            accentHex={palette.violet}
            onClick={() => {
              setSessionMode('WITHOUT_MODERATOR');
              setConfig((c) => ({ ...c, isTeamMode: false, debtAmount: 1 }));
            }}
          />
          <ModeCard
            label="Avec modérateur"
            sublabel="L'hôte valide les réponses"
            icon={<User size={26} color={sessionMode === 'WITH_MODERATOR' ? palette.primary : palette.inkSoft} />}
            active={sessionMode === 'WITH_MODERATOR'}
            accentHex={palette.primary}
            onClick={() => {
              setSessionMode('WITH_MODERATOR');
              setConfig((c) => ({ ...c, debtAmount: 5 }));
            }}
          />

        </View>
      </View>

      {/* Source des questions */}
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
          Source des questions
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ModeCard
            label="IA"
            sublabel="Générées par l'IA"
            icon={<Sparkles size={26} color={questionMode === 'AI' ? palette.primary : palette.inkSoft} />}
            active={questionMode === 'AI'}
            accentHex={palette.primary}
            onClick={() => handleModeChange('AI')}
          />
          <ModeCard
            label="Manuel"
            sublabel="Saisies dans le lobby"
            icon={<PenLine size={26} color={questionMode === 'MANUAL' ? palette.gold : palette.inkSoft} />}
            active={questionMode === 'MANUAL'}
            accentHex={palette.gold}
            onClick={() => handleModeChange('MANUAL')}
          />
        </View>
      </View>

      {/* Encart Manuel */}
      {questionMode === 'MANUAL' && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.gold + '50',
            backgroundColor: palette.gold + '1A',
          }}
        >
          <PenLine size={18} color={palette.gold} style={{ marginTop: 2 }} />
          <Text style={{ color: palette.txt, fontSize: 12, lineHeight: 18, flex: 1 }}>
            Vous pourrez saisir vos questions dans le lobby avant de démarrer la session.
          </Text>
        </View>
      )}

      {/* Mode équipes (uniquement si modéré) */}
      {sessionMode !== 'WITHOUT_MODERATOR' && (
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
            Format
          </Text>
          <ToggleRow
            label="Mode équipes"
            sub="Les points sont partagés entre coéquipiers"
            icon={<Users size={16} color={palette.indigo} />}
            checked={config.isTeamMode ?? false}
            onChange={(v) => setConfig((c) => ({ ...c, isTeamMode: v }))}
            accentHex={palette.indigo}
          />
        </View>
      )}

      {/* Encart Sprint */}
      {sessionMode === 'WITHOUT_MODERATOR' && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: palette.violet + '50',
            backgroundColor: palette.violet + '1A',
          }}
        >
          <Bot size={18} color={palette.violet} style={{ marginTop: 2 }} />
          <Text style={{ color: palette.txt, fontSize: 12, lineHeight: 18, flex: 1 }}>
            Questions affichées entièrement · réponses automatisées · buzz immédiat.
          </Text>
        </View>
      )}
    </View>
  );
}
