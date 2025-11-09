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

        <div className={`md:flex gap-6 lg:gap-8 items-center ${isMenuOpen ? 'fixed left-0 top-[60px] md:top-[70px] flex-col bg-white w-full text-center shadow-lg py-6 md:py-8 gap-4 md:gap-6 z-40' : 'hidden'}`}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`no-underline font-medium text-sm md:text-[0.95rem] transition-colors relative px-4 py-2 ${
                isActive(item.path) 
                  ? 'text-blue-600 after:content-[""] after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>

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
