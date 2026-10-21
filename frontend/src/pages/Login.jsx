import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import FormField from '../components/FormField.jsx';

const home = { customer: '/account', vendor: '/vendor', admin: '/admin' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      navigate(location.state?.from?.pathname || home[user.role], { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white border rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-4">Log in</h1>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}
      <form onSubmit={submit}>
        <FormField label="Email" type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <FormField label="Password" type="password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={busy} className="w-full bg-indigo-600 text-white rounded py-2 hover:bg-indigo-700 disabled:opacity-50">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-sm mt-4 text-slate-500">
        No account? <Link to="/register" className="text-indigo-600">Sign up</Link>
      </p>
    </div>
  );
}
