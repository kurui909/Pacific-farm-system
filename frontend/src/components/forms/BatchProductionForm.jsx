import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productionService } from '../../services/api';
import { X, Loader2 } from 'lucide-react';

export default function BatchProductionForm({ isOpen, onClose, onSubmit, isSubmitting, pens, defaultDate }) {
  const [date, setDate] = useState(defaultDate);
  const [staff, setStaff] = useState('');
  const [entries, setEntries] = useState({});
  const { data: prevClosing } = useQuery({ queryKey: ['prevClosing', date], queryFn: async () => { const prev = new Date(date); prev.setDate(prev.getDate()-1); const recs = await productionService.getAll({ end_date: prev.toISOString().split('T')[0] }); return Object.fromEntries(recs.map(r => [r.pen_id, r.closing_stock])); }, enabled: isOpen && !!date });

  useEffect(() => { if (pens) { const init = {}; pens.forEach(p => { init[p.id] = { pen_id: p.id, opening_stock: prevClosing?.[p.id] || 0, closing_stock: '', feed_kg: '', good_eggs: '', damaged_eggs: '', small_eggs: '', double_yolk_eggs: '', soft_shell_eggs: '', shells: '' }; }); setEntries(init); } }, [pens, prevClosing]);

  const update = (penId, field, val) => setEntries(prev => ({ ...prev, [penId]: { ...prev[penId], [field]: val } }));
  const totals = useMemo(() => Object.values(entries).reduce((acc, e) => { acc.feed += Number(e.feed_kg)||0; acc.eggs += (Number(e.good_eggs)||0)+(Number(e.damaged_eggs)||0)+(Number(e.small_eggs)||0)+(Number(e.double_yolk_eggs)||0)+(Number(e.soft_shell_eggs)||0); return acc; }, { feed:0, eggs:0 }), [entries]);

  const handleSubmit = (e) => { e.preventDefault(); const payload = { date, staff_name: staff, entries: Object.values(entries).map(e => ({ ...e, opening_stock: Number(e.opening_stock)||0, closing_stock: Number(e.closing_stock)||0, feed_kg: Number(e.feed_kg)||0, good_eggs: Number(e.good_eggs)||0, damaged_eggs: Number(e.damaged_eggs)||0, small_eggs: Number(e.small_eggs)||0, double_yolk_eggs: Number(e.double_yolk_eggs)||0, soft_shell_eggs: Number(e.soft_shell_eggs)||0, shells: Number(e.shells)||0 })) }; onSubmit(payload); };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-7xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Batch Production</h3><button onClick={onClose}><X size={20} /></button></div>
          <div className="flex gap-4 mb-4"><input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded p-2" /><input placeholder="Staff" value={staff} onChange={e => setStaff(e.target.value)} className="border rounded p-2" /></div>
          <table className="w-full text-sm"><thead><tr><th>Pen</th><th>Opening</th><th>Closing</th><th>Feed(kg)</th><th>Good</th><th>Damaged</th><th>Small</th><th>D/Yolk</th><th>S/Shell</th><th>Shells</th></tr></thead>
            <tbody>{pens?.map(pen => { const e = entries[pen.id] || {}; return (<tr key={pen.id}><td>{pen.name}</td><td><input type="number" value={e.opening_stock} onChange={ev => update(pen.id, 'opening_stock', ev.target.value)} className="w-20 border rounded" /></td><td><input type="number" value={e.closing_stock} onChange={ev => update(pen.id, 'closing_stock', ev.target.value)} className="w-20 border rounded" /></td><td><input type="number" step="0.1" value={e.feed_kg} onChange={ev => update(pen.id, 'feed_kg', ev.target.value)} className="w-20 border rounded" /></td><td><input type="number" value={e.good_eggs} onChange={ev => update(pen.id, 'good_eggs', ev.target.value)} className="w-16 border rounded" /></td><td><input type="number" value={e.damaged_eggs} onChange={ev => update(pen.id, 'damaged_eggs', ev.target.value)} className="w-16 border rounded" /></td><td><input type="number" value={e.small_eggs} onChange={ev => update(pen.id, 'small_eggs', ev.target.value)} className="w-16 border rounded" /></td><td><input type="number" value={e.double_yolk_eggs} onChange={ev => update(pen.id, 'double_yolk_eggs', ev.target.value)} className="w-16 border rounded" /></td><td><input type="number" value={e.soft_shell_eggs} onChange={ev => update(pen.id, 'soft_shell_eggs', ev.target.value)} className="w-16 border rounded" /></td><td><input type="number" value={e.shells} onChange={ev => update(pen.id, 'shells', ev.target.value)} className="w-16 border rounded" /></td></tr>); })}</tbody>
            <tfoot><tr><td colSpan={3}>Totals</td><td>{totals.feed.toFixed(2)} kg</td><td colSpan={6}>{totals.eggs} eggs</td></tr></tfoot>
          </table>
          <div className="flex justify-end gap-3 mt-4"><button onClick={onClose} className="btn-secondary">Cancel</button><button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary">{isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit'}</button></div>
        </div>
      </div>
    </div>
  );
}