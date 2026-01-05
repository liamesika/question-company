'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, Button, TextInput } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface User {
  userIdentifier: string;
  userDisplayName: string | null;
  totalSubmissions: number;
  lastSubmissionDate: string | null;
  latestRiskLevel: string | null;
  latestChaosScore: number | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const getRiskColor = (risk: string | null) => {
  switch (risk) {
    case 'LOW':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'HIGH':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'CRITICAL':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const isEmail = (identifier: string) => identifier.includes('@');

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('lastSubmission');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleUserClick = (identifier: string) => {
    router.push(`/admin/users/${encodeURIComponent(identifier)}`);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-white/50 mt-1">
            {pagination.total} unique users
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 max-w-md">
          <TextInput
            type="text"
            placeholder="Search by email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/50">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left">
                    <button
                      onClick={() => handleSort('identifier')}
                      className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium"
                    >
                      User
                      <SortIcon field="identifier" />
                    </button>
                  </th>
                  <th className="px-4 py-4 text-left">
                    <button
                      onClick={() => handleSort('totalSubmissions')}
                      className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium"
                    >
                      Submissions
                      <SortIcon field="totalSubmissions" />
                    </button>
                  </th>
                  <th className="px-4 py-4 text-left hidden md:table-cell">
                    <button
                      onClick={() => handleSort('lastSubmission')}
                      className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium"
                    >
                      Last Submission
                      <SortIcon field="lastSubmission" />
                    </button>
                  </th>
                  <th className="px-4 py-4 text-left hidden sm:table-cell">
                    <span className="text-white/70 text-sm font-medium">Risk Level</span>
                  </th>
                  <th className="px-4 py-4 text-left hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('chaosScore')}
                      className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium"
                    >
                      Chaos Score
                      <SortIcon field="chaosScore" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.userIdentifier}
                    onClick={() => handleUserClick(user.userIdentifier)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                          {isEmail(user.userIdentifier) ? (
                            <Mail className="w-5 h-5 text-accent-primary" />
                          ) : (
                            <Phone className="w-5 h-5 text-accent-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium truncate max-w-[200px]">
                            {user.userDisplayName || user.userIdentifier}
                          </p>
                          {user.userDisplayName && (
                            <p className="text-white/50 text-sm truncate max-w-[200px]">
                              {user.userIdentifier}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{user.totalSubmissions}</span>
                        <span className="text-white/50 text-sm">
                          {user.totalSubmissions === 1 ? 'submission' : 'submissions'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      {user.lastSubmissionDate ? (
                        <div className="flex items-center gap-2 text-white/70">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(user.lastSubmissionDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      {user.latestRiskLevel ? (
                        <span
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium border',
                            getRiskColor(user.latestRiskLevel)
                          )}
                        >
                          {user.latestRiskLevel}
                        </span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {user.latestChaosScore !== null ? (
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="text-white font-semibold">{user.latestChaosScore}</span>
                        </div>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white/70 text-sm px-3">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="ghost"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
