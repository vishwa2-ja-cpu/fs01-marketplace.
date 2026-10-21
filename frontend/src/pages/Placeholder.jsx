// Temporary dashboards. Each is replaced by real pages in later steps.
export default function Placeholder({ title, items }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>
      <ul className="list-disc pl-5 text-slate-600 space-y-1">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}
