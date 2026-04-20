export default function ViewToggle({ value, onChange, options = [] }) {
  return (
    <div className="inline-flex rounded-3xl border bg-white p-2 shadow-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange?.(option.value)}
          className={`rounded-full px-4 py-2 text-sm transition ${
            value === option.value ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}