export default function MixesTable({ mixes = [], isLoading }) {
  if (isLoading) {
    return <div className="space-y-2">Loading mixes...</div>;
  }

  if (!mixes.length) {
    return <div className="rounded-3xl border bg-white p-6 text-center text-gray-500">No mixes found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-3xl border bg-white p-4 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left">Mix Name</th>
            <th className="px-3 py-2 text-left">Total kg</th>
          </tr>
        </thead>
        <tbody>
          {mixes.map((mix) => (
            <tr key={mix.id || mix.name}>
              <td className="px-3 py-2">{mix.name}</td>
              <td className="px-3 py-2">{mix.total_kg || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}