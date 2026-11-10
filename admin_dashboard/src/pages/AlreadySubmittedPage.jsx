import { useLocation, Link } from 'react-router-dom';
import { AlertTriangle, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { getFullPhotoUrl } from '../services/api';

export default function AlreadySubmittedPage() {
  const location = useLocation();

  const student = location.state?.student;
  const attendance = location.state?.attendance;

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

  const displayTime = attendance?.attendance_time || 'Earlier Today';
  const profilePhotoUrl = student?.profile_photo ? getFullPhotoUrl(student.profile_photo) : null;
  const facePhotoUrl = attendance?.face_photo ? getFullPhotoUrl(attendance.face_photo) : null;

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-zinc-50 bg-dot-pattern py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-300 shadow-xl p-5 sm:p-7 space-y-5 text-center relative overflow-hidden">
        
        {/* Top Black Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-black" />

        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-black text-white mx-auto flex items-center justify-center shadow-md border border-black">
          <AlertTriangle className="w-7 h-7 text-white" />
        </div>

        {/* Message - Compact */}
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black text-white uppercase tracking-wider">
            Duplicate Entry Prevented
          </span>
          <h1 className="text-lg sm:text-xl font-black text-black tracking-tight">
            Attendance Already Submitted Today.
          </h1>
          <p className="text-xs text-zinc-500 font-normal">
            Each student is allowed one attendance submission per school day.
          </p>
        </div>

        {/* Student Record Card */}
        {student && (
          <div className="bg-zinc-50 rounded-xl border border-zinc-300 p-4 text-left space-y-3.5 shadow-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-200">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 border border-black shadow-xs shrink-0 ring-2 ring-zinc-300">
                <img
                  src={facePhotoUrl || profilePhotoUrl || '/uploads/profiles/default.svg'}
                  alt={student.full_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/uploads/profiles/default.svg';
                  }}
                />
              </div>
              <div>
                <h3 className="font-bold text-black text-sm">{student.full_name}</h3>
                <p className="text-[11px] text-zinc-600 font-mono font-bold">ID: {student.student_id}</p>
                <p className="text-[10px] text-zinc-500">Class: {student.class_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                <span className="text-zinc-500 font-semibold text-[9px] uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5 text-black" /> Date
                </span>
                <p className="font-bold text-black text-[11px] mt-0.5">{displayDate}</p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                <span className="text-zinc-500 font-semibold text-[9px] uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-black" /> Time Logged
                </span>
                <p className="font-mono font-bold text-black text-[11px] mt-0.5">{displayTime}</p>
              </div>
            </div>
          </div>
        )}

        {/* Return to Kiosk */}
        <div className="pt-1">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs transition-colors cursor-pointer border border-black shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Attendance Kiosk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
