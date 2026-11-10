import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AttendancePage from './pages/AttendancePage';
import SuccessPage from './pages/SuccessPage';
import NotFoundPage from './pages/NotFoundPage';
import AlreadySubmittedPage from './pages/AlreadySubmittedPage';

export default function App() {
  return (
    <div className="min-h-screen relative bg-zinc-50 flex flex-col font-sans text-black selection:bg-black selection:text-white">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<AttendancePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="/already-submitted" element={<AlreadySubmittedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-200 py-4 text-center text-xs text-zinc-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Lth of Excellence. All rights reserved.</p>
          <p className="flex items-center gap-1.5 font-bold text-black">
            <span className="w-2 h-2 rounded-full bg-black"></span>
            Lth Active
          </p>
        </div>
      </footer>
    </div>
  );
}
