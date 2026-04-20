export default function TraySaleForm({ onSubmit }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="space-y-4 rounded-3xl border bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold">Tray Sale Form</h2>
      <p className="text-sm text-gray-600">This form is a placeholder.</p>
      <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-white">
        Save
      </button>
    </form>
  );
}