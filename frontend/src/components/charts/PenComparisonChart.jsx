import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

export default function PenComparisonChart({ data = [], metric = 'both', chartType = 'bar' }) {
  const labels = useMemo(
    () => data.map((item, index) => item.label || item.pen || `Period ${index + 1}`),
    [data]
  );

  const hdData = useMemo(() => data.map((item) => item.hd_percentage ?? item.hd ?? 0), [data]);
  const erData = useMemo(() => data.map((item) => item.er_ratio ?? item.er ?? 0), [data]);

  const datasets = useMemo(() => {
    const selected = [];
    if (metric === 'both' || metric === 'hd') {
      selected.push({
        label: 'H/D%',
        data: hdData,
        backgroundColor: 'rgba(59, 130, 246, 0.65)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: chartType === 'line',
        tension: 0.35,
      });
    }

    if (metric === 'both' || metric === 'er') {
      selected.push({
        label: 'E/R',
        data: erData,
        backgroundColor: 'rgba(16, 185, 129, 0.65)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        fill: chartType === 'line',
        tension: 0.35,
      });
    }

    return selected;
  }, [metric, hdData, erData, chartType]);

  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}`,
        },
      },
    },
  };

  if (chartType === 'line') {
    return <Line data={chartData} options={options} />;
  }

  return <Bar data={chartData} options={options} />;
}