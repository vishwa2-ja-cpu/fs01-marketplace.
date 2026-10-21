import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import FormField from '../components/FormField.jsx';

const home = { customer: '/account', vendor: '/vendor' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register(form);
      navigate(home[user.role], { replace: true });
    } catch (err) {
      const d = err.response?.data;
      setError(d?.details?.map((x) => x.message).join(', ') || d?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white border rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-4">Create account</h1>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
      <form onSubmit={submit}>
        <FormField label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <FormField label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <FormField label="Password (min 8 characters)" type="password" required minLength={8} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="mb-4 flex gap-4 text-sm">
          {['customer', 'vendor'].map((r) => (
            <label key={r} className="flex items-center gap-1.5">
              <input type="radio" name="role" checked={form.role === r} onChange={() => setForm({ ...form, role: r })} />
              {r === 'customer' ? 'I want to buy' : 'I want to sell'}
            </label>
          ))}
        </div>
        <button disabled={busy} className="w-full bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Creating…' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm mt-4 text-slate-500">
        Already registered? <Link to="/login" className="text-indigo-600">Log in</Link>
      </p>
    </div>
  );
}
