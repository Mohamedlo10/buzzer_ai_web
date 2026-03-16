'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
} from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import * as sessionsApi from '~/lib/api/sessions';
import type { ManualQuestion } from '~/types/api';

const EMPTY_QUESTION: ManualQuestion = { text: '', answer: '', explanation: '' };

function QuestionItem({
  question,
  index,
  onUpdate,
  onRemove,
}: {
  question: ManualQuestion;
  index: number;
  onUpdate: (index: number, field: keyof ManualQuestion, value: string) => void;
  onRemove: (index: number) => void;
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="mb-3">
      <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] overflow-hidden">
        {/* Header */}
        <div className="flex flex-row items-center px-4 py-3 border-b border-[#3E3666]">
          <div className="w-7 h-7 rounded-lg bg-[#FFD70020] flex items-center justify-center mr-3">
            <span className="text-[#FFD700] font-bold text-xs">{index + 1}</span>
          </div>
          <span className="text-white/60 text-sm flex-1">Question {index + 1}</span>
          <button
            onClick={() => onRemove(index)}
            className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-colors"
          >
            <Trash2 size={14} color="#EF4444" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {/* Question text */}
          <textarea
            value={question.text}
            onChange={(e) => onUpdate(index, 'text', e.target.value)}
            placeholder="Question *"
            className="bg-[#292349] rounded-xl px-4 py-3 text-white border border-[#3E3666] focus:border-[#00D397] outline-none resize-none min-h-[80px]"
            rows={2}
          />

          {/* Answer */}
          <input
            type="text"
            value={question.answer}
            onChange={(e) => onUpdate(index, 'answer', e.target.value)}
            placeholder="Réponse *"
            className="bg-[#292349] rounded-xl px-4 py-3 text-white border border-[#3E3666] focus:border-[#00D397] outline-none"
          />

          {/* Explanation toggle */}
          <button
            onClick={() => setShowExplanation((s) => !s)}
            className="flex flex-row items-center"
          >
            {showExplanation ? (
              <ChevronUp size={14} color="#FFFFFF40" />
            ) : (
              <ChevronDown size={14} color="#FFFFFF40" />
            )}
            <span className="text-white/40 text-xs ml-1">
              {showExplanation ? "Masquer l'explication" : 'Ajouter une explication (optionnel)'}
            </span>
          </button>

          {showExplanation && (
            <textarea
              value={question.explanation ?? ''}
              onChange={(e) => onUpdate(index, 'explanation', e.target.value)}
              placeholder="Explication (optionnel)"
              className="bg-[#292349] rounded-xl px-4 py-3 text-white border border-[#3E3666] focus:border-[#00D397] outline-none resize-none min-h-[80px]"
              rows={2}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const code = params.code;
  const sessionId = searchParams.get('sessionId') ?? undefined;

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

  // Load questions on mount
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    sessionsApi.getManualQuestions(sessionId).then((loaded) => {
      if (loaded && loaded.length > 0) {
        setQuestions(
          loaded.map((q) => ({
            text: q.text,
            answer: q.answer ?? '',
            explanation: q.explanation ?? '',
          })),
        );
      } else {
        setQuestions([{ ...EMPTY_QUESTION }]);
      }
    }).catch(() => {
      // keep current state
    }).finally(() => {
      setIsLoading(false);
    });
  }, [sessionId]);

  const addQuestion = () => {
    setQuestions((q) => [...q, { ...EMPTY_QUESTION }]);
  };

  const removeQuestion = useCallback((index: number) => {
    setQuestions((q) => q.filter((_, i) => i !== index));
  }, []);

  const updateQuestion = useCallback(
    (index: number, field: keyof ManualQuestion, value: string) => {
      setQuestions((q) =>
        q.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      );
    },
    [],
  );

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    setError(null);
    try {
      const blob = await sessionsApi.getImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'questions_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Erreur lors du téléchargement du template.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);
    try {
      const result = await sessionsApi.importExcel(file);
      if (result.questions.length > 0) {
        setPreviewQuestions(result.questions);
        if (result.warnings.length > 0) {
          window.alert('Import partiel: ' + result.warnings.join('\n'));
        }
      } else {
        setError('Aucune question valide trouvée dans le fichier.');
      }
    } catch {
      setError("Erreur lors de l'import du fichier Excel.");
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteImport = async () => {
    if (!pasteText.trim()) return;

    setIsParsing(true);
    setError(null);
    try {
      const result = await sessionsApi.importQuestionsFromText(pasteText);
      if (result.questions.length > 0) {
        setPreviewQuestions(result.questions);
        if (result.warnings && result.warnings.length > 0) {
          window.alert('Import partiel: ' + result.warnings.join('\n'));
        }
      } else {
        setError('Aucune question valide trouvée dans le texte collé.');
      }
    } catch {
      setError("Erreur lors de l'analyse du texte collé.");
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
    }
  };

  const handleCancelPreview = () => {
    setPreviewQuestions(null);
  };

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
      }));
      await sessionsApi.setManualQuestions(sessionId, payload);
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erreur lors de l'enregistrement.";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = questions.filter((q) => q.text.trim() && q.answer.trim()).length;

  if (isLoading) {
    return (
      <SafeScreen className="bg-[#292349]">
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm mt-3">Chargement des questions...</p>
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="bg-[#292349]">
      {/* Header */}
      <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666] sticky top-0 z-10">
        <div className="flex flex-row items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-xl">Questions manuelles</p>
            <p className="text-white/50 text-xs">
              {validCount} question(s) valide(s)
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || validCount === 0}
            className={`px-4 py-2 rounded-xl transition-colors ${
              validCount > 0 && !isSaving ? 'bg-[#00D397] hover:bg-[#00B377]' : 'bg-[#3E3666] cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className={`font-bold text-sm ${validCount > 0 ? 'text-[#292349]' : 'text-white/40'}`}>
                Enregistrer
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="overflow-y-auto pb-10">
        {/* Import Section */}
        <div className="px-4 pt-4 mb-2">
          <button
            onClick={() => setShowImport((s) => !s)}
            className="w-full bg-[#342D5B] rounded-2xl border border-[#3E3666] px-4 py-3 flex flex-row items-center hover:bg-[#3E3666] transition-colors"
          >
            <FileSpreadsheet size={18} color="#9B59B6" />
            <span className="text-white font-semibold text-sm ml-2 flex-1 text-left">
              Importer des questions
            </span>
            {showImport ? (
              <ChevronUp size={16} color="#FFFFFF40" />
            ) : (
              <ChevronDown size={16} color="#FFFFFF40" />
            )}
          </button>

          {showImport && (
            <div className="mt-2">
              <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] p-4">
                {/* Download Template */}
                <button
                  onClick={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                  className="w-full flex flex-row items-center justify-center py-3 rounded-xl bg-[#00D39720] border border-[#00D39740] mb-4 hover:bg-[#00D39730] transition-colors"
                >
                  {isDownloadingTemplate ? (
                    <div className="w-5 h-5 border-2 border-[#00D397] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download size={18} color="#00D397" />
                      <span className="text-[#00D397] font-semibold ml-2">
                        Télécharger le template Excel
                      </span>
                    </>
                  )}
                </button>

                <p className="text-white/50 text-xs mb-3">Choisissez une méthode d'import :</p>

                <div className="flex flex-row gap-2 mb-4">
                  <button
                    onClick={() => setImportMode('excel')}
                    className={`flex-1 py-3 rounded-xl flex flex-col items-center transition-colors ${
                      importMode === 'excel' ? 'bg-[#9B59B6]' : 'bg-[#3E3666] hover:bg-[#4E4676]'
                    }`}
                  >
                    <FileUp size={18} color={importMode === 'excel' ? '#FFFFFF' : '#FFFFFF60'} />
                    <span className={`text-sm font-medium mt-1 ${importMode === 'excel' ? 'text-white' : 'text-white/60'}`}>
                      Fichier Excel
                    </span>
                  </button>

                  <button
                    onClick={() => setImportMode('paste')}
                    className={`flex-1 py-3 rounded-xl flex flex-col items-center transition-colors ${
                      importMode === 'paste' ? 'bg-[#9B59B6]' : 'bg-[#3E3666] hover:bg-[#4E4676]'
                    }`}
                  >
                    <ClipboardPaste size={18} color={importMode === 'paste' ? '#FFFFFF' : '#FFFFFF60'} />
                    <span className={`text-sm font-medium mt-1 ${importMode === 'paste' ? 'text-white' : 'text-white/60'}`}>
                      Coller du texte
                    </span>
                  </button>
                </div>

                {/* Excel Upload */}
                {importMode === 'excel' && (
                  <div className="mb-3">
                    <label className="cursor-pointer block">
                      <div className="bg-[#292349] rounded-xl border-2 border-dashed border-[#9B59B6] p-6 flex flex-col items-center hover:border-[#B56CD6] transition-colors">
                        <FileUp size={32} color="#9B59B6" />
                        <p className="text-white font-semibold mt-2">
                          Cliquez pour sélectionner un fichier
                        </p>
                        <p className="text-white/40 text-xs mt-1">.xlsx ou .xls</p>
                      </div>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleExcelUpload}
                        className="hidden"
                      />
                    </label>
                    {isParsing && (
                      <div className="flex items-center justify-center py-3">
                        <div className="w-5 h-5 border-2 border-[#9B59B6] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                )}

                {/* Paste Text */}
                {importMode === 'paste' && (
                  <div className="mb-3">
                    <p className="text-white/50 text-xs mb-2">
                      Formats acceptés :{'\n'}
                      • <span className="text-[#00D397]">#</span> (préféré) : Question # Réponse # Explication{'\n'}
                      • <span className="text-[#00D397]">Tab</span> : Question↹Réponse↹Explication
                    </p>
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder={"Coller ici...\nEx: Quelle est la capitale du Japon ? # Tokyo # Pays en Asie"}
                      className="w-full bg-[#292349] rounded-xl px-4 py-3 text-white border border-[#3E3666] focus:border-[#00D397] outline-none resize-none mb-3"
                      rows={5}
                    />
                    <button
                      onClick={handlePasteImport}
                      disabled={!pasteText.trim() || isParsing}
                      className={`w-full py-3 rounded-xl flex items-center justify-center transition-colors ${
                        pasteText.trim() && !isParsing ? 'bg-[#9B59B6] hover:bg-[#A56CE6]' : 'bg-[#3E3666] cursor-not-allowed'
                      }`}
                    >
                      {isParsing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-white font-semibold text-sm">Importer</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        {previewQuestions && previewQuestions.length > 0 && (
          <div className="px-4 mb-4">
            <div className="bg-[#342D5B] rounded-2xl border border-[#9B59B6] p-4">
              <div className="flex flex-row items-center justify-between mb-3">
                <p className="text-white font-bold text-base">
                  Preview ({previewQuestions.length} questions)
                </p>
                <button
                  onClick={handleCancelPreview}
                  className="px-3 py-1.5 rounded-full bg-[#3E3666] hover:bg-[#4E4676] transition-colors"
                >
                  <span className="text-white/60 text-xs">Annuler</span>
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto mb-3">
                {previewQuestions.map((q, i) => (
                  <div key={i} className="py-2 border-b border-[#3E3666] last:border-b-0">
                    <p className="text-white text-sm truncate">
                      {i + 1}. {q.text}
                    </p>
                    <p className="text-[#00D397] text-xs">
                      → {q.answer}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirmPreview}
                className="w-full py-3 rounded-xl bg-[#00D397] flex items-center justify-center hover:bg-[#00B377] transition-colors"
              >
                <span className="text-[#292349] font-bold">Confirmer et ajouter</span>
              </button>
            </div>
          </div>
        )}

        {/* Questions list */}
        <div className="px-4 pt-2">
          <div className="flex flex-row items-center mb-3">
            <PenLine size={16} color="#FFD700" />
            <p className="text-white font-bold text-base ml-2">
              Questions ({questions.length})
            </p>
          </div>

          {questions.map((q, i) => (
            <QuestionItem
              key={i}
              question={q}
              index={i}
              onUpdate={updateQuestion}
              onRemove={removeQuestion}
            />
          ))}

          {/* Add question button */}
          <button
            onClick={addQuestion}
            className="w-full border-2 border-dashed border-[#3E3666] rounded-2xl py-4 flex items-center justify-center hover:border-[#00D397] hover:bg-[#00D39710] transition-colors mt-1"
          >
            <div className="flex flex-row items-center">
              <Plus size={18} color="#FFFFFF40" />
              <span className="text-white/40 font-semibold text-sm ml-2">
                Ajouter une question
              </span>
            </div>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 mt-4">
            <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/30 flex flex-row items-center">
              <AlertCircle size={18} color="#EF4444" />
              <p className="text-red-400 flex-1 ml-3 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="px-4 mt-6">
          <button
            onClick={handleSave}
            disabled={isSaving || validCount === 0}
            className={`w-full py-4 rounded-2xl flex flex-row items-center justify-center transition-colors ${
              validCount > 0 && !isSaving ? 'bg-[#00D397] hover:bg-[#00B377]' : 'bg-[#3E3666] cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                <span className="text-white font-bold text-lg">Enregistrement...</span>
              </>
            ) : (
              <>
                <Check
                  size={22}
                  color={validCount > 0 ? '#292349' : '#FFFFFF40'}
                  strokeWidth={2.5}
                />
                <span
                  className={`font-bold text-lg ml-2 ${
                    validCount > 0 ? 'text-[#292349]' : 'text-white/40'
                  }`}
                >
                  Enregistrer {validCount > 0 ? `(${validCount})` : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </SafeScreen>
  );
}
