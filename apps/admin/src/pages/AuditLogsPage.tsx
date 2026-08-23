import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ShieldAlert,
  Filter,
  X,
} from 'lucide-react';

import { DataTable, type Column } from '../components/admin/DataTable';
import { adminApi, type AdminAuditLogResponse } from '@xalaat/core';

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

export function AuditLogsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [action, setAction] = useState('');
  const [adminId, setAdminId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
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

  const columns: Column<AdminAuditLogResponse>[] = [
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => (
        <span className="text-txt-60 text-xs">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'adminUsername',
      header: 'Admin',
      render: (row) => (
        <span className="text-txt font-medium">{row.adminUsername}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-host/15 text-host font-medium">
          {row.action}
        </span>
      ),
    },
    {
      key: 'entityType',
      header: "Type d'entité",
      render: (row) => (
        <span className="text-txt-60 text-xs">{row.entityType}</span>
      ),
    },
    {
      key: 'entityId',
      header: 'ID Entité',
      render: (row) => (
        <span className="text-txt-40 text-xs font-mono truncate max-w-[100px] block">
          {row.entityId ?? '—'}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Détails',
      render: (row) => (
        <span className="text-txt-60 text-xs truncate max-w-[200px] block">
          {row.details ? JSON.stringify(row.details) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-txt text-2xl font-bold font-display">Logs d'audit</h1>
          <p className="text-txt-60 text-sm">Traçabilité des actions administratives</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-line text-txt-60 hover:text-txt transition-colors text-xs font-medium cursor-pointer"
        >
          <Filter size={14} />
          Filtres
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-surface rounded-2xl border border-line p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-txt-60 text-xs block mb-1">Action</label>
              <input
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(0);
                }}
                placeholder="Ex : BAN_USER..."
                className="w-full bg-bg text-txt px-3 py-2 rounded-lg border border-line text-xs outline-none focus:border-host"
              />
            </div>
            <div>
              <label className="text-txt-60 text-xs block mb-1">Type d'entité</label>
              <input
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  setPage(0);
                }}
                placeholder="Ex : USER, ROOM..."
                className="w-full bg-bg text-txt px-3 py-2 rounded-lg border border-line text-xs outline-none focus:border-host"
              />
            </div>
            <div>
              <label className="text-txt-60 text-xs block mb-1">ID Admin</label>
              <input
                value={adminId}
                onChange={(e) => {
                  setAdminId(e.target.value);
                  setPage(0);
                }}
                placeholder="UUID admin..."
                className="w-full bg-bg text-txt px-3 py-2 rounded-lg border border-line text-xs outline-none focus:border-host"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setAction('');
                setEntityType('');
                setAdminId('');
                setFrom('');
                setTo('');
                setPage(0);
              }}
              className="text-txt-40 hover:text-txt text-xs cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={(r) => r.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}
