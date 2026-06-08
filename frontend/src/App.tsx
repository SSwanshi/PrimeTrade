import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, UserPlus, Home, Settings, LogOut, Package, Wallet, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Components
const Login = ({ setAuth }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setAuth(res.data.user);
    } catch (err) {
      setError('Login failed. Check credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 text-black w-full">
      <form onSubmit={submit} className="bg-white p-8 border border-gray-200 w-96 rounded-md">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><LogIn /> Login</h2>
        {error && <div className="text-red-600 bg-red-50 p-2 mb-4 rounded">{error}</div>}
        <input className="w-full border border-gray-300 p-2 mb-4 rounded" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border border-gray-300 p-2 mb-6 rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Login</button>
        <p className="mt-4 text-sm text-black">Don't have an account? <Link to="/register" className="text-blue-600 underline">Register</Link></p>
      </form>
    </div>
  );
};

const Register = ({ setAuth }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { email, password, name, role });
      window.location.href = '/login';
    } catch (err) {
      setError('Registration failed.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 text-black w-full">
      <form onSubmit={submit} className="bg-white p-8 border border-gray-200 w-96 rounded-md">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><UserPlus /> Register</h2>
        {error && <div className="text-red-600 bg-red-50 p-2 mb-4 rounded">{error}</div>}
        <input className="w-full border border-gray-300 p-2 mb-4 rounded" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="w-full border border-gray-300 p-2 mb-4 rounded" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border border-gray-300 p-2 mb-4 rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <select className="w-full border border-gray-300 p-2 mb-6 rounded" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="USER">User (Trader)</option>
          <option value="ADMIN">Administrator</option>
        </select>
        <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">Register</button>
        <p className="mt-4 text-sm text-black">Already have an account? <Link to="/login" className="text-blue-600 underline">Login</Link></p>
      </form>
    </div>
  );
};

const Dashboard = ({ user }: any) => {
  const [portfolio, setPortfolio] = React.useState<any>(null);
  const [assets, setAssets] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [portRes, assetRes, orderRes] = await Promise.all([
          api.get('/portfolio'),
          api.get('/assets'),
          api.get('/orders/my-orders')
        ]);
        setPortfolio(portRes.data);
        setAssets(assetRes.data);
        setOrders(orderRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const placeOrder = async (assetId: string, type: string) => {
    try {
      await api.post('/orders', { assetId, side: type, quantity: 1 });
      alert('Order placed successfully');
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Order failed');
    }
  };

  const getOwnedQuantity = (assetId: string) => {
    return orders
      .filter((o: any) => o.assetId === assetId && o.status === 'FILLED')
      .reduce((acc: number, o: any) => o.side === 'BUY' ? acc + o.quantity : acc - o.quantity, 0);
  };

  const updateOrder = async (id: string, currentQty: number) => {
    const quantity = prompt('Enter new quantity:', currentQty.toString());
    if (!quantity || parseFloat(quantity) <= 0) return;
    try {
      await api.put(`/orders/${id}`, { quantity: parseFloat(quantity) });
      window.location.reload();
    } catch (err: any) { 
      alert(err.response?.data?.error || 'Order update failed'); 
    }
  };

  const cancelOrder = async (id: string) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await api.delete(`/orders/${id}`);
      window.location.reload();
    } catch { alert('Order cancellation failed'); }
  };

  return (
    <div className="p-6 text-black bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Home /> Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 border border-gray-200 rounded pt-8 flex flex-col items-center">
          <Wallet className="h-10 w-10 text-blue-500 mb-2" />
          <h2 className="text-gray-500 font-semibold">Portfolio Balance</h2>
          <p className="text-3xl font-bold mt-2">${portfolio?.balance?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp /> Trade Assets</h2>
          <div className="space-y-4">
            {assets.map((asset) => {
              const ownedQty = getOwnedQuantity(asset.id);
              return (
                <div key={asset.id} className="flex justify-between items-center bg-gray-50 p-4 border border-gray-100 rounded">
                  <div>
                    <span className="font-bold">{asset.symbol}</span> - <span className="text-gray-500">{asset.name}</span>
                    <div className="text-sm text-gray-500 mt-1">Price: ${asset.price.toFixed(2)} | Owned: {ownedQty}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => placeOrder(asset.id, 'BUY')} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Buy 1</button>
                    <button onClick={() => placeOrder(asset.id, 'SELL')} disabled={ownedQty < 1} className={`px-4 py-2 rounded text-sm ${ownedQty < 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}>Sell 1</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Package /> My Orders</h2>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex justify-between items-center bg-gray-50 p-4 border border-gray-100 rounded">
                <div>
                  <span className="font-bold">{order.asset?.symbol}</span> <span className={order.side === 'BUY' ? 'text-blue-600' : 'text-red-600'}>{order.side}</span>
                  <div className="text-sm text-gray-500 mt-1">{order.quantity} @ ${order.price.toFixed(2)}</div>
                </div>
                <div>
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-semibold uppercase">{order.status}</span>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => updateOrder(order.id, order.quantity)} className="text-blue-600 text-sm hover:underline">Edit Qty</button>
                    <button onClick={() => cancelOrder(order.id)} className="text-red-600 text-sm hover:underline">Cancel</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [assets, setAssets] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('Crypto');

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetRes, userRes] = await Promise.all([
          api.get('/assets'),
          api.get('/users')
        ]);
        setAssets(assetRes.data);
        setUsers(userRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const createAsset = async (e: any) => {
    e.preventDefault();
    try {
      await api.post('/assets', { symbol, name, price: parseFloat(price), type });
      window.location.reload();
    } catch (err) {
      alert('Failed to create asset');
    }
  };

  const updateAsset = async (id: string, currentPrice: number) => {
    const newPrice = prompt('Enter new price:', currentPrice.toString());
    if (!newPrice) return;
    try {
      await api.put(`/assets/${id}`, { price: parseFloat(newPrice) });
      window.location.reload();
    } catch { alert('Failed to update asset'); }
  };

  const deleteAsset = async (id: string) => {
    if (!window.confirm('Delete this asset?')) return;
    try {
      await api.delete(`/assets/${id}`);
      window.location.reload();
    } catch (err) {
      alert('Failed to delete asset');
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      window.location.reload();
    } catch { alert('Failed to delete user'); }
  };

  return (
    <div className="p-6 text-black bg-gray-50 min-h-screen w-full">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2"><Settings /> Admin Panel</h1>

      <div className="bg-white border border-gray-200 p-6 rounded mb-8">
        <h2 className="text-xl font-bold mb-4">Create New Asset</h2>
        <form onSubmit={createAsset} className="flex gap-4">
          <input className="border border-gray-300 p-2 rounded w-full" placeholder="Symbol (e.g. BTC)" value={symbol} onChange={e => setSymbol(e.target.value)} required />
          <input className="border border-gray-300 p-2 rounded w-full" placeholder="Name (e.g. Bitcoin)" value={name} onChange={e => setName(e.target.value)} required />
          <input className="border border-gray-300 p-2 rounded w-full" placeholder="Price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
          <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 whitespace-nowrap">Add Asset</button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded">
        <h2 className="text-xl font-bold mb-4">Manage Assets</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-b p-3">Symbol</th>
              <th className="border-b p-3">Name</th>
              <th className="border-b p-3">Price</th>
              <th className="border-b p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b">
                <td className="p-3 font-bold">{asset.symbol}</td>
                <td className="p-3">{asset.name}</td>
                <td className="p-3">${asset.price.toFixed(2)}</td>
                <td className="p-3">
                  <button onClick={() => updateAsset(asset.id, asset.price)} className="text-blue-600 hover:underline mr-4">Edit</button>
                  <button onClick={() => deleteAsset(asset.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 p-6 rounded mt-8 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><UserPlus /> Manage Users</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-b p-3">Name</th>
              <th className="border-b p-3">Email</th>
              <th className="border-b p-3">Role</th>
              <th className="border-b p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-3 font-bold">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">
                  <button onClick={() => deleteUser(u.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 w-full">
        {user && (
          <header className="bg-white border-b border-gray-200 p-4 shrink-0 px-6 flex justify-between items-center w-full">
            <div className="font-bold text-xl flex items-center gap-2 text-blue-600">
              <TrendingUp /> PrimeTrade
            </div>
            <nav className="flex items-center gap-6">
              {user.role !== 'ADMIN' && (
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="text-gray-600 hover:text-gray-900 font-medium">Admin Panel</Link>
              )}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm font-semibold">{user.name}</span>
                <button onClick={logout} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </nav>
          </header>
        )}
        <main className="flex-grow flex flex-col w-full">
          <Routes>
            <Route path="/login" element={!user ? <Login setAuth={setUser} /> : <Navigate to={user.role === 'ADMIN' ? "/admin" : "/dashboard"} />} />
            <Route path="/register" element={!user ? <Register setAuth={setUser} /> : <Navigate to={user.role === 'ADMIN' ? "/admin" : "/dashboard"} />} />
            <Route path="/dashboard" element={user && user.role !== 'ADMIN' ? <Dashboard user={user} /> : <Navigate to={user?.role === 'ADMIN' ? "/admin" : "/login"} />} />
            <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminPanel /> : <Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to={user ? (user.role === 'ADMIN' ? "/admin" : "/dashboard") : "/login"} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}