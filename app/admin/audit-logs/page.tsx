'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ShieldAlert,
  Filter,
  X,
} from 'lucide-react';

import { DataTable } from '~/components/admin/DataTable';
import * as adminApi from '~/lib/api/admin';
import type { AdminAuditLogResponse } from '~/types/api';

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [action, setAction] = useState('');
  const [adminId, setAdminId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['adminAuditLogs', page, action, adminId, entityType, from, to],
    queryFn: () =>
      adminApi.getAdminAuditLogs({
        page,
        size: PAGE_SIZE,
        action: action || undefined,
        adminId: adminId || undefined,
        entityType: entityType || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const logs = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const columns = [
    {
      key: 'createdAt',
      header: 'Date',
      render: (row: AdminAuditLogResponse) => (
        <span className="text-white/70 text-xs">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'adminUsername',
      header: 'Admin',
      render: (row: AdminAuditLogResponse) => (
        <span className="text-white font-medium">{row.adminUsername}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row: AdminAuditLogResponse) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#9B59B620] text-[#9B59B6] font-medium">
          {row.action}
        </span>
      ),
    },
    {
      key: 'entityType',
      header: "Type d'entité",
      render: (row: AdminAuditLogResponse) => (
        <span className="text-white/60 text-xs">{row.entityType}</span>
      ),
    },
    {
      key: 'entityId',
      header: 'ID Entité',
      render: (row: AdminAuditLogResponse) => (
        <span className="text-white/40 text-xs font-mono truncate max-w-[100px] block">
          {row.entityId ?? '—'}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Détails',
      render: (row: AdminAuditLogResponse) => (
        <span className="text-white/50 text-xs line-clamp-2">
          {row.details ? JSON.stringify(row.details) : '—'}
        </span>
      ),
    },
  ];

  const hasActiveFilters = action || adminId || entityType || from || to;

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
            <p className="text-white font-bold text-xl">Audit Logs</p>
            <p className="text-white/60 text-xs">
              {data?.totalElements ?? 0} entrée{(data?.totalElements ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="text-[#00D397] text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            {isLoading ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-[#9B59B6] border-[#9B59B6] text-white'
                : 'bg-[#342D5B] border-[#3E3666] text-white/70 hover:text-white'
            }`}
          >
            <Filter size={15} />
            Filtres
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white" />}
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setAction('');
                setAdminId('');
                setEntityType('');
                setFrom('');
                setTo('');
                setPage(0);
              }}
              className="flex items-center gap-1 text-white/50 hover:text-white text-sm transition-colors"
            >
              <X size={14} />
              Réinitialiser
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-[#342D5B] rounded-xl border border-[#3E3666] px-4 py-2">
              <label className="text-white/40 text-xs block mb-1">Action</label>
              <input
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(0);
                }}
                placeholder="ex: DELETE"
                className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-white/30"
              />
            </div>
            <div className="bg-[#342D5B] rounded-xl border border-[#3E3666] px-4 py-2">
              <label className="text-white/40 text-xs block mb-1">Admin ID</label>
              <input
                value={adminId}
                onChange={(e) => {
                  setAdminId(e.target.value);
                  setPage(0);
                }}
                placeholder="ID admin..."
                className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-white/30"
              />
            </div>
            <div className="bg-[#342D5B] rounded-xl border border-[#3E3666] px-4 py-2">
              <label className="text-white/40 text-xs block mb-1">Type d'entité</label>
              <input
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  setPage(0);
                }}
                placeholder="ex: USER"
                className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-white/30"
              />
            </div>
            <div className="bg-[#342D5B] rounded-xl border border-[#3E3666] px-4 py-2">
              <label className="text-white/40 text-xs block mb-1">Depuis</label>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(0);
                }}
                className="w-full bg-transparent text-white text-sm focus:outline-none"
              />
            </div>
            <div className="bg-[#342D5B] rounded-xl border border-[#3E3666] px-4 py-2">
              <label className="text-white/40 text-xs block mb-1">Jusqu'à</label>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(0);
                }}
                className="w-full bg-transparent text-white text-sm focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 p-4 overflow-y-auto">
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(row) => row.id}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
