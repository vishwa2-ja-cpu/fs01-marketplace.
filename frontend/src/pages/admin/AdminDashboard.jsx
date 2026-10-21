import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Admin dashboard</h1>
      <div className="flex gap-3 mb-6">
        <Link to="/admin/vendors" className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700">Manage vendors</Link>
      </div>
      <p className="text-slate-500 text-sm">Coming later: commission settings (Step 6), coupons and analytics (Step 7).</p>
    </div>
  );
}
