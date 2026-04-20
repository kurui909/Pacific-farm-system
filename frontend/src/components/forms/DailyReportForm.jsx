// src/components/forms/DailyReportForm.jsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DailyReportForm({ isOpen, onClose, pens, productionRecords }) {
  const [selectedPen, setSelectedPen] = useState('');
  const [reportData, setReportData] = useState(null);

  const generateReport = () => {
    if (!selectedPen) {
      toast.error('Please select a pen');
      return;
    }
    const records = productionRecords.filter(r => r.pen_id === selectedPen);
    const totalEggs = records.reduce((sum, r) => sum + (r.total_eggs || 0), 0);
    const totalFeed = records.reduce((sum, r) => sum + (r.feed_kg || 0), 0);
    setReportData({ records, totalEggs, totalFeed });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold">Daily Report by Block</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Pen</label>
            <select
              value={selectedPen}
              onChange={(e) => setSelectedPen(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="">Choose a pen</option>
              {pens.map(pen => (
                <option key={pen.id} value={pen.id}>{pen.name}</option>
              ))}
            </select>
          </div>
          <button onClick={generateReport} className="btn-primary w-full">Generate Report</button>
          {reportData && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p><strong>Total Eggs:</strong> {reportData.totalEggs}</p>
              <p><strong>Total Feed (kg):</strong> {reportData.totalFeed}</p>
              <p><strong>Records:</strong> {reportData.records.length} entries</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}