import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import FormField from '../../components/FormField.jsx';
import { errMsg } from '../../utils.js';

const statusStyle = { pending: 'bg-amber-100 text-amber-800', approved: 'bg-green-100 text-green-800', suspended: 'bg-red-100 text-red-800' };

export default function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ storeName: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/vendors/me').then((r) => setVendor(r.data.vendor)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const apply = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/vendors/apply', form);
      setVendor(data.vendor);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (loading) return <p className="p-8 text-center text-slate-500">Loading…</p>;

  if (!vendor) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white border rounded-lg p-6">
        <h1 className="text-xl font-semibold mb-1">Open your store</h1>
        <p className="text-sm text-slate-500 mb-4">An admin reviews every new store before it can sell.</p>
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
        <form onSubmit={apply}>
          <FormField label="Store name" required value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
          <label className="block mb-4">
            <span className="block text-sm font-medium mb-1">Description</span>
            <textarea rows={3} className="w-full border rounded px-3 py-2" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <button className="w-full bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700">Submit application</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-semibold">{vendor.storeName}</h1>
        <span className={`text-xs rounded px-2 py-0.5 ${statusStyle[vendor.status]}`}>{vendor.status}</span>
      </div>
      <p className="text-slate-500 mb-6">{vendor.description}</p>
      {vendor.status === 'approved' ? (
        <div className="flex gap-3">
          <Link to="/vendor/products" className="bg-indigo-600 text-white rounded px-4 py-2 hover:bg-indigo-700">My products</Link>
          <Link to="/vendor/products/new" className="border rounded px-4 py-2 hover:bg-slate-100">Add product</Link>
        </div>
      ) : (
        <p className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
          {vendor.status === 'pending' ? 'Your application is waiting for admin approval.' : 'Your store is suspended. Contact the platform admin.'}
        </p>
      )}
    </div>
  );
}
