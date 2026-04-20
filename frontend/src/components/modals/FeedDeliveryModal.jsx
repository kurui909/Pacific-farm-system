export default function FeedDeliveryModal({ isOpen, onClose, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Feed Delivery</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
            Close
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-600">This modal is a placeholder.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Cancel
          </button>
          <button onClick={onSubmit} className="rounded-xl bg-blue-600 px-4 py-2 text-white">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}