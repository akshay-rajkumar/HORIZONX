import { Link } from 'react-router-dom';
import { Film, Search, User, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md shadow-lg border-b border-white/10 py-3' : 'bg-transparent py-5'
                }`}
        >
            <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2 group">
                        <Film className="w-8 h-8 text-brand-primary group-hover:scale-110 transition-transform" fill="currentColor" />
                        <span className="text-2xl font-bold tracking-tight">Vid<span className="text-brand-primary">King</span></span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 font-medium text-sm">
                        <Link to="/" className="text-white hover:text-brand-primary transition-colors">Home</Link>
                        <Link to="/movies" className="text-gray-300 hover:text-white transition-colors">Movies</Link>
                        <Link to="/tv" className="text-gray-300 hover:text-white transition-colors">TV Shows</Link>
                        <Link to="/trending" className="text-gray-300 hover:text-white transition-colors">Trending</Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    <button className="text-gray-300 hover:text-white transition-colors p-2 md:p-0">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="hidden md:block text-gray-300 hover:text-white transition-colors">
                        <User className="w-5 h-5" />
                    </button>
                    <button className="md:hidden text-gray-300 hover:text-white transition-colors">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
