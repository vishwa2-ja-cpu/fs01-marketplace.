export default function FormField({ label, ...props }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">{label}</span>
      <input
        {...props}
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </label>
  );
}
