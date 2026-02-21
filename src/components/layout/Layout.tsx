import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
    return (
        <div className="min-h-screen bg-bg-dark text-white flex flex-col">
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
            <footer className="py-8 text-center text-gray-500 text-sm border-t border-white/10 mt-auto">
                <p>© {new Date().getFullYear()} VidKing Stream. All rights reserved.</p>
                <p className="mt-2">Powered by VidKing Embed & TMDB</p>
            </footer>
        </div>
    );
};

export default Layout;
