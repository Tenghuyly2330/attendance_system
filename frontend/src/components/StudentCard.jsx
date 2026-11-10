import { getFullPhotoUrl } from '../services/api';
import { User, BookOpen, CheckCircle, ShieldCheck } from 'lucide-react';

export default function StudentCard({ student }) {
  if (!student) return null;

  const photoUrl = student.profile_photo ? getFullPhotoUrl(student.profile_photo) : null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border-2 border-black p-6 shadow-sm transition-all">
      {/* Top Black Accent */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-black" />

      <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
        {/* Profile Photo */}
        <div className="relative group">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-black bg-zinc-100 flex items-center justify-center">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={student.full_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/icons.svg#user';
                }}
              />
            ) : (
              <User className="w-16 h-16 text-zinc-400" />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-black text-white p-1.5 rounded-full shadow-md border-2 border-white" title="Verified Student">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 text-center sm:text-left space-y-2.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-bold px-3 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Student
            </span>
            <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-900 text-xs font-bold px-2.5 py-1 rounded-md border border-zinc-300">
              <BookOpen className="w-3.5 h-3.5 text-black" />
              {student.class_name}
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-black tracking-tight">
              {student.full_name}
            </h3>
            <p className="text-sm font-semibold text-zinc-700 mt-1">
              ID Card: <span className="font-mono text-base font-bold bg-zinc-100 px-2.5 py-0.5 rounded border-2 border-black text-black">{student.student_id}</span>
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-zinc-700 border-t border-zinc-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              <span className="font-medium text-black">Active Status: Enrolled</span>
            </div>
            <div>
              <span className="text-zinc-500">Class: </span>
              <span className="font-bold text-black">{student.class_name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
