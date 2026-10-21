import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="text-center mt-24">
      <h1 className="text-2xl font-semibold mb-2">404: Page not found</h1>
      <Link to="/" className="text-indigo-600">Go home</Link>
    </div>
  );
}
