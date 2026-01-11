import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Package, UserCheck, LogOut, FileText, User, ChevronDown, Key, X, CheckCircle, AlertCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { updateAdminCredentials } from '../../utils/adminUtils';

// Modal Component for Change Credentials
const ChangeCredentialsModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            await updateAdminCredentials(formData.username, formData.password);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to update credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Change Admin Credentials</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Username</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Credentials'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        supervisors: 0,
        weavers: 0,
        products: 0,
        loading: true
    });

    // Profile Dropdown State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showChangeCreds, setShowChangeCreds] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch counts from Firestore
    const fetchStats = async () => {
        try {
            setStats(prev => ({ ...prev, loading: true }));

            // Fetch supervisors count
            const supervisorsSnapshot = await getDocs(collection(db, 'supervisors'));
            const supervisorsCount = supervisorsSnapshot.size;

            // Fetch weavers count
            const weaversSnapshot = await getDocs(collection(db, 'weavers'));
            const weaversCount = weaversSnapshot.size;

            // Fetch products count (when products collection is implemented)
            let productsCount = 0;
            try {
                const productsSnapshot = await getDocs(collection(db, 'products'));
                productsCount = productsSnapshot.size;
            } catch (error) {
                // Products collection might not exist yet
                console.log('Products collection not found');
            }

            setStats({
                supervisors: supervisorsCount,
                weavers: weaversCount,
                products: productsCount,
                loading: false
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isAdminLoggedIn');
        navigate('/');
    };

    const handleCredentialsUpdated = () => {
        alert("Credentials updated successfully! Please login with new credentials.");
        handleLogout();
    };

    const dashboardCards = [
        {
            title: 'Supervisors',
            icon: UserCheck,
            path: '/admin/supervisors',
            color: 'from-blue-600 to-blue-500',
            description: 'Manage supervisor accounts and assignments'
        },
        {
            title: 'Weavers',
            icon: Users,
            path: '/admin/weavers',
            color: 'from-green-600 to-green-500',
            description: 'Manage weaver information and records'
        },
        {
            title: 'Products',
            icon: Package,
            path: '/admin/products',
            color: 'from-purple-600 to-purple-500',
            description: 'Manage product catalog and inventory'
        },
        {
            title: 'Reports',
            icon: FileText,
            path: '/admin/reports',
            color: 'from-orange-600 to-orange-500',
            description: 'View and print receipts'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Change Credentials Modal */}
            <ChangeCredentialsModal
                isOpen={showChangeCreds}
                onClose={() => setShowChangeCreds(false)}
                onSuccess={handleCredentialsUpdated}
            />

            {/* Header */}
            <header className="bg-white shadow-md relative z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
                    <div className="flex justify-between items-center w-full md:w-auto">
                        <div className="flex items-center gap-2 md:gap-3">
                            <img src="/logo.jpg" alt="Shunmugam Textiles" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-blue-800 shrink-0" />
                            <div>
                                <h1 className="text-lg md:text-xl font-bold text-blue-900">Shunmugam Textiles</h1>
                                <p className="text-xs md:text-sm text-slate-600">Admin Dashboard</p>
                            </div>
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                    <User size={20} />
                                </div>
                                <span className="hidden md:block font-medium text-slate-700">Admin</span>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            setShowChangeCreds(true);
                                        }}
                                        className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                    >
                                        <Key size={18} className="text-slate-400" />
                                        <span>Change Credentials</span>
                                    </button>
                                    <div className="h-px bg-slate-100 my-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                    >
                                        <LogOut size={18} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
                <div className="mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">Welcome, Admin</h2>
                    <p className="text-sm md:text-base text-slate-600">Manage your textile business operations</p>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {dashboardCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Link
                                key={card.path}
                                to={card.path}
                                className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl no-underline"
                            >
                                <div className={`bg-gradient-to-br ${card.color} p-4 md:p-6 text-white`}>
                                    <Icon size={40} className="md:w-12 md:h-12 mb-3 md:mb-4" />
                                    <h3 className="text-xl md:text-2xl font-bold">{card.title}</h3>
                                </div>
                                <div className="p-4 md:p-6">
                                    <p className="text-sm md:text-base text-slate-600">{card.description}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Quick Stats */}
                <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 text-xs md:text-sm font-medium">Total Supervisors</p>
                                {stats.loading ? (
                                    <div className="mt-2 h-6 md:h-8 w-12 bg-slate-200 rounded animate-pulse"></div>
                                ) : (
                                    <p className="text-2xl md:text-3xl font-bold text-blue-900 mt-2">{stats.supervisors}</p>
                                )}
                            </div>
                            <UserCheck size={32} className="md:w-10 md:h-10 text-blue-600 shrink-0" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 text-xs md:text-sm font-medium">Total Weavers</p>
                                {stats.loading ? (
                                    <div className="mt-2 h-6 md:h-8 w-12 bg-slate-200 rounded animate-pulse"></div>
                                ) : (
                                    <p className="text-2xl md:text-3xl font-bold text-green-900 mt-2">{stats.weavers}</p>
                                )}
                            </div>
                            <Users size={32} className="md:w-10 md:h-10 text-green-600 shrink-0" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 text-xs md:text-sm font-medium">Total Products</p>
                                {stats.loading ? (
                                    <div className="mt-2 h-6 md:h-8 w-12 bg-slate-200 rounded animate-pulse"></div>
                                ) : (
                                    <p className="text-2xl md:text-3xl font-bold text-purple-900 mt-2">{stats.products}</p>
                                )}
                            </div>
                            <Package size={32} className="md:w-10 md:h-10 text-purple-600 shrink-0" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
