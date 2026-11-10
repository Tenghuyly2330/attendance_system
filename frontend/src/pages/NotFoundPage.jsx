import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Search, ArrowLeft, ShieldAlert, BookOpen } from 'lucide-react';
import { studentService } from '../services/api';
import ClassDirectoryModal from '../components/ClassDirectoryModal';

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const attemptedId = location.state?.attemptedId || '';
  const [searchInput, setSearchInput] = useState(attemptedId);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isClassDirectoryOpen, setIsClassDirectoryOpen] = useState(false);

  const handleRetrySearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const data = await studentService.getStudentById(searchInput.trim());
      if (data.success && data.student) {
        navigate('/', { state: { student: data.student } });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Student ID Not Found. Please Check Your Student ID Card.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-zinc-50 bg-dot-pattern py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-300 shadow-xl p-5 sm:p-7 space-y-5 text-center relative overflow-hidden">
        
        <div className="absolute top-0 inset-x-0 h-1.5 bg-black" />

        <div className="w-14 h-14 rounded-2xl bg-black text-white mx-auto flex items-center justify-center shadow-md border border-black">
          <ShieldAlert className="w-7 h-7 text-white" />
        </div>

        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black text-white uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" />
            Verification Error
          </span>
          <h1 className="text-lg sm:text-xl font-black text-black tracking-tight">
            Student ID Not Found. Please Check Your Student ID Card.
          </h1>
          <p className="text-xs text-zinc-500">
            {attemptedId ? (
              <>
                The entered ID <span className="font-mono font-bold text-black bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-400">{attemptedId}</span> is not registered in the school database.
              </>
            ) : (
              'The requested student card number could not be found in the system records.'
            )}
          </p>
        </div>

        <form onSubmit={handleRetrySearch} className="space-y-2.5 text-left">
          <label className="block text-[11px] font-bold text-black uppercase tracking-wider">
            Re-enter Student ID Card Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              placeholder="e.g. STU-1001"
              className="w-full h-10 px-3 pl-9 rounded-xl border focus:border-black text-black font-mono font-bold text-xs uppercase outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {errorMsg && (
            <p className="text-[11px] font-bold text-black">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={isSearching || !searchInput.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer border border-black shadow-xs"
          >
            {isSearching ? 'Searching...' : 'Retry Verification'}
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-200 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsClassDirectoryOpen(true)}
            className="text-xs text-black hover:underline font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Find Your Card Number by Class
          </button>

          <Link
            to="/"
            className="text-xs text-zinc-500 hover:text-black font-semibold inline-flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Attendance Kiosk
          </Link>
        </div>
      </div>

      <ClassDirectoryModal
        isOpen={isClassDirectoryOpen}
        onClose={() => setIsClassDirectoryOpen(false)}
        onSelectStudent={(s) => {
          setIsClassDirectoryOpen(false);
          navigate('/', { state: { student: s } });
        }}
      />
    </div>
  );
}
