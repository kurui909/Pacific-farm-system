export default function AlertBanner({ alert }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-700">
        {alert?.title || 'Alert'}
      </p>
      <p className="mt-2 text-sm text-red-600">
        {alert?.message || alert?.description || 'No alert details available.'}
      </p>
    </div>
  );
}