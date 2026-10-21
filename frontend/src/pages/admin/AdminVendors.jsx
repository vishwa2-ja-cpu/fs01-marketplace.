import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { errMsg } from '../../utils.js';

export default function AdminVendors() {
  const [status, setStatus] = useState('pending');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/vendors', { params: status ? { status } : {} })
      .then((r) => setVendors(r.data.vendors)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  };
  useEffect(load, [status]);

  const act = async (id, action) => {
    try { await api.patch(`/admin/vendors/${id}/${action}`); load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Vendors</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
          <option value="">All</option>
        </select>
      </div>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
      {loading ? <p className="text-slate-500">Loading…</p> : vendors.length === 0 ? <p className="text-slate-500">No vendors here.</p> : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left"><tr><th className="p-3">Store</th><th>Owner</th><th>Status</th><th>Commission</th><th></th></tr></thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v._id} className="border-t">
                  <td className="p-3">{v.storeName}</td>
                  <td>{v.userId?.name}<br /><span className="text-xs text-slate-500">{v.userId?.email}</span></td>
                  <td>{v.status}</td><td>{v.commissionRate}%</td>
                  <td className="text-right pr-3 space-x-3">
                    {v.status !== 'approved' && <button onClick={() => act(v._id, 'approve')} className="text-green-700">{v.status === 'suspended' ? 'Reinstate' : 'Approve'}</button>}
                    {v.status === 'approved' && <button onClick={() => act(v._id, 'suspend')} className="text-red-600">Suspend</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
