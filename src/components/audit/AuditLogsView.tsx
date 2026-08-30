import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  ShieldAlert,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { exportToCsv } from '../../utils/export';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.action.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          (log.ipAddress && log.ipAddress.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [auditLogs, actionFilter, searchQuery]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.action)));
  }, [auditLogs]);

  const handleExportCsv = () => {
    const rows = [
      ['Timestamp', 'User', 'Role', 'Action', 'Target Entity', 'Details', 'IP Address'],
      ...filteredLogs.map((l) => [
        new Date(l.timestamp).toLocaleString(),
        l.userName,
        l.userRole,
        l.action,
        l.targetEntity,
        l.details,
        l.ipAddress || 'internal',
      ]),
    ];
    exportToCsv('system_audit_trail_log', rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Immutable System Audit Trail & Activity Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete chronological records of all transactions, stock alterations, payments, and system events.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#161616] hover:bg-white/5 border border-white/10 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Trail CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-[#161616] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail by user, action, transaction details, or IP..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#111111] border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-[#111111] border border-white/10 rounded-lg text-slate-200 focus:outline-none transition-colors"
        >
          <option value="ALL" className="bg-[#111111]">All Event Types</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a} className="bg-[#111111]">
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#161616] border border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-[#111111] text-slate-500 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Staff Operator</th>
                <th className="py-3 px-4 font-medium">Action Event</th>
                <th className="py-3 px-4 font-medium">Entity</th>
                <th className="py-3 px-4 font-medium">Event Description / Payload Details</th>
                <th className="py-3 px-4 font-medium text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-white">{log.userName}</p>
                      <span className="text-[10px] font-mono text-indigo-400">{log.userRole}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-md font-mono bg-white/5 text-slate-300 border border-white/10">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{log.targetEntity}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-md break-words">{log.details}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-right text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
