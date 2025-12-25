import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const navItems = [
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50 py-2 md:py-3">
            <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 md:gap-3 no-underline">
                    <img src="/logo.jpg" alt="Shunmugam Textiles" className="w-9 h-9 md:w-12 md:h-12 rounded-full object-cover border-2 border-blue-800 shrink-0" />
                    <span className="text-blue-900 font-semibold text-sm md:text-base lg:text-lg">Shunmugam Textiles</span>
                </Link>

                {/* Mobile Menu Overlay */}
                <div className={`
          fixed left-0 right-0 top-[60px] md:top-auto md:relative
          bg-white md:bg-transparent
          shadow-lg md:shadow-none
          p-4 md:p-0
          flex flex-col md:flex-row
          gap-4 md:gap-6 lg:gap-8
          items-center
          transition-all duration-300 ease-in-out
          ${isMenuOpen ? 'translate-y-0 opacity-100 z-40' : '-translate-y-full opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto'}
          md:flex
        `}>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`no-underline font-medium text-sm md:text-[0.95rem] transition-colors relative px-4 py-2 w-full md:w-auto text-center ${isActive(item.path)
                                ? 'text-blue-600 md:after:content-[""] md:after:absolute md:after:-bottom-2 md:after:left-0 md:after:right-0 md:after:h-0.5 md:after:bg-blue-600'
                                : 'text-slate-600 hover:text-blue-600'
                                }`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {item.name}
                        </Link>
                    ))}

                    {/* Mobile Login Button */}
                    <Link
                        to="/login"
                        className="md:hidden w-full text-center bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium text-[0.95rem] transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/30 no-underline"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Login
                    </Link>
                </div>

                {/* Desktop Login Button */}
                <Link
                    to="/login"
                    className="hidden md:block bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium text-[0.95rem] transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/30 no-underline"
                >
                    Login
                </Link>

                <button
                    className="md:hidden bg-transparent border-none text-blue-900 cursor-pointer p-2"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
