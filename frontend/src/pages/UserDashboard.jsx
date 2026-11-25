import { useEffect, useState } from 'react';
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
  'Hostel',
  'Academics',
  'IT & Network',
  'Maintenance',
  'Transport',
  'Other',
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'Resolved':
      return 'bg-gradient-to-r from-emerald-50 to-teal-100 text-emerald-800 border-emerald-200';
    case 'In Progress':
      return 'bg-gradient-to-r from-amber-50 to-orange-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300/70';
  }
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUserId = currentUser?.id || currentUser?._id;

  const [complaints, setComplaints] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hostel');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [notificationCount, setNotificationCount] = useState(0);
  const [liveAlert, setLiveAlert] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchMyComplaints = async () => {
      try {
        const { data } = await API.get('/complaints/my');
        setComplaints(data);
      } catch (error) {
        console.error('Failed to fetch complaints:', error);
      }
    };

    fetchMyComplaints();
  }, [navigate]);

  useEffect(() => {
    const handleStatusUpdate = (updatedComplaint) => {
      const ownerId =
        typeof updatedComplaint.userId === 'object'
          ? updatedComplaint.userId?._id
          : updatedComplaint.userId;

      if (currentUserId && ownerId === currentUserId) {
        setComplaints((prev) =>
          prev.map((item) =>
            item._id === updatedComplaint._id ? updatedComplaint : item
          )
        );
        setNotificationCount((prev) => prev + 1);
        setLiveAlert(
          `"${updatedComplaint.title}" status updated to "${updatedComplaint.status}"`
        );
      }
    };

    const handleComplaintDeleted = ({ id }) => {
      setComplaints((prev) => prev.filter((item) => item._id !== id));
    };

    socket.on('complaintStatusUpdated', handleStatusUpdate);
    socket.on('complaintDeleted', handleComplaintDeleted);

    return () => {
      socket.off('complaintStatusUpdated', handleStatusUpdate);
      socket.off('complaintDeleted', handleComplaintDeleted);
    };
  }, [currentUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      if (image) {
        formData.append('image', image);
      }

      const { data } = await API.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setComplaints((prev) => [data.complaint, ...prev]);
      setTitle('');
      setCategory('Hostel');
      setDescription('');
      setImage(null);
      e.target.reset();
      setMessage({ type: 'success', text: 'Complaint submitted successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit complaint',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearNotifications = () => {
    setNotificationCount(0);
    setLiveAlert('');
  };

  return (
    <div className="min-h-screen">
      <Navbar
        notificationCount={notificationCount}
        onClearNotifications={handleClearNotifications}
      />

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-4">
        {/* Hero Gradient Header */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 shadow-lg shadow-indigo-950/15">
          <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
            Real-Time Support Portal
          </p>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">
            Complaint Tracking & Live Updates
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Submit issues and watch status changes arrive instantly without refreshing.
          </p>
        </div>

        {liveAlert && (
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-950 shadow-xs">
            <span>
              <strong>Live Update:</strong> {liveAlert}
            </span>
            <button
              onClick={handleClearNotifications}
              className="text-xs font-semibold text-indigo-700 hover:underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Complaint Submission Form */}
        <section className="lg:col-span-5 bg-white/90 backdrop-blur-xs rounded-2xl border border-white shadow-lg shadow-slate-200/60 p-6 h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-1">
            Raise a New Complaint
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Fill in the details below and track status updates live
          </p>

          {message.text && (
            <div
              className={`mb-4 rounded-xl px-3.5 py-2.5 text-sm border ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Complaint Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Water supply issue in Block B"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the problem clearly..."
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Attach Image <span className="text-slate-400">(Optional, max 2MB)</span>
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => setImage(e.target.files[0] || null)}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </section>

        {/* Right Column: User Complaints List */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              My Complaints ({complaints.length})
            </h2>
          </div>

          {complaints.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-white shadow-md shadow-slate-200/50 p-10 text-center text-slate-500 text-sm">
              No complaints submitted yet. Use the form on the left to raise one.
            </div>
          ) : (
            complaints.map((item) => (
              <div
                key={item._id}
                className="bg-white/90 backdrop-blur-xs rounded-2xl border border-white shadow-md shadow-slate-200/50 p-5 transition hover:shadow-lg hover:shadow-indigo-100/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md mb-1.5">
                      {item.category}
                    </span>
                    <h3 className="text-base font-semibold text-slate-800">
                      {item.title}
                    </h3>
                  </div>

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border shrink-0 ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mt-2">{item.description}</p>

                {item.image && (
                  <img
                    src={resolveImageUrl(item.image)}
                    alt={item.title}
                    className="mt-3 h-36 w-auto rounded-xl border border-slate-200 object-cover"
                  />
                )}

                <p className="text-xs text-slate-400 mt-3">
                  Submitted on {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default UserDashboard;