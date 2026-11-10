import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-black selection:bg-black selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<AdminDashboardPage />} />
        </Routes>
      </main>
      <footer className="bg-white border-t border-zinc-200 py-4 text-center text-xs text-zinc-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Horizon Academy of Excellence. Admin Operations Interface.</p>
          <p className="flex items-center gap-1.5 font-bold text-black">
            <span className="w-2 h-2 rounded-full bg-black"></span>
            Admin Portal Active
          </p>
        </div>
      </footer>
    </div>
  );
}
