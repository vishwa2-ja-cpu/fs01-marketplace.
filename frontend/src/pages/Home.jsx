import { useEffect, useState } from 'react';
import api from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Home() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products', { params: { limit: 12 } }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Latest products</h1>
      <p className="text-slate-500 mb-6 text-sm">Search, filters and cart arrive in the next steps.</p>
      {loading ? <p className="text-slate-500">Loading…</p> : data.items.length === 0 ? (
        <p className="text-slate-500">No products yet. Sign up as a vendor, get approved by an admin, and add some.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.items.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
