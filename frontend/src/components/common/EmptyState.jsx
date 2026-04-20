export default function EmptyState({ title = 'No data available', description = 'There is nothing to display right now.' }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}