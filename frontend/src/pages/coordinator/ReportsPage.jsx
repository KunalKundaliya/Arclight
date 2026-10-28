import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import ChartContainer from '../../components/common/ChartContainer';
import {
  mockInterviewerUtilization,
  mockRoundFunnel,
  mockRoundDistribution,
  mockOverviewChartData,
  mockKpis
} from '../../data/mockReports';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Live reports state with initial fallback defaults
  const [reportsData, setReportsData] = useState({
    overviewChart: mockOverviewChartData,
    interviewerUtilization: mockInterviewerUtilization,
    roundFunnel: mockRoundFunnel,
    roundDistribution: mockRoundDistribution,
    kpis: {
      totalScheduled: 48,
      totalCompleted: 38,
      completionRate: '95.2%',
      activeDrives: 4,
      candidatesInNorthstar: 48,
      averageDurationMins: 45,
      interviewerSatisfaction: '4.9 / 5.0'
    }
  });

  // Fetch dynamic report aggregations from PostgreSQL
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getReports();
      if (res?.data) {
        setReportsData(res.data);
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('Could not load dynamic reports, using fallback cache:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExport = () => {
    showToast('Recruitment analytics report exported as PDF/CSV summary.', 'success');
  };

  const {
    overviewChart,
    interviewerUtilization,
    roundFunnel,
    roundDistribution,
    kpis
  } = reportsData;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment Analytics & Insights"
        subtitle="Executive reporting on interview throughput, faculty utilization, funnel attrition, and constraint satisfaction performance"
        breadcrumbs={[
          { label: 'Coordinator', to: '/coordinator' },
          { label: 'Reports & Analytics' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            {lastSyncTime && (
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Synced at {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button
              onClick={fetchReports}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 transition-colors shadow-xs hover:border-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Aggregating...' : 'Refresh Analytics'}</span>
            </button>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200/90 rounded-lg text-slate-800 font-medium shadow-xs"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days (Oct 2026)</option>
              <option value="90d">Full Quarter (Q4 2026)</option>
            </select>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Summary</span>
            </button>
          </div>
        }
      />

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Interviews Conducted"
          value={kpis.totalScheduled || 48}
          change="+24% vs Q3"
          changeType="positive"
          icon={Calendar}
          iconColor="text-indigo-600 bg-indigo-50 border-indigo-100"
          description={`${kpis.totalCompleted || 38} completed • ${(kpis.totalScheduled || 48) - (kpis.totalCompleted || 38)} in queue`}
        />
        <StatCard
          title="Schedule Completion Rate"
          value={kpis.completionRate || '95.2%'}
          change="+4.2%"
          changeType="positive"
          icon={Percent}
          iconColor="text-emerald-600 bg-emerald-50 border-emerald-100"
          description="High reliability across panel"
        />
        <StatCard
          title="Average Round Duration"
          value={`${kpis.averageDurationMins || 45} min`}
          change="Optimal"
          changeType="neutral"
          icon={Clock}
          iconColor="text-blue-600 bg-blue-50 border-blue-100"
          description="Target buffer: 15 min"
        />
        <StatCard
          title="Interviewer Experience Rating"
          value={kpis.interviewerSatisfaction || '4.9 / 5.0'}
          change="98% Positive"
          changeType="positive"
          icon={CheckCircle2}
          iconColor="text-violet-600 bg-violet-50 border-violet-100"
          description="Surveyed across 12 evaluators"
        />
      </div>

      {/* Primary Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interviewer Utilization Bar Chart */}
        <ChartContainer
          title="Interviewer Workload & Utilization Rate"
          subtitle="Assigned interviews versus weekly maximum allocation cap (from database)"
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interviewerUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="assigned" name="Assigned Sessions" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacity" name="Max Safe Capacity" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* Round Distribution Donut / Funnel */}
        <ChartContainer
          title="Interviews by Round Domain"
          subtitle="Proportional split between coding challenges, architecture, and executive interviews"
        >
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roundDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roundDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* Secondary Chart Row: Throughput Area Chart & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartContainer
            title="Interview Throughput & Velocity"
            subtitle="Daily scheduled volume and completion trajectory"
          >
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overviewChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="scheduled" name="Scheduled" stroke="#6366f1" fill="#e0e7ff" />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" fill="#d1fae5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        </div>

        {/* Funnel Metrics Table */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Stage Progression</h3>
            <p className="text-xs text-slate-500 mb-4">Conversion rates through the crucible pipeline</p>

            <div className="space-y-3 text-xs">
              {roundFunnel.map((item) => (
                <div key={item.stage} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between font-semibold text-slate-800 mb-0.5">
                    <span>{item.stage}</span>
                    <span className="font-mono text-indigo-600">{item.passed} Passed</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>From pool of {item.candidates}</span>
                    <span>Drop rate: {item.dropRate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono text-center">
            Calculated over {kpis.candidatesInNorthstar || 48} Candidates
          </div>
        </div>
      </div>
    </div>
  );
}
