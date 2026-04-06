'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, BookOpen, ChevronRight, CheckCircle, Trophy, X } from 'lucide-react';

import { Card } from '~/components/ui/Card';
import { Spinner } from '~/components/loading/Spinner';
import * as adminApi from '~/lib/api/admin';
import type { AdminCategoryResponse, AdminQuestionResponse } from '~/types/api';

const DIFFICULTY_CONFIG = {
  EASY:   { label: 'Facile',    color: '#00D397' },
  MEDIUM: { label: 'Moyen',     color: '#F39C12' },
  HARD:   { label: 'Difficile', color: '#D5442F' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

export default function AdminQuestionsPage() {
  const router = useRouter();

  // Categories view
  const [categories, setCategories] = useState<AdminCategoryResponse[]>([]);
  const [catSearch, setCatSearch] = useState('');
  const [catPage, setCatPage] = useState(0);
  const [catHasMore, setCatHasMore] = useState(true);
  const [catLoading, setCatLoading] = useState(true);

  // Questions view
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AdminQuestionResponse[]>([]);
  const [qSearch, setQSearch] = useState('');
  const [qPage, setQPage] = useState(0);
  const [qHasMore, setQHasMore] = useState(true);
  const [qLoading, setQLoading] = useState(false);

  const loadCategories = useCallback(async (pageNum = 0, append = false, searchVal = catSearch) => {
    try {
      const params: Record<string, unknown> = { page: pageNum, size: 20 };
      if (searchVal.trim()) params.search = searchVal.trim();
      const response = await adminApi.getAdminQuestionCategories(params);
      if (append) {
        setCategories((prev) => [...prev, ...response.content]);
      } else {
        setCategories(response.content);
      }
      setCatHasMore(!response.last);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCatLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuestions = useCallback(async (category: string, pageNum = 0, append = false, searchVal = qSearch) => {
    setQLoading(true);
    try {
      const params: Record<string, unknown> = { category, page: pageNum, size: 20 };
      if (searchVal.trim()) params.search = searchVal.trim();
      const response = await adminApi.getAdminQuestions(params);
      if (append) {
        setQuestions((prev) => [...prev, ...response.content]);
      } else {
        setQuestions(response.content);
      }
      setQHasMore(!response.last);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setQLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCatSearch = (val: string) => {
    setCatSearch(val);
    setCatPage(0);
    setCatLoading(true);
    loadCategories(0, false, val);
  };

  const handleCatLoadMore = () => {
    if (catHasMore && !catLoading) {
      const next = catPage + 1;
      setCatPage(next);
      loadCategories(next, true);
    }
  };

  const handleCatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 80) handleCatLoadMore();
  };

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setQuestions([]);
    setQSearch('');
    setQPage(0);
    loadQuestions(category, 0, false, '');
  };

  const handleQSearch = (val: string) => {
    if (!selectedCategory) return;
    setQSearch(val);
    setQPage(0);
    loadQuestions(selectedCategory, 0, false, val);
  };

  const handleQLoadMore = () => {
    if (qHasMore && !qLoading && selectedCategory) {
      const next = qPage + 1;
      setQPage(next);
      loadQuestions(selectedCategory, next, true);
    }
  };

  const handleQScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 80) handleQLoadMore();
  };

  // Questions view
  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-[#292349] flex flex-col">
        {/* Header */}
        <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666]">
          <div className="flex items-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg truncate">{selectedCategory}</p>
              <p className="text-white/60 text-xs">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="flex items-center bg-[#342D5B] rounded-xl border border-[#3E3666] px-4">
            <Search size={18} color="#FFFFFF60" className="shrink-0" />
            <input
              value={qSearch}
              onChange={(e) => handleQSearch(e.target.value)}
              placeholder="Rechercher dans les questions..."
              className="flex-1 py-3 px-3 bg-transparent text-white focus:outline-none placeholder-white/40 text-sm"
            />
            {qSearch && (
              <button onClick={() => handleQSearch('')}>
                <X size={16} color="#FFFFFF60" />
              </button>
            )}
          </div>
        </div>

        {/* Questions list */}
        <div className="flex-1 overflow-y-auto px-4" onScroll={handleQScroll}>
          {qLoading && questions.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Spinner text="Chargement..." />
            </div>
          ) : questions.length === 0 ? (
            <Card className="flex items-center justify-center py-12">
              <p className="text-white/50">Aucune question trouvée</p>
            </Card>
          ) : (
            questions.map((q) => {
              const diff = DIFFICULTY_CONFIG[q.difficulty] ?? DIFFICULTY_CONFIG['MEDIUM'];
              return (
                <Card key={q.id} className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${diff.color}20`, color: diff.color }}
                    >
                      {diff.label}
                    </span>
                    {q.isSkipped && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[#F39C1220] text-[#F39C12]">Passée</span>
                    )}
                    <span className="text-white/30 text-xs ml-auto">Session: {q.sessionCode}</span>
                  </div>
                  <p className="text-white text-sm mb-2">{q.text}</p>
                  <div className="flex items-center gap-2 bg-[#00D39710] rounded-lg px-3 py-2 mb-2">
                    <CheckCircle size={13} color="#00D397" />
                    <span className="text-[#00D397] text-sm font-medium">{q.answer}</span>
                  </div>
                  {q.winnerName && (
                    <div className="flex items-center gap-2">
                      <Trophy size={13} color="#FFD700" />
                      <span className="text-[#FFD700] text-xs">Vainqueur : {q.winnerName}</span>
                    </div>
                  )}
                  {q.explanation && (
                    <p className="text-white/40 text-xs mt-2 italic">{q.explanation}</p>
                  )}
                  <p className="text-white/20 text-xs mt-2">{formatDate(q.createdAt)}</p>
                </Card>
              );
            })
          )}

          {qHasMore && !qLoading && (
            <button
              onClick={handleQLoadMore}
              className="w-full py-3 text-[#00D397] text-sm font-medium hover:opacity-80 transition-opacity mb-4"
            >
              Charger plus
            </button>
          )}
          <div className="h-8" />
        </div>
      </div>
    );
  }

  // Categories view
  return (
    <div className="min-h-screen bg-[#292349] flex flex-col">
      {/* Header */}
      <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666]">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-xl">Historique questions</p>
            <p className="text-white/60 text-xs">{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center bg-[#342D5B] rounded-xl border border-[#3E3666] px-4">
          <Search size={18} color="#FFFFFF60" className="shrink-0" />
          <input
            value={catSearch}
            onChange={(e) => handleCatSearch(e.target.value)}
            placeholder="Rechercher une catégorie..."
            className="flex-1 py-3 px-3 bg-transparent text-white focus:outline-none placeholder-white/40 text-sm"
          />
        </div>
      </div>

      {/* Categories list */}
      <div className="flex-1 overflow-y-auto px-4" onScroll={handleCatScroll}>
        {catLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner text="Chargement..." />
          </div>
        ) : categories.length === 0 ? (
          <Card className="flex items-center justify-center py-12">
            <p className="text-white/50">Aucune catégorie trouvée</p>
          </Card>
        ) : (
          categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => handleSelectCategory(cat.category)}
              className="w-full text-left mb-3"
            >
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#4A90D920] flex items-center justify-center shrink-0">
                    <BookOpen size={20} color="#4A90D9" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{cat.category}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-white/50 text-xs">{cat.questionCount} question{cat.questionCount !== 1 ? 's' : ''}</span>
                      <span className="text-white/30 text-xs">Dernière: {formatDate(cat.lastUsedAt)}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#FFFFFF40" />
                </div>
              </Card>
            </button>
          ))
        )}

        {catHasMore && !catLoading && (
          <button
            onClick={handleCatLoadMore}
            className="w-full py-3 text-[#00D397] text-sm font-medium hover:opacity-80 transition-opacity mb-4"
          >
            Charger plus
          </button>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
