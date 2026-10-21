import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client.js';
import { uploadImage } from '../../api/upload.js';
import FormField from '../../components/FormField.jsx';
import { errMsg } from '../../utils.js';

const empty = { title: '', description: '', category: '', price: '', stock: '', images: [] };

export default function ProductForm() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/products/${id}`).then(({ data }) => {
      const p = data.product;
      setForm({ title: p.title, description: p.description, category: p.category, price: p.price, stock: p.stock, images: p.images });
    }).catch((e) => setError(errMsg(e)));
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onFiles = async (e) => {
    setError('');
    setUploading(true);
    try {
      const urls = [];
      for (const file of e.target.files) urls.push(await uploadImage(file));
      setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, 8) }));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const body = { ...form, price: Number(form.price), stock: Number(form.stock) };
    try {
      if (id) await api.patch(`/products/${id}`, body);
      else await api.post('/products', body);
      navigate('/vendor/products');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 mb-16 bg-white border rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit product' : 'Add product'}</h1>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
      <form onSubmit={submit}>
        <FormField label="Title" required value={form.title} onChange={set('title')} />
        <label className="block mb-4">
          <span className="block text-sm font-medium mb-1">Description</span>
          <textarea rows={4} className="w-full border rounded px-3 py-2" value={form.description} onChange={set('description')} />
        </label>
        <FormField label="Category (e.g. electronics)" required value={form.category} onChange={set('category')} />
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Price (₹)" type="number" min="1" step="0.01" required value={form.price} onChange={set('price')} />
          <FormField label="Stock" type="number" min="0" step="1" required value={form.stock} onChange={set('stock')} />
        </div>

        <div className="mb-4">
          <span className="block text-sm font-medium mb-1">Images (JPG/PNG/WebP, max 5 MB each)</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFiles} disabled={uploading} />
          {uploading && <p className="text-sm text-slate-500 mt-1">Uploading…</p>}
          <div className="flex gap-2 mt-2 flex-wrap">
            {form.images.map((url) => (
              <div key={url} className="relative w-20 h-20 border rounded overflow-hidden">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((u) => u !== url) })}
                  className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1.5">×</button>
              </div>
            ))}
          </div>
        </div>

        <button disabled={busy || uploading} className="w-full bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Saving…' : 'Save product'}
        </button>
      </form>
    </div>
  );
}
