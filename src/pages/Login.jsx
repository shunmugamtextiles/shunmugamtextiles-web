import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';


const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const Login = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        try {
            // First, check if it's admin login
            // For admin check, we now use Firestore via adminUtils
            // This allows us to seed the DB on first run if needed
            // and supports dynamic updates
            // Fetch credentials
            const { getAdminCredentials } = await import('../utils/adminUtils');
            const adminCreds = await getAdminCredentials();

            if (adminCreds && userId === adminCreds.username && password === adminCreds.password) {
                localStorage.setItem('isAdminLoggedIn', 'true');
                localStorage.setItem('userRole', 'admin');
                navigate('/admin/dashboard');
                setLoading(false);
                return;
            }

            // If not admin, check if it's a supervisor
            if (!userId || !password) {
                setError('Please enter ID and password.');
                setLoading(false);
                return;
            }

            // Query Firestore for supervisor
            const supervisorsRef = collection(db, 'supervisors');
            const q = query(supervisorsRef, where('supervisorId', '==', userId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('Invalid ID or password. Please try again.');
                setLoading(false);
                return;
            }

            // Check password
            const supervisorDoc = querySnapshot.docs[0];
            const supervisorData = supervisorDoc.data();

            if (supervisorData.password === password) {
                // Check if supervisor is active
                if (supervisorData.status !== 'active') {
                    setError('Your account is inactive. Please contact administrator.');
                    setLoading(false);
                    return;
                }

                // Store supervisor session
                localStorage.setItem('isSupervisorLoggedIn', 'true');
                localStorage.setItem('userRole', 'supervisor');
                localStorage.setItem('supervisorId', userId);
                localStorage.setItem('supervisorName', supervisorData.name || '');
                navigate('/supervisor/dashboard');
            } else {
                setError('Invalid ID or password. Please try again.');
            }
            setLoading(false);
        } catch (error) {
            console.error('Login error:', error);
            setError('An error occurred during login. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center py-12 px-4 relative">
            <div className="absolute top-4 left-4 md:top-8 md:left-8">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm"
                >
                    <ArrowLeft size={20} />
                </Link>
            </div>
            <div className="max-w-md w-full">
                <div className="bg-white rounded-xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-blue-900">Login</h2>
                        <p className="text-slate-600 mt-2">Sign in to access your dashboard</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="userId" className="block text-sm font-semibold text-slate-700 mb-2">
                                ID / Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    id="userId"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                    placeholder="Enter ID or username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
