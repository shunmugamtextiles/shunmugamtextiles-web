import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, LogOut } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Dashboard = () => {
    const navigate = useNavigate();
    const [supervisorName, setSupervisorName] = useState('');
    const [supervisorId, setSupervisorId] = useState('');
    const [stats, setStats] = useState({
        receipts: 0,
        loading: true
    });

    useEffect(() => {
        // Get supervisor info from localStorage
        const storedName = localStorage.getItem('supervisorName');
        const storedId = localStorage.getItem('supervisorId');

        if (storedName) setSupervisorName(storedName);
        if (storedId) setSupervisorId(storedId);

        fetchStats();
    }, []);

    // Fetch receipt count for this supervisor
    const fetchStats = async () => {
        try {
            setStats(prev => ({ ...prev, loading: true }));

            // Fetch total receipts count
            const receiptsRef = collection(db, 'receipts');
            const querySnapshot = await getDocs(receiptsRef);

            setStats({
                receipts: querySnapshot.size,
                loading: false
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isSupervisorLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('supervisorId');
        localStorage.removeItem('supervisorName');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                        <div className="flex items-center gap-2 md:gap-3">
                            <img src="/logo.jpg" alt="Shunmugam Textiles" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-blue-800 shrink-0" />
                            <div>
                                <h1 className="text-lg md:text-xl font-bold text-blue-900">Shunmugam Textiles</h1>
                                <p className="text-xs md:text-sm text-slate-600">Supervisor Dashboard</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-all hover:bg-red-700 flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
                        >
                            <LogOut size={16} className="md:w-[18px] md:h-[18px]" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12">
                <div className="mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">
                        Welcome, {supervisorName || 'Supervisor'}
                    </h2>
                    <p className="text-sm md:text-base text-slate-600">
                        Supervisor ID: <span className="font-semibold">{supervisorId}</span>
                    </p>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <Link
                        to="/supervisor/reports"
                        className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:-translate-y-2 hover:shadow-xl no-underline"
                    >
                        <div className="bg-gradient-to-br from-orange-600 to-orange-500 p-4 md:p-6 text-white">
                            <FileText size={40} className="md:w-12 md:h-12 mb-3 md:mb-4" />
                            <h3 className="text-xl md:text-2xl font-bold">Reports</h3>
                        </div>
                        <div className="p-4 md:p-6">
                            <p className="text-sm md:text-base text-slate-600">View and export receipts</p>
                        </div>
                    </Link>
                </div>

                {/* Quick Stats */}
                <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 text-xs md:text-sm font-medium">Total Receipts</p>
                                {stats.loading ? (
                                    <div className="mt-2 h-6 md:h-8 w-12 bg-slate-200 rounded animate-pulse"></div>
                                ) : (
                                    <p className="text-2xl md:text-3xl font-bold text-orange-900 mt-2">{stats.receipts}</p>
                                )}
                            </div>
                            <FileText size={32} className="md:w-10 md:h-10 text-orange-600 shrink-0" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;

