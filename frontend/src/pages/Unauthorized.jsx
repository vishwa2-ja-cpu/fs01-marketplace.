import { Link } from 'react-router-dom';
export default function Unauthorized() {
  return (
    <div className="text-center mt-24">
      <h1 className="text-2xl font-semibold mb-2">403: Not allowed</h1>
      <p className="text-slate-500 mb-4">Your role can't open this page.</p>
      <Link to="/" className="text-indigo-600">Go home</Link>
    </div>
  );
}
