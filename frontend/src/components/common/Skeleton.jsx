export default function Skeleton({ type = 'card', count = 1 }) {
  const items = Array.from({ length: count });

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {items.map((_, index) => (
          <div
            key={index}
            className="h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((_, index) => (
        <div
          key={index}
          className="h-32 rounded-3xl bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
      ))}
    </div>
  );
}