export default function ViewDetailsModal({ isOpen, onClose, details }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
            Close
          </button>
        </div>
        <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-gray-100 p-4 text-sm text-gray-700">
          {JSON.stringify(details || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}