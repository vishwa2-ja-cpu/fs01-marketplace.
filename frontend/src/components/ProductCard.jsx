import { rupees } from '../utils.js';

export default function ProductCard({ product }) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="aspect-square bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
        {product.images?.[0] ? <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" /> : 'No image'}
      </div>
      <div className="p-3">
        <h3 className="font-medium truncate">{product.title}</h3>
        <p className="text-xs text-slate-500 mb-1">{product.vendorId?.storeName}</p>
        <p className="font-semibold">{rupees(product.price)}</p>
      </div>
    </div>
  );
}
