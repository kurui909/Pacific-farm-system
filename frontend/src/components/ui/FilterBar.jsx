export default function FilterBar({ children }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border bg-white p-4 shadow-sm">
      {children || <span className="text-sm text-gray-500">Filter options will appear here.</span>}
    </div>
  );
}