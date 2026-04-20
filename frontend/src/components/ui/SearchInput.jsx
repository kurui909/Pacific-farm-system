export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-3xl border px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}