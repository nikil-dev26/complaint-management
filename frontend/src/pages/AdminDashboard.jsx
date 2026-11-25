import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api.js';
import socket from '../services/socket.js';
import Navbar from '../components/Navbar.jsx';

const rawBackendUrl =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const BACKEND_BASE_URL = rawBackendUrl.replace(/\/+$/, '').replace(/\/api$/, '');

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${BACKEND_BASE_URL}${cleanPath}`;
};

const CATEGORIES = [
  'All',
  'Hostel',
  'Academics',
  'IT & Network',
  'Maintenance',
  'Transport',
  'Other',
];

const STATUSES = ['All', 'Pending', 'In Progress', 'Resolved'];

const getStatusStyle = (status) => {
  switch (status) {
    case 'Resolved':
      return 'bg-gradient-to-r from-emerald-50 to-teal-100 text-emerald-800 border-emerald-200';
    case 'In Progress':
      return 'bg-gradient-to-r from-amber-50 to-orange-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300/70';
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [liveAlert, setLiveAlert] = useState('');

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/complaints', {
        params: { category: categoryFilter, status: statusFilter },
      });
      setComplaints(data);
    } catch (error) {
      console.error('Error loading admin complaints:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || user?.role !== 'admin') {
      navigate('/login');
      return;
    }

    fetchComplaints();
  }, [navigate, fetchComplaints]);

  useEffect(() => {
    const handleNewComplaint = (newItem) => {
      const matchesCategory =
        categoryFilter === 'All' || newItem.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'All' || newItem.status === statusFilter;

      if (matchesCategory && matchesStatus) {
        setComplaints((prev) => [newItem, ...prev]);
      }

      setNotificationCount((prev) => prev + 1);
      setLiveAlert(`New complaint received: "${newItem.title}" (${newItem.category})`);
    };

    const handleStatusUpdate = (updatedItem) => {
      setComplaints((prev) =>
        prev
          .map((item) => (item._id === updatedItem._id ? updatedItem : item))
          .filter((item) => statusFilter === 'All' || item.status === statusFilter)
      );
    };

    socket.on('newComplaint', handleNewComplaint);
    socket.on('complaintStatusUpdated', handleStatusUpdate);

    return () => {
      socket.off('newComplaint', handleNewComplaint);
      socket.off('complaintStatusUpdated', handleStatusUpdate);
    };
  }, [categoryFilter, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { data } = await API.patch(`/complaints/${id}/status`, {
        status: newStatus,
      });
      setComplaints((prev) =>
        prev
          .map((item) => (item._id === id ? data.complaint : item))
          .filter((item) => statusFilter === 'All' || item.status === statusFilter)
      );
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/complaints/${id}`);
      setComplaints((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleClearNotifications = () => {
    setNotificationCount(0);
    setLiveAlert('');
  };

  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="min-h-screen">
      <Navbar
        notificationCount={notificationCount}
        onClearNotifications={handleClearNotifications}
      />

      {liveAlert && (
        <div className="max-w-7xl mx-auto px-4 pt-5">
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-3 text-sm text-amber-950 shadow-xs">
            <span>
              <strong>New Alert:</strong> {liveAlert}
            </span>
            <button
              onClick={handleClearNotifications}
              className="text-xs font-semibold text-amber-800 hover:underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Gradient Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-5 shadow-md">
            <p className="text-xs font-medium text-indigo-300 uppercase">Total Shown</p>
            <p className="text-3xl font-bold mt-1">{complaints.length}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-white p-5 shadow-md shadow-slate-200/50">
            <p className="text-xs font-semibold text-slate-500 uppercase">Pending</p>
            <p className="text-3xl font-bold text-slate-700 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/90 backdrop-blur-xs rounded-2xl border border-amber-200/70 p-5 shadow-md shadow-amber-100/50">
            <p className="text-xs font-semibold text-amber-700 uppercase">In Progress</p>
            <p className="text-3xl font-bold text-amber-800 mt-1">{inProgressCount}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/90 backdrop-blur-xs rounded-2xl border border-emerald-200/70 p-5 shadow-md shadow-emerald-100/50">
            <p className="text-xs font-semibold text-emerald-700 uppercase">Resolved</p>
            <p className="text-3xl font-bold text-emerald-800 mt-1">{resolvedCount}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-white shadow-md shadow-slate-200/50 p-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-slate-800">All Submitted Complaints</h1>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaints List */}
        {loading ? (
          <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-white p-10 text-center text-slate-500">
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-white p-10 text-center text-slate-500">
            No complaints match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {complaints.map((item) => (
              <div
                key={item._id}
                className="bg-white/90 backdrop-blur-xs rounded-2xl border border-white p-5 shadow-md shadow-slate-200/50 hover:shadow-lg hover:shadow-indigo-100/60 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md">
                      {item.category}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      by <strong className="text-slate-600">{item.userId?.name || 'User'}</strong> ({item.userId?.email})
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>

                  {item.image && (
                    <img
                      src={resolveImageUrl(item.image)}
                      alt={item.title}
                      className="mt-2 h-28 w-auto rounded-xl border border-slate-200 object-cover"
                    />
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  <button
                    onClick={() => handleDelete(item._id)}
                    className="rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold px-3.5 py-2 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;