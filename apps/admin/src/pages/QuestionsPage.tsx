import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  X,
  Save,
  Trash2,
  Pencil,
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Spinner } from '../components/loading/Spinner';
import {
  adminApi,
  confirmAsync,
  type AdminCategoryResponse,
  type AdminQuestionResponse,
} from '@xalaat/core';

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  EASY: { label: 'Facile', color: 'var(--primary)' },
  MEDIUM: { label: 'Moyen', color: 'var(--warn)' },
  HARD: { label: 'Difficile', color: 'var(--bad)' },
};

const DIFFICULTY_OPTIONS = ['EASY', 'MEDIUM', 'HARD'] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

const PAGE_SIZE = 20;

export function QuestionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Categories state
  const [catSearch, setCatSearch] = useState('');
  const [debouncedCatSearch, setDebouncedCatSearch] = useState('');
  const [catPage, setCatPage] = useState(0);

  // Questions state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [qSearch, setQSearch] = useState('');
  const [debouncedQSearch, setDebouncedQSearch] = useState('');
  const [qPage, setQPage] = useState(0);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminQuestionResponse>>({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCatSearch(catSearch), 400);
    return () => clearTimeout(t);
  }, [catSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQSearch(qSearch), 400);
    return () => clearTimeout(t);
  }, [qSearch]);

  const { data: categoriesData, isLoading: catLoading } = useQuery({
    queryKey: ['adminQuestionCategories', catPage, debouncedCatSearch],
    queryFn: () =>
      adminApi.getAdminQuestionCategories({
        search: debouncedCatSearch || undefined,
        page: catPage,
        size: PAGE_SIZE,
      }),
    enabled: !selectedCategory,
  });

  const { data: questionsData, isLoading: qLoading } = useQuery({
    queryKey: ['adminQuestions', selectedCategory, qPage, debouncedQSearch],
    queryFn: () =>
      adminApi.getAdminQuestions({
        category: selectedCategory!,
        search: debouncedQSearch || undefined,
        page: qPage,
        size: PAGE_SIZE,
      }),
    enabled: !!selectedCategory,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { text?: string; answer?: string; explanation?: string; difficulty?: string };
    }) => adminApi.updateAdminQuestion(id, data),
    onSuccess: () => {
      toast.success('Question mise à jour');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
    },
    onError: () => toast.error('Impossible de mettre à jour la question'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAdminQuestion(id),
    onSuccess: () => {
      toast.success('Question supprimée');
      queryClient.invalidateQueries({ queryKey: ['adminQuestions'] });
    },
    onError: () => toast.error('Impossible de supprimer la question'),
  });

  const startEdit = (q: AdminQuestionResponse) => {
    setEditingId(q.id);
    setEditForm({
      text: q.text,
      answer: q.answer,
      explanation: q.explanation ?? '',
      difficulty: q.difficulty,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({
      id,
      data: {
        text: editForm.text,
        answer: editForm.answer,
        explanation: editForm.explanation || undefined,
        difficulty: editForm.difficulty,
      },
    });
  };

  const handleDeleteQuestion = async (q: AdminQuestionResponse) => {
    const confirmed = await confirmAsync({
      title: 'Supprimer cette question ?',
      message: 'Elle ne sera plus proposée dans les parties.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!confirmed) return;
    deleteMutation.mutate(q.id);
  };

  const categories = categoriesData?.content ?? [];
  const questions = questionsData?.content ?? [];

  // Questions view
  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        {/* Header */}
        <div className="bg-bg pt-6 pb-4 px-4 border-b border-line">
          <div className="flex items-center">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setEditingId(null);
              }}
              className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mr-3 hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} color="var(--txt)" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-txt font-bold text-lg truncate font-display">{selectedCategory}</p>
              <p className="text-txt-60 text-xs">
                {questionsData?.totalElements ?? 0} question
                {(questionsData?.totalElements ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="flex items-center bg-surface rounded-xl border border-line px-4">
            <Search size={18} color="rgba(255,255,255,0.4)" className="shrink-0" />
            <input
              value={qSearch}
              onChange={(e) => {
                setQSearch(e.target.value);
                setQPage(0);
              }}
              placeholder="Rechercher dans les questions..."
              className="flex-1 py-3 px-3 bg-transparent text-txt focus:outline-none placeholder-white/40 text-sm"
            />
            {qSearch && (
              <button onClick={() => setQSearch('')} className="cursor-pointer">
                <X size={16} color="rgba(255,255,255,0.4)" />
              </button>
            )}
          </div>
        </div>

        {/* Questions table */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {qLoading && questions.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Spinner text="Chargement..." />
            </div>
          ) : questions.length === 0 ? (
            <Card className="flex items-center justify-center py-12">
              <p className="text-txt-60">Aucune question trouvée</p>
            </Card>
          ) : (
            <div className="bg-surface rounded-2xl border border-line overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="px-4 py-3 text-xs font-semibold text-txt-60 uppercase">
                        Question
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-txt-60 uppercase">
                        Réponse
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-txt-60 uppercase">
                        Explication
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-txt-60 uppercase">
                        Difficulté
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-txt-60 uppercase text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => {
                      const isEditing = editingId === q.id;
                      const diff = DIFFICULTY_CONFIG[q.difficulty] ?? DIFFICULTY_CONFIG['MEDIUM'];
                      return (
                        <tr key={q.id} className="border-b border-line last:border-b-0">
                          <td className="px-4 py-3 text-sm text-txt-60 min-w-[200px]">
                            {isEditing ? (
                              <textarea
                                value={editForm.text ?? ''}
                                onChange={(e) =>
                                  setEditForm((prev) => ({ ...prev, text: e.target.value }))
                                }
                                className="w-full bg-bg text-txt px-3 py-2 rounded-lg border border-line focus:border-host focus:outline-none text-sm resize-y min-h-[60px]"
                              />
                            ) : (
                              <span className="line-clamp-2">{q.text}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-txt-60 min-w-[140px]">
                            {isEditing ? (
                              <input
                                value={editForm.answer ?? ''}
                                onChange={(e) =>
                                  setEditForm((prev) => ({ ...prev, answer: e.target.value }))
                                }
                                className="w-full bg-bg text-txt px-3 py-2 rounded-lg border border-line focus:border-host focus:outline-none text-sm"
                              />
                            ) : (
                              <div className="flex items-center gap-1">
                                <CheckCircle size={13} color="var(--primary)" />
                                <span className="text-accent font-medium">{q.answer}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-txt-60 min-w-[180px]">
                            {isEditing ? (
                              <textarea
                                value={editForm.explanation ?? ''}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    explanation: e.target.value,
                                  }))
                                }
                                className="w-full bg-bg text-txt px-3 py-2 rounded-lg border border-line focus:border-host focus:outline-none text-sm resize-y min-h-[60px]"
                              />
                            ) : (
                              <span className="text-txt-60 italic line-clamp-2">
                                {q.explanation ?? '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm min-w-[100px]">
                            {isEditing ? (
                              <select
                                value={editForm.difficulty ?? 'MEDIUM'}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD',
                                  }))
                                }
                                className="w-full bg-bg text-txt px-3 py-2 rounded-lg border border-line focus:border-host focus:outline-none text-sm"
                              >
                                {DIFFICULTY_OPTIONS.map((d) => (
                                  <option key={d} value={d}>
                                    {DIFFICULTY_CONFIG[d].label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className="text-xs px-2 py-0.5 rounded font-medium"
                                style={{ backgroundColor: `${diff.color}20`, color: diff.color }}
                              >
                                {diff.label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(q.id)}
                                    disabled={updateMutation.isPending}
                                    className="p-1.5 rounded-lg bg-accent/15 hover:bg-accent/20 text-accent transition-colors cursor-pointer"
                                    title="Sauvegarder"
                                  >
                                    <Save size={14} />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-2 text-txt-60 hover:text-txt transition-colors cursor-pointer"
                                    title="Annuler"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEdit(q)}
                                    className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-2 text-txt-60 hover:text-txt transition-colors cursor-pointer"
                                    title="Éditer"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuestion(q)}
                                    className="p-1.5 rounded-lg bg-buzz/15 hover:bg-buzz/20 text-buzz transition-colors cursor-pointer"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {(questionsData?.totalPages ?? 1) > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-line">
                  <span className="text-txt-40 text-xs">
                    Page {qPage + 1} / {questionsData?.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQPage((p) => Math.max(0, p - 1))}
                      disabled={qPage === 0}
                      className="p-1.5 rounded-lg bg-surface-2 text-txt disabled:opacity-30 hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setQPage((p) => Math.min((questionsData?.totalPages ?? 1) - 1, p + 1))
                      }
                      disabled={qPage >= (questionsData?.totalPages ?? 1) - 1}
                      className="p-1.5 rounded-lg bg-surface-2 text-txt disabled:opacity-30 hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Categories view
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="bg-bg pt-6 pb-4 px-4 border-b border-line">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mr-3 hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} color="var(--txt)" />
          </button>
          <div className="flex-1">
            <p className="text-txt font-bold text-xl font-display">Historique questions</p>
            <p className="text-txt-60 text-xs">
              {categoriesData?.totalElements ?? 0} catégorie
              {(categoriesData?.totalElements ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center bg-surface rounded-xl border border-line px-4">
          <Search size={18} color="rgba(255,255,255,0.4)" className="shrink-0" />
          <input
            value={catSearch}
            onChange={(e) => {
              setCatSearch(e.target.value);
              setCatPage(0);
            }}
            placeholder="Rechercher une catégorie..."
            className="flex-1 py-3 px-3 bg-transparent text-txt focus:outline-none placeholder-white/40 text-sm"
          />
        </div>
      </div>

      {/* Categories list */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {catLoading && categories.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Spinner text="Chargement..." />
          </div>
        ) : categories.length === 0 ? (
          <Card className="flex items-center justify-center py-12">
            <p className="text-txt-60">Aucune catégorie trouvée</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => {
                  setSelectedCategory(cat.category);
                  setQPage(0);
                  setQSearch('');
                }}
                className="text-left cursor-pointer"
              >
                <Card className="h-full hover:border-host transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-team/15 flex items-center justify-center shrink-0">
                      <BookOpen size={20} color="var(--indigo)" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-txt font-semibold truncate">{cat.category}</p>
                    </div>
                    <ChevronRight size={18} color="rgba(255,255,255,0.25)" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-txt-60 text-xs">
                      {cat.questionCount} question{cat.questionCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-txt/30 text-xs">
                      Dernière: {formatDate(cat.lastUsedAt)}
                    </span>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}

        {/* Pagination categories */}
        {(categoriesData?.totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              onClick={() => setCatPage((p) => Math.max(0, p - 1))}
              disabled={catPage === 0}
              className="p-1.5 rounded-lg bg-surface-2 text-txt disabled:opacity-30 hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-txt-40 text-xs">
              Page {catPage + 1} / {categoriesData?.totalPages}
            </span>
            <button
              onClick={() =>
                setCatPage((p) => Math.min((categoriesData?.totalPages ?? 1) - 1, p + 1))
              }
              disabled={catPage >= (categoriesData?.totalPages ?? 1) - 1}
              className="p-1.5 rounded-lg bg-surface-2 text-txt disabled:opacity-30 hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
