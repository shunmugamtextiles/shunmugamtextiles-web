import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Package, UserCheck, LogOut, FileText } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        supervisors: 0,
        weavers: 0,
        products: 0,
        loading: true
    });

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
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
                    <div className="flex justify-between items-center w-full md:w-auto">
                        <div className="flex items-center gap-2 md:gap-3">
                            <img src="/logo.jpg" alt="Shunmugam Textiles" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-blue-800 shrink-0" />
                            <div>
                                <h1 className="text-lg md:text-xl font-bold text-blue-900">Shunmugam Textiles</h1>
                                <p className="text-xs md:text-sm text-slate-600">Admin Dashboard</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="
                md:bg-red-600 md:text-white 
                text-red-600 md:px-4 md:py-2 
                p-2 md:p-2 
                rounded-full md:rounded-lg 
                font-medium transition-all 
                hover:bg-red-50 md:hover:bg-red-700 
                flex items-center gap-2 
                text-sm md:text-base 
                justify-center
              "
                            title="Logout"
                        >
                            <LogOut size={20} className="md:w-[18px] md:h-[18px]" />
                            <span className="hidden md:inline">Logout</span>
                        </button>
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
