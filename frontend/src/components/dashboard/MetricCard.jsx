export default function MetricCard({ title, value, icon: Icon, color }) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        {Icon ? <Icon className="h-8 w-8 text-gray-700" /> : null}
      </div>
    </div>
  );
}