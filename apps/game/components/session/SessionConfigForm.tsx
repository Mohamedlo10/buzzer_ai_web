import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ArrowLeft, Zap } from 'lucide-react-native';
import { palette, font } from '~/lib/theme/tokens';
import { useSessionConfig } from '~/lib/hooks/useSessionConfig';
import { StepBar } from './StepBar';
import { StepGameMode } from './StepGameMode';
import { StepSettings } from './StepSettings';
import { StepTeams } from './StepTeams';
import type { SessionResponse } from '~/types/api';
import { StepSummary } from './StepSummary';

interface SessionConfigFormProps {
  onSuccess?: (sessionId: string, code: string, session?: SessionResponse) => void;
  onNavigate?: (route: string) => void;
  onClose?: () => void;
  onNavigateToLobby?: (code: string) => void;
  roomId?: string;
  initialMaxPlayers?: number;
}

export function SessionConfigForm({
  onSuccess,
  onNavigate,
  onClose,
  onNavigateToLobby,
  roomId,
  initialMaxPlayers,
}: SessionConfigFormProps) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 52 : 16);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 34 : 16);

  const {
    currentStep,
    totalSteps,
    getStepName,
    questionMode,
    sessionMode,
    setSessionMode,
    categorySelectionMode,
    setCategorySelectionMode,
    targetTotalQuestions,
    setTargetTotalQuestions,
    sessionCategories,
    setSessionCategories,
    globalQuestionSeconds,
    setGlobalQuestionSeconds,
    setAnswerTimeSeconds,
    answerChoicesCount,
    setAnswerChoicesCount,
    teams,
    setTeams,
    config,
    setConfig,
    error,
    isCreating,
    handleModeChange,
    handleNext,
    handleBack,
    handleQuickStart,
    handleCreate,
  } = useSessionConfig({
    onSuccess,
    onNavigate,
    onNavigateToLobby,
    roomId,
    initialMaxPlayers,
  });

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepGameMode
            handleQuickStart={handleQuickStart}
            isCreating={isCreating}
            sessionMode={sessionMode}
            setSessionMode={setSessionMode}
            questionMode={questionMode}
            handleModeChange={handleModeChange}
            config={config}
            setConfig={setConfig}
          />
        );
      case 1:
        return (
          <StepSettings
            sessionMode={sessionMode}
            questionMode={questionMode}
            categorySelectionMode={categorySelectionMode}
            setCategorySelectionMode={setCategorySelectionMode}
            targetTotalQuestions={targetTotalQuestions}
            setTargetTotalQuestions={setTargetTotalQuestions}
            sessionCategories={sessionCategories}
            setSessionCategories={setSessionCategories}
            globalQuestionSeconds={globalQuestionSeconds}
            setGlobalQuestionSeconds={setGlobalQuestionSeconds}
            setAnswerTimeSeconds={setAnswerTimeSeconds}
            answerChoicesCount={answerChoicesCount}
            setAnswerChoicesCount={setAnswerChoicesCount}
            config={config}
            setConfig={setConfig}
          />
        );
      case 2:
        return config.isTeamMode ? (
          <StepTeams teams={teams} setTeams={setTeams} />
        ) : (
          <StepSummary
            sessionMode={sessionMode}
            questionMode={questionMode}
            categorySelectionMode={categorySelectionMode}
            targetTotalQuestions={targetTotalQuestions}
            sessionCategories={sessionCategories}
            globalQuestionSeconds={globalQuestionSeconds}
            answerChoicesCount={answerChoicesCount}
            config={config}
            teams={teams}
            error={error}
          />
        );
      case 3:
        return (
          <StepSummary
            sessionMode={sessionMode}
            questionMode={questionMode}
            categorySelectionMode={categorySelectionMode}
            targetTotalQuestions={targetTotalQuestions}
            sessionCategories={sessionCategories}
            globalQuestionSeconds={globalQuestionSeconds}
            answerChoicesCount={answerChoicesCount}
            config={config}
            teams={teams}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  const getFooterButtonLabel = () => {
    if (isLastStep) return isCreating ? 'Création...' : 'Créer la session';
    if (currentStep === 0) return 'Régler les paramètres';
    if (currentStep === 1) return config.isTeamMode ? 'Configurer les équipes' : 'Voir le récapitulatif';
    if (currentStep === 2) return 'Voir le récapitulatif';
    return 'Suivant';
  };

  const footerDisabled = isLastStep
    ? isCreating || (config.isTeamMode && teams.length < 2)
    : false;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header sticky with explicit topInset to clear the notch / Dynamic Island */}
      <View
        style={{
          paddingTop: topInset,
          paddingBottom: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <TouchableOpacity
            onPress={isFirstStep ? onClose : handleBack}
            activeOpacity={0.7}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: palette.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            {isFirstStep
              ? <X size={18} color={palette.txt} />
              : <ArrowLeft size={18} color={palette.txt} />}
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 16,
                lineHeight: 22,
                color: palette.txt,
                paddingTop: 4,
                paddingBottom: 2,
              }}
            >
              Créer une session
            </Text>
            <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', fontSize: 13, color: palette.inkSoft }}>
              {getStepName()} · Étape {currentStep + 1}/{totalSteps}
            </Text>
          </View>

          {!isLastStep ? (
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 9999,
                backgroundColor: palette.primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: palette.primary,
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ color: palette.primaryInk, fontSize: 13, fontWeight: '700' }}>
                Suivant
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>

        <StepBar step={currentStep + 1} total={totalSteps} />
      </View>

      {/* Scrollable body */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 80, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Fixed footer */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: palette.bg,
          borderTopWidth: 1,
          borderTopColor: palette.line,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: bottomInset,
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center',
        }}
      >
        {currentStep > 0 && (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: palette.surface2,
              borderWidth: 1,
              borderColor: palette.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color={palette.txt} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={isLastStep ? handleCreate : handleNext}
          disabled={footerDisabled}
          activeOpacity={0.8}
          style={{
            flex: 1,
            borderRadius: 16,
            paddingVertical: 14,
            backgroundColor: footerDisabled ? palette.surface2 : palette.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: footerDisabled ? 0.5 : 1,
            shadowColor: palette.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: footerDisabled ? 0 : 0.3,
            shadowRadius: 12,
            elevation: footerDisabled ? 0 : 4,
          }}
        >
          {isLastStep && isCreating ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Création...</Text>
            </>
          ) : isLastStep ? (
            <>
              <Zap size={20} color="#FFFFFF" />
              <Text style={{ color: footerDisabled ? palette.inkSoft : '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                {getFooterButtonLabel()}
              </Text>
            </>
          ) : (
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
              {getFooterButtonLabel()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
