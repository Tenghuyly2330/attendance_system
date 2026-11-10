import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Clock } from 'lucide-react';

export default function Navbar() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-zinc-200 sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-xs group-hover:scale-105 group-hover:bg-zinc-900 transition-all border border-black">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base tracking-tight text-black">
                  Lth
                </span>
                <span className="bg-black text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-black uppercase hidden sm:inline-block">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-medium">Attendance Management Console</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2.5 bg-zinc-50 border border-zinc-300 px-3 py-1.5 rounded-xl text-zinc-800 shadow-xs">
            <div className="flex items-center gap-1.5 text-zinc-600 text-[11px] font-medium">
              <Clock className="w-3 h-3 text-black" />
              <span>{formattedDate}</span>
            </div>
            <span className="text-zinc-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              <span className="font-mono font-bold text-black tracking-wider text-xs">
                {formattedTime}
              </span>
            </div>
          </div>

          {/* <div className="flex items-center gap-2">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all bg-white hover:bg-zinc-100 text-black border border-black shadow-xs cursor-pointer"
            >
              <span>Kiosk Terminal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div> */}
        </div>
      </div>
    </header>
  );
}
