import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Calendar, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { getFullPhotoUrl } from '../services/api';

export default function SuccessPage() {
  const location = useLocation();

  const attendance = location.state?.attendance;
  const student = location.state?.student;

  useEffect(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#000000', '#333333', '#777777', '#cccccc', '#ffffff']
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const displayDate = attendance?.attendance_date
    ? new Date(attendance.attendance_date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

  const displayTime = attendance?.attendance_time || new Date().toLocaleTimeString();
  const facePhotoUrl = attendance?.face_photo ? getFullPhotoUrl(attendance.face_photo) : null;
  const profilePhotoUrl = student?.profile_photo ? getFullPhotoUrl(student.profile_photo) : null;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-zinc-50 bg-dot-pattern py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-300 shadow-xl p-5 sm:p-7 space-y-5 text-center relative overflow-hidden">
        
        {/* Top Black Accent Strip */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-black" />

        {/* Success Icon */}
        <div className="relative inline-block mt-1">
          <div className="w-14 h-14 rounded-2xl bg-black text-white mx-auto flex items-center justify-center shadow-md border border-black">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Title - Compact */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black text-white uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            Verified &amp; Recorded
          </div>
          <h1 className="text-lg sm:text-xl font-black text-black tracking-tight">
            Attendance Submitted!
          </h1>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto font-normal">
            Your attendance has been validated and saved to Cloudinary.
          </p>
        </div>

        {/* Verification Card Receipt */}
        <div className="bg-zinc-50 rounded-xl border border-zinc-300 p-4 text-left space-y-3.5 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-200">
            {/* Captured Photo in Circle */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 border border-black shadow-xs shrink-0 ring-2 ring-zinc-300">
              <img
                src={facePhotoUrl || profilePhotoUrl || '/uploads/profiles/default.svg'}
                alt="Captured Face"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/uploads/profiles/default.svg';
                }}
              />
            </div>
            <div>
              <h3 className="font-bold text-black text-sm">
                {student?.full_name || attendance?.full_name || 'Student'}
              </h3>
              <p className="text-[11px] text-zinc-600 font-mono font-bold mt-0.5">
                ID: {student?.student_id || attendance?.student_id}
              </p>
              <span className="inline-block bg-zinc-200 text-black text-[10px] font-semibold px-2 py-0.2 rounded mt-0.5 border border-zinc-300">
                {student?.class_name || attendance?.class_name || 'Assigned Class'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="space-y-0.5 bg-white p-2.5 rounded-lg border border-zinc-200">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5 text-black" />
                Date Recorded
              </span>
              <p className="font-bold text-black text-[11px]">{displayDate}</p>
            </div>
            <div className="space-y-0.5 bg-white p-2.5 rounded-lg border border-zinc-200">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-black" />
                Official Time
              </span>
              <p className="font-bold text-black font-mono text-[11px]">{displayTime}</p>
            </div>
          </div>

          <div className="pt-0.5 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium text-[11px]">Attendance Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
              attendance?.status === 'Late'
                ? 'bg-zinc-200 text-black border-black'
                : 'bg-black text-white border-black'
            }`}>
              {attendance?.status || 'Present'}
            </span>
          </div>
        </div>

        {/* Action Button: Reset for Next Student */}
        <div className="pt-1">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-all hover:scale-[1.01] active:scale-[0.99] border border-black shadow-md"
          >
            <span>Next Student Attendance</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
