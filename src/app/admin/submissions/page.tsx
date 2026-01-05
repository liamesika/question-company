'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard, Button } from '@/components/ui';
import { SubmissionsTable } from '@/components/admin/SubmissionsTable';
import { SubmissionFilters, defaultFilters, FilterState } from '@/components/admin/SubmissionFilters';
import { ChevronLeft, ChevronRight, Download, Trash2, RefreshCw } from 'lucide-react';

interface Submission {
  id: string;
  createdAt: string;
  chaosScore: number;
  riskLevel: string;
  q2: string;
  q8: string;
  deviceType: string | null;
  country: string | null;
  status: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function parseFiltersFromURL(searchParams: URLSearchParams): FilterState {
  return {
    search: searchParams.get('search') || '',
    riskLevel: searchParams.get('riskLevel')?.split(',').filter(Boolean) || [],
    status: searchParams.get('status')?.split(',').filter(Boolean) || [],
    deviceType: searchParams.get('deviceType')?.split(',').filter(Boolean) || [],
    chaosScoreMin: searchParams.get('chaosScoreMin') || '',
    chaosScoreMax: searchParams.get('chaosScoreMax') || '',
    q8: searchParams.get('q8')?.split(',').filter(Boolean) || [],
    country: searchParams.get('country') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  };
}

function filtersToURLParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.riskLevel.length) params.set('riskLevel', filters.riskLevel.join(','));
  if (filters.status.length) params.set('status', filters.status.join(','));
  if (filters.deviceType.length) params.set('deviceType', filters.deviceType.join(','));
  if (filters.chaosScoreMin) params.set('chaosScoreMin', filters.chaosScoreMin);
  if (filters.chaosScoreMax) params.set('chaosScoreMax', filters.chaosScoreMax);
  if (filters.q8.length) params.set('q8', filters.q8.join(','));
  if (filters.country) params.set('country', filters.country);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  return params;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const initialFilters = useMemo(() => parseFiltersFromURL(searchParams), [searchParams]);
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSortBy = searchParams.get('sortBy') || 'createdAt';
  const initialSortOrder = searchParams.get('sortOrder') || 'desc';

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: initialPage,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: FilterState, newPage: number, newSortBy: string, newSortOrder: string) => {
    const params = filtersToURLParams(newFilters);
    if (newPage > 1) params.set('page', newPage.toString());
    if (newSortBy !== 'createdAt') params.set('sortBy', newSortBy);
    if (newSortOrder !== 'desc') params.set('sortOrder', newSortOrder);

    const queryString = params.toString();
    const newURL = queryString ? `/admin/submissions?${queryString}` : '/admin/submissions';
    router.replace(newURL, { scroll: false });
  }, [router]);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });

      if (filters.search) params.set('search', filters.search);
      if (filters.riskLevel.length) params.set('riskLevel', filters.riskLevel.join(','));
      if (filters.status.length) params.set('status', filters.status.join(','));
      if (filters.deviceType.length) params.set('deviceType', filters.deviceType.join(','));
      if (filters.chaosScoreMin) params.set('chaosScoreMin', filters.chaosScoreMin);
      if (filters.chaosScoreMax) params.set('chaosScoreMax', filters.chaosScoreMax);
      if (filters.q8.length) params.set('q8', filters.q8.join(','));
      if (filters.country) params.set('country', filters.country);
      if (filters.startDate) params.set('startDate', new Date(filters.startDate).toISOString());
      if (filters.endDate) params.set('endDate', new Date(filters.endDate).toISOString());

      const response = await fetch(`/api/admin/submissions?${params}`);
      const data = await response.json();

      setSubmissions(data.submissions || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleSort = (field: string) => {
    const newSortOrder = sortBy === field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc';
    const newSortBy = field;
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    updateURL(filters, pagination.page, newSortBy, newSortOrder);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    updateURL(newFilters, 1, sortBy, sortOrder);
  };

  const handleFilterReset = () => {
    setFilters(defaultFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    router.replace('/admin/submissions', { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    updateURL(filters, newPage, sortBy, sortOrder);
  };

  const handleStatusChange = async (ids: string[], status: string) => {
    try {
      await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'status', value: status }),
      });
      fetchSubmissions();
      setSelectedIds([]);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} submission(s)?`)) return;

    try {
      await fetch('/api/admin/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'delete' }),
      });
      fetchSubmissions();
      setSelectedIds([]);
    } catch (error) {
      console.error('Error deleting submissions:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();
      params.set('format', format);
      if (selectedIds.length > 0) {
        params.set('ids', selectedIds.join(','));
      } else {
        // Apply current filters
        if (filters.riskLevel.length) params.set('riskLevel', filters.riskLevel.join(','));
        if (filters.status.length) params.set('status', filters.status.join(','));
        if (filters.startDate) params.set('startDate', new Date(filters.startDate).toISOString());
        if (filters.endDate) params.set('endDate', new Date(filters.endDate).toISOString());
      }

      const response = await fetch(`/api/admin/export?${params}`);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Submissions</h1>
          <p className="text-white/50 mt-1">
            {pagination.total} total submissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExport('json')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <SubmissionFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <GlassCard className="p-4 flex items-center justify-between">
          <span className="text-white/70">
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-3">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleStatusChange(selectedIds, e.target.value);
                  e.target.value = '';
                }
              }}
              className="px-3 py-2 rounded-lg glass-card text-white text-sm focus:outline-none"
            >
              <option value="">Set status...</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="DISQUALIFIED">DISQUALIFIED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <Button
              variant="ghost"
              onClick={() => handleDelete(selectedIds)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Table */}
      <GlassCard className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <SubmissionsTable
            submissions={submissions}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
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
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white/70 text-sm px-3">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="ghost"
              onClick={() => handlePageChange(pagination.page + 1)}
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
