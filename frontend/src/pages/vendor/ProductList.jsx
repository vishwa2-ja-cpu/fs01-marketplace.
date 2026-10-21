import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { rupees, errMsg } from '../../utils.js';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => api.get('/products/mine').then((r) => setProducts(r.data.products)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm('Remove this product?')) return;
    try { await api.delete(`/products/${id}`); load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">My products</h1>
        <Link to="/vendor/products/new" className="bg-indigo-600 text-white rounded px-4 py-2 text-sm hover:bg-indigo-700">Add product</Link>
      </div>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
      {loading ? <p className="text-slate-500">Loading…</p> : products.length === 0 ? <p className="text-slate-500">No products yet.</p> : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left"><tr><th className="p-3">Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden">{p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}</div>
                    {p.title}
                  </td>
                  <td>{p.category}</td><td>{rupees(p.price)}</td><td>{p.stock}</td>
                  <td className="text-right pr-3 space-x-3">
                    <Link to={`/vendor/products/${p._id}/edit`} className="text-indigo-600">Edit</Link>
                    <button onClick={() => remove(p._id)} className="text-red-600">Delete</button>
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
