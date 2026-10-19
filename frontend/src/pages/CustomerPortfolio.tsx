import React, { useState, useEffect } from 'react';
import { CustomerRecord, PortfolioResponse } from '../types';
import { fetchPortfolioCustomers, uploadAndPredictBatch, getExportUrl } from '../services/api';
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Info
} from 'lucide-react';

export const CustomerPortfolio: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const [search, setSearch] = useState<string>('');
  const [contractFilter, setContractFilter] = useState<string>('All');
  const [churnFilter, setChurnFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('CustomerID');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, [page, pageSize, contractFilter, churnFilter, sortBy, sortDir]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetchPortfolioCustomers({
        page,
        pageSize,
        search,
        contract: contractFilter,
        churnFilter,
        sortBy,
        sortDir
      });
      setCustomers(res.customers);
      setTotalCount(res.total_count);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Error loading portfolio customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCustomers();
  };

  const handleSortToggle = (column: string) => {
    if (sortBy === column) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const res = await uploadAndPredictBatch(file);
      setUploadResult(res);
    } catch (err: any) {
      setUploadError(err.message || 'File schema validation or prediction error');
    } finally {
      setUploadLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-appBorder pb-6">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-nearBlack bg-softIvory border border-appBorder px-2.5 py-1 rounded">
            Subscriber Ledger &amp; Records
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-nearBlack tracking-tight mt-2">
            Customer Portfolio &amp; Batch Inference
          </h1>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Audit 7,043 actual Telco customer profiles or upload a candidate cohort for automated Decision Tree scoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* File Upload Trigger */}
          <label className="flex items-center gap-2 px-3.5 py-2 bg-warmWhite border border-appBorder rounded-md text-xs font-mono font-bold text-nearBlack hover:bg-softIvory cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-accentYellow" />
            <span>Upload Batch CSV/Excel</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          {/* Export CSV Button */}
          <a
            href={getExportUrl(contractFilter, churnFilter)}
            className="flex items-center gap-2 px-3.5 py-2 bg-accentYellow text-nearBlack rounded-md text-xs font-mono font-bold hover:bg-yellow-400 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export View to CSV</span>
          </a>
        </div>
      </div>

      {/* Batch Upload Modal/Result Banner */}
      {uploadLoading && (
        <div className="p-4 bg-softIvory border border-appBorder rounded-lg flex items-center gap-3 text-xs font-mono text-nearBlack">
          <span className="w-4 h-4 border-2 border-nearBlack border-t-transparent rounded-full animate-spin"></span>
          <span>Validating schema and scoring batch cohort through trained Decision Tree...</span>
        </div>
      )}

      {uploadError && (
        <div className="p-4 bg-accentRed/10 border border-accentRed/30 rounded-lg text-accentRed text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="font-mono text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {uploadResult && (
        <div className="bg-softIvory border-2 border-nearBlack rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-appBorder pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-nearBlack">
                Batch Inference Complete: {uploadResult.total_records} Records Scored
              </h3>
            </div>
            <button
              onClick={() => setUploadResult(null)}
              className="text-xs font-mono text-mutedText hover:text-nearBlack"
            >
              Close [✕]
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-warmWhite border border-appBorder p-3 rounded">
              <span className="text-mutedText block text-[10px]">Predicted Churn Count</span>
              <span className="text-lg font-bold text-accentRed">{uploadResult.churn_count}</span>
            </div>
            <div className="bg-warmWhite border border-appBorder p-3 rounded">
              <span className="text-mutedText block text-[10px]">Predicted Retained Count</span>
              <span className="text-lg font-bold text-nearBlack">{uploadResult.retained_count}</span>
            </div>
            <div className="bg-warmWhite border border-appBorder p-3 rounded">
              <span className="text-mutedText block text-[10px]">Batch Churn Ratio</span>
              <span className="text-lg font-bold text-nearBlack">{uploadResult.predicted_churn_rate}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-warmWhite border border-appBorder rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mutedText" />
          <input
            type="text"
            placeholder="Search Customer ID, City, Payment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-softIvory border border-appBorder rounded text-xs text-nearBlack focus:border-nearBlack outline-none"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-mutedText font-mono">Contract:</span>
            <select
              value={contractFilter}
              onChange={e => {
                setContractFilter(e.target.value);
                setPage(1);
              }}
              className="bg-softIvory border border-appBorder rounded px-2.5 py-1.5 text-xs text-nearBlack outline-none"
            >
              <option value="All">All Contracts</option>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-mutedText font-mono">Historical Label:</span>
            <select
              value={churnFilter}
              onChange={e => {
                setChurnFilter(e.target.value);
                setPage(1);
              }}
              className="bg-softIvory border border-appBorder rounded px-2.5 py-1.5 text-xs text-nearBlack outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Yes">Historical Churn</option>
              <option value="No">Historical Retained</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-mutedText font-mono">Rows:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(parseInt(e.target.value));
                setPage(1);
              }}
              className="bg-softIvory border border-appBorder rounded px-2 py-1.5 text-xs text-nearBlack outline-none"
            >
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-warmWhite border border-appBorder rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-appBorder bg-softIvory/70 text-mutedText font-mono uppercase text-[10px]">
                <th
                  onClick={() => handleSortToggle('CustomerID')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-nearBlack select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">Demographics</th>
                <th
                  onClick={() => handleSortToggle('Tenure Months')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-nearBlack select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Tenure</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">Contract</th>
                <th className="py-3 px-4 font-bold">Internet</th>
                <th
                  onClick={() => handleSortToggle('Monthly Charges')}
                  className="py-3 px-4 font-bold cursor-pointer hover:text-nearBlack select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Monthly</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">Payment</th>
                <th className="py-3 px-4 font-bold text-center">Historical Churn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-appBorder/50 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-mutedText">
                    Loading customer portfolio...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-mutedText">
                    No customers match the active filters.
                  </td>
                </tr>
              ) : (
                customers.map((c, idx) => (
                  <tr key={`cust-${c.CustomerID}-${idx}`} className="hover:bg-softIvory/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-nearBlack">{c.CustomerID}</td>
                    <td className="py-3 px-4 text-mutedText font-sans">
                      {c.Gender}, {c['Senior Citizen'] === 'Yes' ? 'Senior' : 'Adult'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-nearBlack">
                      {c['Tenure Months']} mo
                    </td>
                    <td className="py-3 px-4 font-sans">{c.Contract}</td>
                    <td className="py-3 px-4 font-sans">{c['Internet Service']}</td>
                    <td className="py-3 px-4 font-semibold text-nearBlack">
                      ${c['Monthly Charges'].toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-mutedText font-sans truncate max-w-[140px]" title={c['Payment Method']}>
                      {c['Payment Method']}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c['Churn Label'] === 'Yes'
                            ? 'bg-accentRed/10 text-accentRed border border-accentRed/30'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {c['Churn Label'] === 'Yes' ? 'Churned' : 'Retained'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-appBorder bg-softIvory/30 flex items-center justify-between text-xs font-mono">
          <span className="text-mutedText">
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount} subscribers
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border border-appBorder hover:bg-softIvory disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-nearBlack font-bold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded border border-appBorder hover:bg-softIvory disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
