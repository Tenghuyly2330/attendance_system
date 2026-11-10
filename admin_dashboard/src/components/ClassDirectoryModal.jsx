import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  X, 
  BookOpen, 
  ArrowRight
} from 'lucide-react';
import { studentService } from '../services/api';

export default function ClassDirectoryModal({ isOpen, onClose, onSelectStudent }) {
  const [classList, setClassList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      studentService.getStudentsByClass()
        .then((data) => {
          if (data.success && data.classes) {
            setClassList(data.classes);
          }
        })
        .catch((err) => {
          console.error('Failed to load class directory:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // filter student list
  const allStudents = classList.flatMap((c) =>
    c.students.map((s) => ({
      ...s,
      class_name: s.class_name || c.class_name
    }))
  );

  const filteredStudents = allStudents.filter((s) => {
    const matchClass = selectedClass === 'All' || s.class_name === selectedClass;
    if (!matchClass) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.student_id.toLowerCase().includes(q) ||
      (s.class_name && s.class_name.toLowerCase().includes(q))
    );
  });

  // get first letter
  const getFirstLetter = (name) => {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-black animate-scale-up">
        
        <div className="p-4 sm:p-5 bg-black text-white flex items-start justify-between border-b border-black">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-wider">
              <BookOpen className="w-3 h-3" />
              Class Directory
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
              Student Directory Roster
            </h2>
            <p className="text-zinc-300 text-xs">
              Select your student card to auto-fill your ID and open the camera.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer border border-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 sm:p-4 border-b border-zinc-200 bg-zinc-50 space-y-2.5">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, ID card, or class..."
              className="w-full h-10 px-3 pl-9 rounded-xl border border-zinc-300 text-xs font-bold text-black outline-hidden bg-white"
              autoFocus
            />
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-zinc-500 hover:text-black cursor-pointer bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* Class Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setSelectedClass('All')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                selectedClass === 'All'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300'
              }`}
            >
              All ({allStudents.length})
            </button>

            {classList.map((c) => (
              <button
                key={c.class_name}
                onClick={() => setSelectedClass(c.class_name)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedClass === c.class_name
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300'
                }`}
              >
                {c.class_name} ({c.students.length})
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-3.5 sm:p-5 scrollbar-none">
          {isLoading ? (
            <div className="py-16 text-center text-zinc-500 text-xs font-bold flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-black border-t-transparent animate-spin" />
              <span>Loading student directory...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center space-y-1.5">
              <Users className="w-10 h-10 text-zinc-400 mx-auto" />
              <p className="text-xs font-bold text-black">No students found matching "{searchQuery}"</p>
              <p className="text-[11px] text-zinc-500">Check spelling or switch to "All".</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-black shadow-xs scrollbar-none">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-100 border-b border-black text-black font-black uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 w-14 text-center">Initial</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Student ID</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.student_id}
                      onClick={() => {
                        onSelectStudent(student);
                        onClose();
                      }}
                      className="hover:bg-zinc-100/90 transition-colors cursor-pointer group"
                    >
                      <td className="py-2 px-3 text-center">
                        <div className="w-8 h-8 rounded-full bg-black text-white mx-auto flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform border border-black">
                          {getFirstLetter(student.full_name)}
                        </div>
                      </td>

                      <td className="py-2 px-3 font-bold text-black text-xs group-hover:underline">
                        {student.full_name}
                      </td>

                      <td className="py-2 px-3 text-zinc-700">
                        <span className="inline-block bg-zinc-100 px-2 py-0.5 rounded text-[11px] border border-zinc-300 font-medium">
                          {student.class_name}
                        </span>
                      </td>

                      <td className="py-2 px-3">
                        <span className="font-mono text-[11px] font-bold text-black bg-zinc-100 px-2 py-0.5 rounded border border-black">
                          {student.student_id}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudent(student);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-black group-hover:bg-zinc-800 text-white font-bold text-[10px] inline-flex items-center gap-1 transition-all cursor-pointer border border-black shadow-xs"
                        >
                          Select
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-600 font-medium">
          <span>Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}. Tap any row to select.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-zinc-300 hover:bg-zinc-200 text-black font-semibold transition-colors cursor-pointer text-[11px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
