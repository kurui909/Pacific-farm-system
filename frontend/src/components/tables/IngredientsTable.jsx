export default function IngredientsTable({ ingredients = [], isLoading }) {
  if (isLoading) {
    return <div className="space-y-2">Loading ingredients...</div>;
  }

  if (!ingredients.length) {
    return <div className="rounded-3xl border bg-white p-6 text-center text-gray-500">No ingredients found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-3xl border bg-white p-4 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left">Ingredient</th>
            <th className="px-3 py-2 text-left">Stock</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((item) => (
            <tr key={item.id || item.name}>
              <td className="px-3 py-2">{item.name}</td>
              <td className="px-3 py-2">{item.stock || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}