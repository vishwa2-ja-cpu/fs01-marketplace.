import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import NotFound from './pages/NotFound.jsx';
import Account from './pages/customer/Account.jsx';
import VendorDashboard from './pages/vendor/VendorDashboard.jsx';
import ProductList from './pages/vendor/ProductList.jsx';
import ProductForm from './pages/vendor/ProductForm.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminVendors from './pages/admin/AdminVendors.jsx';

const vendor = (el) => <ProtectedRoute roles={['vendor']}>{el}</ProtectedRoute>;
const admin = (el) => <ProtectedRoute roles={['admin']}>{el}</ProtectedRoute>;

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/account" element={<ProtectedRoute roles={['customer']}><Account /></ProtectedRoute>} />

        <Route path="/vendor" element={vendor(<VendorDashboard />)} />
        <Route path="/vendor/products" element={vendor(<ProductList />)} />
        <Route path="/vendor/products/new" element={vendor(<ProductForm />)} />
        <Route path="/vendor/products/:id/edit" element={vendor(<ProductForm />)} />

        <Route path="/admin" element={admin(<AdminDashboard />)} />
        <Route path="/admin/vendors" element={admin(<AdminVendors />)} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
