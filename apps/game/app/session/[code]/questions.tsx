import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  PenLine,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Download,
  FileUp,
} from 'lucide-react-native';

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import * as sessionsApi from '~/lib/api/sessions';
import type { ManualQuestion, SessionResponse } from '~/types/api';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { palette } from '~/lib/theme/tokens';
import { FadeInUpView } from '~/components/anim';

const EMPTY_QUESTION: ManualQuestion = { text: '', answer: '', explanation: '' };

function QuestionItem({
  question,
  index,
  onUpdate,
  onRemove,
  isWithoutModerator,
}: {
  question: ManualQuestion;
  index: number;
  onUpdate: (index: number, patch: Partial<ManualQuestion>) => void;
  onRemove: (index: number) => void;
  isWithoutModerator: boolean;
}) {
  const [showExplanation, setShowExplanation] = useState(
    !!question.explanation && question.explanation.length > 0,
  );

  return (
    <View style={{ marginBottom: 14 }}>
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: palette.line,
          overflow: 'hidden',
        }}
      >
        {/* Card Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: palette.line,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: palette.gold + '26',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ color: palette.gold, fontWeight: '700', fontSize: 12 }}>
              {index + 1}
            </Text>
          </View>
          <Text style={{ color: palette.inkSoft, fontSize: 14, fontWeight: '600', flex: 1 }}>
            Question {index + 1}
          </Text>
          <TouchableOpacity
            onPress={() => onRemove(index)}
            activeOpacity={0.7}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: palette.bad + '26',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={15} color={palette.bad} />
          </TouchableOpacity>
        </View>

        {/* Card Body */}
        <View style={{ padding: 16, gap: 12 }}>
          {/* Question text */}
          <View>
            <Text style={{ color: palette.inkSoft, fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Énoncé *
            </Text>
            <TextInput
              value={question.text}
              onChangeText={(text) => onUpdate(index, { text })}
              placeholder="Ex: Quelle est la capitale du Sénégal ?"
              placeholderTextColor={palette.inkSoft}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: palette.bg,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: palette.txt,
                borderWidth: 1,
                borderColor: palette.line,
                fontSize: 14,
                minHeight: 64,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Answer */}
          <View>
            <Text style={{ color: palette.inkSoft, fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Réponse attendue *
            </Text>
            <TextInput
              value={question.answer}
              onChangeText={(answer) => onUpdate(index, { answer })}
              placeholder="Ex: Dakar"
              placeholderTextColor={palette.inkSoft}
              style={{
                backgroundColor: palette.bg,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: palette.txt,
                borderWidth: 1,
                borderColor: palette.line,
                fontSize: 14,
              }}
            />
          </View>

          {/* Explanation toggle */}
          <TouchableOpacity
            onPress={() => setShowExplanation((s) => !s)}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}
          >
            {showExplanation ? (
              <ChevronUp size={14} color={palette.inkSoft} />
            ) : (
              <ChevronDown size={14} color={palette.inkSoft} />
            )}
            <Text style={{ color: palette.inkSoft, fontSize: 12, marginLeft: 4, fontWeight: '600' }}>
              {showExplanation ? "Masquer l'explication" : 'Ajouter une explication (optionnel)'}
            </Text>
          </TouchableOpacity>

          {showExplanation && (
            <TextInput
              value={question.explanation ?? ''}
              onChangeText={(explanation) => onUpdate(index, { explanation })}
              placeholder="Explication complémentaire (optionnel)"
              placeholderTextColor={palette.inkSoft}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: palette.bg,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: palette.txt,
                borderWidth: 1,
                borderColor: palette.line,
                fontSize: 13,
                minHeight: 54,
                textAlignVertical: 'top',
              }}
            />
          )}

          {/* Sans Modérateur extra fields */}
          {isWithoutModerator && (
            <View style={{ borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12, marginTop: 4, gap: 10 }}>
              {/* Type de question */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => onUpdate(index, { questionType: 'TEXT' })}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: 'center',
                    backgroundColor:
                      (question.questionType ?? 'TEXT') === 'TEXT' ? palette.primary : palette.surface2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: (question.questionType ?? 'TEXT') === 'TEXT' ? palette.primaryInk : palette.txt,
                    }}
                  >
                    📝 Texte
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onUpdate(index, { questionType: 'IDENTIFICATION' })}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: 'center',
                    backgroundColor:
                      question.questionType === 'IDENTIFICATION' ? palette.primary : palette.surface2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: question.questionType === 'IDENTIFICATION' ? palette.primaryInk : palette.txt,
                    }}
                  >
                    🖼️ Identification
                  </Text>
                </TouchableOpacity>
              </View>

              {/* URL image si IDENTIFICATION */}
              {question.questionType === 'IDENTIFICATION' && (
                <View>
                  <Text style={{ color: palette.inkSoft, fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' }}>
                    URL de l'image
                  </Text>
                  <TextInput
                    value={question.imageUrl ?? ''}
                    onChangeText={(imageUrl) => onUpdate(index, { imageUrl })}
                    placeholder="https://... URL de l'image"
                    placeholderTextColor={palette.inkSoft}
                    autoCapitalize="none"
                    style={{
                      backgroundColor: palette.bg,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      color: palette.txt,
                      borderWidth: 1,
                      borderColor: palette.line,
                      fontSize: 13,
                    }}
                  />
                </View>
              )}

              {/* Mauvais choix (leurres) */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: palette.inkSoft, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                  Leurres (optionnel — laissez vide pour génération IA)
                </Text>
                {(question.wrongChoices ?? ['', '']).map((choice, ci) => (
                  <TextInput
                    key={ci}
                    value={choice}
                    onChangeText={(value) => {
                      const newChoices = [...(question.wrongChoices ?? ['', ''])];
                      newChoices[ci] = value;
                      onUpdate(index, { wrongChoices: newChoices });
                    }}
                    placeholder={`Leurre ${ci + 1}`}
                    placeholderTextColor={palette.inkSoft}
                    style={{
                      backgroundColor: palette.bg,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      color: palette.txt,
                      borderWidth: 1,
                      borderColor: palette.line,
                      fontSize: 13,
                    }}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function QuestionsScreen() {
  const router = useRouter();
  const { code, sessionId: paramSessionId } = useLocalSearchParams<{ code: string; sessionId?: string }>();

  const [session, setSession] = useState<SessionResponse | null>(null);
  const [questions, setQuestions] = useState<ManualQuestion[]>([{ ...EMPTY_QUESTION }]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState<'paste' | 'excel' | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<ManualQuestion[] | null>(null);

  const sessionId = paramSessionId || session?.id;
  const isWithoutModerator = session?.sessionMode === 'WITHOUT_MODERATOR';

  useEffect(() => {
    if (!paramSessionId && !code) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const loadData = async () => {
      try {
        let sid = paramSessionId;
        if (!sid && code) {
          const detail = await sessionsApi.getSessionByCode(code);
          setSession(detail.session);
          sid = detail.session.id;
        } else if (sid) {
          const detail = await sessionsApi.getSession(sid);
          setSession(detail.session);
        }

        if (sid) {
          const loaded = await sessionsApi.getManualQuestions(sid);
          if (loaded && loaded.length > 0) {
            setQuestions(
              loaded.map((q) => ({
                text: q.text,
                answer: q.answer ?? '',
                explanation: q.explanation ?? '',
                questionType: q.questionType,
                imageUrl: q.imageUrl,
                wrongChoices: q.wrongChoices,
              })),
            );
          } else {
            setQuestions([{ ...EMPTY_QUESTION }]);
          }
        }
      } catch (err) {
        // Continue with empty questions on load error
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [paramSessionId, code]);

  const addQuestion = () => {
    setQuestions((q) => [...q, { ...EMPTY_QUESTION }]);
  };

  const removeQuestion = useCallback((index: number) => {
    setQuestions((q) => (q.length > 1 ? q.filter((_, i) => i !== index) : [{ ...EMPTY_QUESTION }]));
  }, []);

  const updateQuestion = useCallback((index: number, patch: Partial<ManualQuestion>) => {
    setQuestions((q) => q.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }, []);

  // ── Download template (Web / Mobile) ───────────────────────────────────────
  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    setError(null);
    try {
      if (Platform.OS === 'web') {
        const blob = await sessionsApi.getImportTemplate();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'questions_template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        notify.success('Template Excel téléchargé !');
      } else {
        const blob = await sessionsApi.getImportTemplate();
        // Convert blob to base64 for native filesystem
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64data = (reader.result as string).split(',')[1];
            const file = new File(Paths.cache, 'questions_template.xlsx');
            if (file.exists) {
              file.delete();
            }
            file.create();
            file.write(base64data);

            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(file.uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Partager le template Excel',
                UTI: 'com.microsoft.excel.xlsx',
              });
            } else {
              notify.success('Template enregistré dans les fichiers de l\'app');
            }
          } catch {
            notify.error('Impossible de sauvegarder le template');
          }
        };
        reader.readAsDataURL(blob);
      }
    } catch (err: any) {
      setError('Erreur lors du téléchargement du template.');
      notifyApiError(err, 'Erreur lors du téléchargement du template.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // ── Excel file selection (Native & Web) ────────────────────────────────────
  const handlePickExcel = async () => {
    setIsParsing(true);
    setError(null);
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) {
            setIsParsing(false);
            return;
          }
          try {
            const result = await sessionsApi.importExcel(file);
            if (result.questions.length > 0) {
              setPreviewQuestions(result.questions);
              if (result.warnings?.length) {
                notify.info('Import partiel: ' + result.warnings.join('\n'));
              }
            } else {
              setError('Aucune question valide trouvée dans le fichier.');
            }
          } catch (err: any) {
            setError("Erreur lors de l'import du fichier Excel.");
            notifyApiError(err, "Erreur lors de l'import du fichier Excel.");
          } finally {
            setIsParsing(false);
          }
        };
        input.click();
      } else {
        const res = await DocumentPicker.getDocumentAsync({
          type: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            '*/*',
          ],
          copyToCacheDirectory: true,
        });

        if (res.canceled || !res.assets || res.assets.length === 0) {
          setIsParsing(false);
          return;
        }

        const asset = res.assets[0];
        const result = await sessionsApi.importExcel({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType,
        });

        if (result.questions.length > 0) {
          setPreviewQuestions(result.questions);
          if (result.warnings?.length) {
            notify.info('Import partiel: ' + result.warnings.join('\n'));
          }
        } else {
          setError('Aucune question valide trouvée dans le fichier.');
        }
        setIsParsing(false);
      }
    } catch (err: any) {
      setError("Erreur lors de l'import du fichier Excel.");
      notifyApiError(err, "Erreur lors de l'import du fichier Excel.");
      setIsParsing(false);
    }
  };

  // ── Paste import ───────────────────────────────────────────────────────────
  const handlePasteImport = async () => {
    if (!pasteText.trim()) return;

    setIsParsing(true);
    setError(null);
    try {
      const result = await sessionsApi.importQuestionsFromText(pasteText);
      if (result.questions.length > 0) {
        setPreviewQuestions(result.questions);
        if (result.warnings && result.warnings.length > 0) {
          notify.info('Import partiel: ' + result.warnings.join('\n'));
        }
      } else {
        setError('Aucune question valide trouvée dans le texte collé.');
      }
    } catch (err: any) {
      setError("Erreur lors de l'analyse du texte collé.");
      notifyApiError(err, "Erreur lors de l'analyse du texte collé.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmPreview = () => {
    if (previewQuestions && previewQuestions.length > 0) {
      setQuestions((q) => {
        const cleaned = q.length === 1 && !q[0].text && !q[0].answer ? [] : q;
        return [...cleaned, ...previewQuestions];
      });
      setPreviewQuestions(null);
      setPasteText('');
      setImportMode(null);
      setShowImport(false);
      notify.success(`${previewQuestions.length} question(s) ajoutée(s) !`);
    }
  };

  const handleCancelPreview = () => {
    setPreviewQuestions(null);
  };

  // ── Save questions ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    const valid = questions.filter((q) => q.text.trim() && q.answer.trim());
    if (valid.length === 0) {
      setError('Ajoutez au moins une question avec une réponse.');
      return;
    }
    if (!sessionId) {
      setError('ID de session manquant.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = valid.map((q) => ({
        text: q.text.trim(),
        answer: q.answer.trim(),
        explanation: q.explanation?.trim() || null,
        ...(isWithoutModerator
          ? {
              questionType: q.questionType ?? 'TEXT',
              imageUrl: q.imageUrl?.trim() || null,
              wrongChoices: (q.wrongChoices ?? []).filter((c) => c.trim() !== ''),
            }
          : {}),
      }));
      await sessionsApi.setManualQuestions(sessionId, payload);
      notify.success('Questions enregistrées avec succès !');
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erreur lors de l'enregistrement.";
      setError(msg);
      notifyApiError(err, msg);
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = questions.filter((q) => q.text.trim() && q.answer.trim()).length;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.inkSoft, fontSize: 14 }}>Chargement des questions…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: palette.line,
            backgroundColor: palette.bg,
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: palette.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <ArrowLeft size={20} color={palette.txt} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.txt, fontSize: 18, fontWeight: '700' }}>
              Questions manuelles
            </Text>
            <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '600' }}>
              {validCount} question{validCount > 1 ? 's' : ''} valide{validCount > 1 ? 's' : ''}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving || validCount === 0}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: validCount > 0 && !isSaving ? palette.primary : palette.surface2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={palette.primaryInk} />
            ) : (
              <>
                <Check size={16} color={validCount > 0 ? palette.primaryInk : palette.inkSoft} strokeWidth={2.5} />
                <Text
                  style={{
                    color: validCount > 0 ? palette.primaryInk : palette.inkSoft,
                    fontSize: 13,
                    fontWeight: '700',
                  }}
                >
                  Enregistrer
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Scroll Content */}
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Import Accordion */}
          <View>
            <TouchableOpacity
              onPress={() => setShowImport((s) => !s)}
              activeOpacity={0.8}
              style={{
                backgroundColor: palette.surface,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: palette.line,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <FileSpreadsheet size={18} color={palette.violet} />
              <Text style={{ color: palette.txt, fontSize: 14, fontWeight: '600', marginLeft: 10, flex: 1 }}>
                Importer des questions
              </Text>
              {showImport ? (
                <ChevronUp size={16} color={palette.inkSoft} />
              ) : (
                <ChevronDown size={16} color={palette.inkSoft} />
              )}
            </TouchableOpacity>

            {showImport && (
              <FadeInUpView
                style={{
                  marginTop: 8,
                  backgroundColor: palette.surface,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: palette.line,
                  padding: 16,
                  gap: 12,
                }}
                duration={250}
              >
                {/* Download template */}
                <TouchableOpacity
                  onPress={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: palette.primary + '26',
                    borderWidth: 1,
                    borderColor: palette.primary + '40',
                    gap: 8,
                  }}
                >
                  {isDownloadingTemplate ? (
                    <ActivityIndicator size="small" color={palette.primary} />
                  ) : (
                    <>
                      <Download size={16} color={palette.primary} />
                      <Text style={{ color: palette.primary, fontSize: 13, fontWeight: '700' }}>
                        Télécharger le template Excel
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={{ color: palette.inkSoft, fontSize: 12, fontWeight: '600' }}>
                  Choisissez une méthode d'import :
                </Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setImportMode('excel');
                      handlePickExcel();
                    }}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: importMode === 'excel' ? palette.violet : palette.surface2,
                      gap: 4,
                    }}
                  >
                    <FileUp size={18} color={importMode === 'excel' ? '#FFFFFF' : palette.inkSoft} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: importMode === 'excel' ? '#FFFFFF' : palette.txt,
                      }}
                    >
                      Fichier Excel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setImportMode('paste')}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                      backgroundColor: importMode === 'paste' ? palette.violet : palette.surface2,
                      gap: 4,
                    }}
                  >
                    <ClipboardPaste size={18} color={importMode === 'paste' ? '#FFFFFF' : palette.inkSoft} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: importMode === 'paste' ? '#FFFFFF' : palette.txt,
                      }}
                    >
                      Coller du texte
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Paste Area */}
                {importMode === 'paste' && (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <Text style={{ color: palette.inkSoft, fontSize: 11 }}>
                      Formats acceptés :{'\n'}
                      • <Text style={{ color: palette.primary, fontWeight: '700' }}>#</Text> (préféré) : Question # Réponse # Explication{'\n'}
                      • <Text style={{ color: palette.primary, fontWeight: '700' }}>Tab</Text> : Question↹Réponse↹Explication
                    </Text>
                    <TextInput
                      value={pasteText}
                      onChangeText={setPasteText}
                      placeholder={"Coller ici...\nEx: Quelle est la capitale du Japon ? # Tokyo # Pays en Asie"}
                      placeholderTextColor={palette.inkSoft}
                      multiline
                      numberOfLines={5}
                      style={{
                        backgroundColor: palette.bg,
                        borderRadius: 12,
                        padding: 12,
                        color: palette.txt,
                        borderWidth: 1,
                        borderColor: palette.line,
                        fontSize: 13,
                        minHeight: 90,
                        textAlignVertical: 'top',
                      }}
                    />
                    <TouchableOpacity
                      onPress={handlePasteImport}
                      disabled={!pasteText.trim() || isParsing}
                      activeOpacity={0.8}
                      style={{
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: pasteText.trim() && !isParsing ? palette.violet : palette.surface2,
                      }}
                    >
                      {isParsing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                          Analyser et Importer
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {isParsing && importMode === 'excel' && (
                  <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                    <ActivityIndicator size="small" color={palette.violet} />
                    <Text style={{ color: palette.inkSoft, fontSize: 12, marginTop: 6 }}>
                      Analyse du fichier Excel en cours…
                    </Text>
                  </View>
                )}
              </FadeInUpView>
            )}
          </View>

          {/* Preview Section */}
          {previewQuestions && previewQuestions.length > 0 && (
            <FadeInUpView
              style={{
                backgroundColor: palette.surface,
                borderRadius: 18,
                borderWidth: 1.5,
                borderColor: palette.violet,
                padding: 16,
                gap: 12,
              }}
              duration={250}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: palette.txt, fontSize: 15, fontWeight: '700', flex: 1 }}>
                  Aperçu ({previewQuestions.length} questions)
                </Text>
                <TouchableOpacity
                  onPress={handleCancelPreview}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 9999,
                    backgroundColor: palette.surface2,
                  }}
                >
                  <Text style={{ color: palette.inkSoft, fontSize: 11, fontWeight: '600' }}>Annuler</Text>
                </TouchableOpacity>
              </View>

              <View style={{ maxHeight: 200, gap: 8 }}>
                {previewQuestions.slice(0, 6).map((q, i) => (
                  <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: palette.line, paddingBottom: 6 }}>
                    <Text style={{ color: palette.txt, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                      {i + 1}. {q.text}
                    </Text>
                    <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '500' }}>
                      → {q.answer}
                    </Text>
                  </View>
                ))}
                {previewQuestions.length > 6 && (
                  <Text style={{ color: palette.inkSoft, fontSize: 11, textAlign: 'center' }}>
                    + {previewQuestions.length - 6} autres questions…
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handleConfirmPreview}
                activeOpacity={0.8}
                style={{
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: palette.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: palette.primaryInk, fontSize: 14, fontWeight: '700' }}>
                  Confirmer et ajouter ({previewQuestions.length})
                </Text>
              </TouchableOpacity>
            </FadeInUpView>
          )}

          {/* Questions Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 2 }}>
            <PenLine size={16} color={palette.gold} />
            <Text style={{ color: palette.txt, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>
              Questions ({questions.length})
            </Text>
          </View>

          {/* Question Items */}
          {questions.map((q, i) => (
            <QuestionItem
              key={i}
              question={q}
              index={i}
              onUpdate={updateQuestion}
              onRemove={removeQuestion}
              isWithoutModerator={isWithoutModerator}
            />
          ))}

          {/* Add Question Button */}
          <TouchableOpacity
            onPress={addQuestion}
            activeOpacity={0.7}
            style={{
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: palette.line,
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Plus size={18} color={palette.inkSoft} />
            <Text style={{ color: palette.inkSoft, fontSize: 14, fontWeight: '700' }}>
              Ajouter une question
            </Text>
          </TouchableOpacity>

          {/* Error Banner */}
          {error && (
            <View
              style={{
                backgroundColor: palette.bad + '20',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: palette.bad + '50',
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertCircle size={18} color={palette.bad} />
              <Text style={{ color: palette.bad, fontSize: 13, flex: 1, fontWeight: '600' }}>
                {error}
              </Text>
            </View>
          )}

          {/* Bottom Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving || validCount === 0}
            activeOpacity={0.8}
            style={{
              marginTop: 10,
              paddingVertical: 16,
              borderRadius: 18,
              backgroundColor: validCount > 0 && !isSaving ? palette.primary : palette.surface2,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color={palette.primaryInk} />
                <Text style={{ color: palette.primaryInk, fontSize: 16, fontWeight: '700' }}>
                  Enregistrement…
                </Text>
              </>
            ) : (
              <>
                <Check size={20} color={validCount > 0 ? palette.primaryInk : palette.inkSoft} strokeWidth={2.5} />
                <Text
                  style={{
                    color: validCount > 0 ? palette.primaryInk : palette.inkSoft,
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  Enregistrer {validCount > 0 ? `(${validCount})` : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
