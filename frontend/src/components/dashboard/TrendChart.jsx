import { useQuery } from '@tanstack/react-query';
import { dashboardService, penService } from '../../services/api';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function TrendChart({ dateRange }) {
  const { theme } = useTheme();
  const [pen, setPen] = useState('all');
  const { data: pens } = useQuery({ queryKey: ['pens'], queryFn: penService.getAll });
  const { data, isLoading } = useQuery({ queryKey: ['trends', dateRange, pen], queryFn: () => dashboardService.getTrends({ period: dateRange, pen_id: pen !== 'all' ? pen : undefined }) });
  const chartData = { labels: data?.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [], datasets: [{ label: 'Eggs', data: data?.map(d => d.eggs) || [], borderColor: 'rgb(59,130,246)', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 }, { label: 'Feed (kg)', data: data?.map(d => d.feed) || [], borderColor: 'rgb(234,179,8)', backgroundColor: 'rgba(234,179,8,0.1)', fill: true, tension: 0.3 }] };
  const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: theme === 'dark' ? '#d1d5db' : '#374151' } } }, scales: { x: { ticks: { color: theme === 'dark' ? '#9ca3af' : '#4b5563' } }, y: { ticks: { color: theme === 'dark' ? '#9ca3af' : '#4b5563' } } } };
  if (isLoading) return <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />;
  return <div className="space-y-2"><select value={pen} onChange={e => setPen(e.target.value)} className="text-sm border rounded px-3 py-1.5"><option value="all">All Pens</option>{pens?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="h-64"><Line data={chartData} options={options} /></div></div>;
}