import { useState } from 'react';
import { Download, FileText, CalendarDays, Sparkles, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import { reportsService } from '../../services/api';

const reportTypes = [
  {
    value: 'sales',
    title: 'Sales Report',
    description: 'Revenue, items sold, and performance metrics for the selected range.',
  },
  {
    value: 'inventory',
    title: 'Inventory Report',
    description: 'Stock levels, replenishment status, and inventory trends.',
  },
  {
    value: 'activity',
    title: 'Activity Report',
    description: 'Recent farm activity, operations, and user actions.',
  },
];

const reportRanges = [
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'quarter', label: 'Last 90 days' },
];

const downloadBlob = (blobData, fileName, mimeType) => {
  const url = window.URL.createObjectURL(new Blob([blobData], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [selectedRange, setSelectedRange] = useState('month');
  const [isLoading, setIsLoading] = useState(false);

  const activeReport = reportTypes.find((item) => item.value === selectedReport);

  const handleExport = async (format) => {
    setIsLoading(true);
    try {
      const params = {
        report_type: selectedReport,
        date_range: selectedRange,
      };

      const response =
        format === 'pdf'
          ? await reportsService.generatePDF(params)
          : await reportsService.generateCSV(params);

      const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';
      const extension = format === 'pdf' ? 'pdf' : 'csv';
      downloadBlob(
        response.data,
        `smartpoultry-${selectedReport}-${selectedRange}.${extension}`,
        mimeType
      );

      toast.success(`${format === 'pdf' ? 'PDF' : 'CSV'} generated successfully`);
    } catch (error) {
      toast.error('Unable to generate report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Reports"
        subtitle="Generate farm reports and export them as PDF or CSV."
        icon={FileText}
        actions={[
          {
            label: 'Download CSV',
            icon: Download,
            onClick: () => handleExport('csv'),
            disabled: isLoading,
          },
          {
            label: 'Download PDF',
            icon: FileText,
            onClick: () => handleExport('pdf'),
            disabled: isLoading,
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-black/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Report builder
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                Create custom farm reports
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <CalendarDays size={16} />
              {reportRanges.find((item) => item.value === selectedRange)?.label}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-5 dark:border-slate-700/80 dark:bg-slate-900">
              <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Report type
              </label>
              <div className="space-y-3">
                {reportTypes.map((report) => (
                  <button
                    key={report.value}
                    type="button"
                    onClick={() => setSelectedReport(report.value)}
                    className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                      selectedReport === report.value
                        ? 'border-blue-600 bg-blue-50 text-slate-900 dark:border-blue-500 dark:bg-blue-950 dark:text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{report.title}</div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {report.description}
                        </p>
                      </div>
                      <ChevronDown size={18} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-5 dark:border-slate-700/80 dark:bg-slate-900">
              <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Date range
              </label>
              <div className="space-y-3">
                {reportRanges.map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() => setSelectedRange(range.value)}
                    className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                      selectedRange === range.value
                        ? 'border-blue-600 bg-white text-slate-900 dark:border-blue-500 dark:bg-blue-950 dark:text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{range.label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {range.value}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-700/80 dark:bg-slate-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Report preview
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                  {activeReport.title}
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <FileText size={16} />
                Export ready
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700/80 dark:bg-slate-900">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Selected report
                </h4>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  {activeReport.description}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700/80 dark:bg-slate-900">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Output format
                </h4>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Download this report as PDF or CSV for bookkeeping and sharing.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={16} />
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                <Download size={16} />
                Download CSV
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-black/20">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Report tips
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700/70 dark:bg-slate-900">
                Use PDF for presentations and CSV for spreadsheet analysis.
              </li>
              <li className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700/70 dark:bg-slate-900">
                Choose a longer date range when comparing seasonal results.
              </li>
              <li className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700/70 dark:bg-slate-900">
                Save reports locally for quick audit-ready access.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-slate-50 p-6 dark:border-slate-700/80 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
              <Sparkles size={18} />
              <div>
                <p className="text-sm font-semibold">What’s next?</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Add custom report filters and team sharing soon.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

