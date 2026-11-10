import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService, attendanceService } from '../services/api';
import { useCamera } from '../hooks/useCamera';
import CameraCapture from '../components/CameraCapture';
import ClassDirectoryModal from '../components/ClassDirectoryModal';
import { 
  Search, 
  Send, 
  Loader2, 
  AlertCircle, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle,
  Check
} from 'lucide-react';

export default function AttendancePage() {
  const navigate = useNavigate();

  const [studentIdInput, setStudentIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [student, setStudent] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isClassDirectoryOpen, setIsClassDirectoryOpen] = useState(false);

  const [allStudentsList, setAllStudentsList] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    videoRef,
    canvasRef,
    isCameraOpen,
    isStreaming,
    capturedPhoto,
    capturedBlob,
    error: cameraError,
    hasCamera,
    startCamera,
    stopCamera,
    capturePhoto,
    retakePhoto,
    resetCamera
  } = useCamera();

  useEffect(() => {
    studentService.getAllStudents()
      .then((res) => {
        if (res.success && res.students) {
          setAllStudentsList(res.students);
        }
      })
      .catch((err) => {
        console.warn('Could not pre-fetch students for live filter:', err);
      });
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setStudentIdInput(val);
    setSearchError(null);

    const q = val.trim().toLowerCase();
    if (q.length > 0) {
      const matches = allStudentsList.filter((s) => {
        const idMatch = s.student_id && s.student_id.toLowerCase().includes(q);
        const nameMatch = s.full_name && s.full_name.toLowerCase().includes(q);
        const classMatch = s.class_name && s.class_name.toLowerCase().includes(q);
        return idMatch || nameMatch || classMatch;
      });
      setFilteredStudents(matches);
      setShowSuggestions(true);
    } else {
      setFilteredStudents([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestedStudent = (selStudent) => {
    setStudentIdInput(selStudent.student_id);
    setShowSuggestions(false);
    handleSearchStudent(null, selStudent.student_id);
  };

  // search by id
  const handleSearchStudent = async (e, directId = null) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);

    const idToSearch = (directId || studentIdInput).trim();
    if (!idToSearch) {
      setSearchError('Please enter a Student ID Card Number.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setStudent(null);
    setAlreadySubmittedToday(false);
    setTodayAttendance(null);
    setSubmitError(null);
    resetCamera();

    try {
      const response = await studentService.getStudentById(idToSearch);

      if (response.success && response.student) {
        setStudent(response.student);

        try {
          const todayRes = await attendanceService.getTodayAttendance();
          if (todayRes.success && todayRes.attendance) {
            const alreadyRecord = todayRes.attendance.find(
              (a) => a.student_id.toUpperCase() === response.student.student_id.toUpperCase()
            );

            if (alreadyRecord) {
              setAlreadySubmittedToday(true);
              setTodayAttendance(alreadyRecord);
            }
          }
        } catch (checkErr) {
          console.warn('Could not verify today attendance duplicate:', checkErr);
        }
      } else {
        setSearchError('Student ID Not Found. Please Check Your Student ID Card.');
      }
    } catch (err) {
      console.error('Search student error:', err);
      const msg = err.response?.data?.message || 'Student ID Not Found. Please Check Your Student ID Card.';
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmitAttendance = async () => {
    if (!student) {
      setSubmitError('Please enter and verify your student ID first.');
      return;
    }

    if (!capturedPhoto && !capturedBlob) {
      setSubmitError('Face photo is required. Please capture your photo before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('student_id', student.student_id);

      if (capturedBlob) {
        formData.append('face_photo', capturedBlob, `attendance_${student.student_id}.jpg`);
      } else {
        const res = await fetch(capturedPhoto);
        const blob = await res.blob();
        formData.append('face_photo', blob, `attendance_${student.student_id}.jpg`);
      }

      const response = await attendanceService.submitAttendance(formData);

      if (response.success) {
        navigate('/success', {
          state: {
            attendance: response.attendance,
            student
          }
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit attendance. Please try again.';
      if (msg.includes('Already Submitted')) {
        setAlreadySubmittedToday(true);
        navigate('/already-submitted', {
          state: {
            student,
            message: msg,
            attendance: err.response?.data?.attendance
          }
        });
      } else {
        setSubmitError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStudentIdInput('');
    setStudent(null);
    setSearchError(null);
    setAlreadySubmittedToday(false);
    setTodayAttendance(null);
    setSubmitError(null);
    setShowSuggestions(false);
    resetCamera();
  };

  const currentStep = !student ? 1 : !capturedPhoto ? 2 : 3;

  useEffect(() => {
    if (currentStep === 2 && student && !capturedPhoto && !alreadySubmittedToday) {
      startCamera();
    }
  }, [currentStep, student, capturedPhoto, alreadySubmittedToday, startCamera]);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-zinc-50 bg-dot-pattern py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-wider border border-black shadow-xs">
            <Sparkles className="w-3 h-3 text-white" />
            Attendance
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">
            Student Attendance
          </h1>
          <p className="text-zinc-500 text-xs max-w-md mx-auto font-normal">
            Mark your daily school attendance in seconds.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-md border border-zinc-300 p-1 rounded-xl shadow-xs grid grid-cols-3 gap-1.5 max-w-lg mx-auto">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => currentStep > 1 && handleReset()}
            className={`flex items-center justify-center sm:justify-start gap-1.5 lg:gap-3 p-2 rounded-lg transition-all text-left ${
              currentStep === 1
                ? 'bg-black text-white shadow-xs font-bold'
                : currentStep > 1
                ? 'bg-zinc-100 text-black hover:bg-zinc-200 cursor-pointer font-bold'
                : 'bg-transparent text-zinc-400 font-medium'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              currentStep === 1 ? 'bg-white text-black' : currentStep > 1 ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-600'
            }`}>
              {currentStep > 1 ? <Check className="w-3 h-3" /> : '1'}
            </span>
            <span className="text-[11px] truncate">Enter ID</span>
          </button>

          <button
            type="button"
            disabled={currentStep <= 2}
            onClick={() => currentStep === 3 && retakePhoto()}
            className={`flex items-center justify-center sm:justify-start gap-1.5 lg:gap-3 p-2 rounded-lg transition-all text-left ${
              currentStep === 2
                ? 'bg-black text-white shadow-xs font-bold'
                : currentStep > 2
                ? 'bg-zinc-100 text-black hover:bg-zinc-200 cursor-pointer font-bold'
                : 'bg-transparent text-zinc-400 font-medium'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              currentStep === 2 ? 'bg-white text-black' : currentStep > 2 ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-600'
            }`}>
              {currentStep > 2 ? <Check className="w-3 h-3" /> : '2'}
            </span>
            <span className="text-[11px] truncate">Camera</span>
          </button>

          <div
            className={`flex items-center justify-center sm:justify-start gap-1.5 lg:gap-3 p-2 rounded-lg transition-all ${
              currentStep === 3 ? 'bg-black text-white shadow-xs font-bold' : 'bg-transparent text-zinc-400 font-medium'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              currentStep === 3 ? 'bg-white text-black' : 'bg-zinc-200 text-zinc-600'
            }`}>3</span>
            <span className="text-[11px] truncate">Submit</span>
          </div>
        </div>

        {/* enter name or id*/}
        {currentStep === 1 && !alreadySubmittedToday && (
          <div className="bg-white rounded-2xl border border-zinc-300 p-5 sm:p-7 shadow-lg transition-all animate-fade-in relative overflow-visible">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-black rounded-t-2xl" />

            <div className="flex items-center justify-between mb-4 pt-0.5">
              <div>
                <label htmlFor="studentIdInput" className="block text-xs sm:text-sm font-bold text-black">
                  Enter Student ID Card Number
                </label>
              </div>
            </div>

            <form onSubmit={(e) => handleSearchStudent(e)} className="space-y-3.5">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <input
                    id="studentIdInput"
                    type="text"
                    value={studentIdInput}
                    onChange={handleInputChange}
                    onFocus={() => {
                      if (studentIdInput.trim() && filteredStudents.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Enter ID or Student Name"
                    className="w-full h-11 px-3.5 pl-9 pr-9 rounded-xl border focus:border-black text-xs sm:text-sm font-bold font-sans placeholder:text-zinc-400 transition-all outline-hidden bg-zinc-50/50"
                    autoFocus
                    autoComplete="off"
                  />
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />

                  {studentIdInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setStudentIdInput('');
                        setShowSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black font-bold text-xs p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}

                  {showSuggestions && filteredStudents.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border shadow-xl z-30 max-h-60 overflow-y-auto scrollbar-none divide-y divide-zinc-200 animate-scale-up">
                      <div className="p-2 bg-black text-white text-[10px] font-bold flex items-center justify-between sticky top-0 z-10">
                        <span>Matching Students ({filteredStudents.length})</span>
                      </div>
                      {filteredStudents.map((s) => (
                        <div
                          key={s.student_id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSuggestedStudent(s);
                          }}
                          className="p-2.5 hover:bg-zinc-100 transition-colors cursor-pointer flex items-center justify-between gap-2.5 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform border border-black">
                              {s.full_name?.trim().charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-black group-hover:underline">
                                {s.full_name}
                              </div>
                              <div className="text-[10px] text-zinc-600 flex items-center gap-1.5 mt-0.5">
                                <span className="font-bold bg-zinc-100 px-1 py-0.2 rounded border border-zinc-400 text-black">
                                  {s.student_id}
                                </span>
                                <span className="text-zinc-500">{s.class_name}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="px-2.5 py-1 rounded-lg bg-black group-hover:bg-zinc-800 text-white text-[10px] font-bold inline-flex items-center gap-1 border border-black cursor-pointer shrink-0"
                          >
                            Select &rarr;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching || !studentIdInput.trim()}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-bold transition-all hover:scale-[1.01] active:scale-[0.99] text-xs cursor-pointer border border-black shadow-sm"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Search Student
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsClassDirectoryOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-black text-[11px] font-semibold transition-all border border-zinc-300 cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-black" />
                  Forgot Your Student ID? Look Up Class Directory
                </button>

              </div>
            </form>

            {/* Error Alert */}
            {searchError && (
              <div className="mt-4 p-3 rounded-xl bg-zinc-100 border border-black text-black flex items-start justify-between gap-2.5 animate-shake text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-black text-xs">{searchError}</h4>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      Check your school ID card format (e.g., STU-1003).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/not-found', { state: { attemptedId: studentIdInput } })}
                  className="text-[11px] text-black underline font-bold shrink-0 hover:text-zinc-700 cursor-pointer"
                >
                  Help &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {alreadySubmittedToday && (
          <div className="bg-white rounded-2xl border border-black p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-black" />
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-black">
                  Attendance Already Submitted Today.
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Already recorded for today
                  {todayAttendance?.attendance_time && ` at ${todayAttendance.attendance_time}`}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/already-submitted', { state: { student, attendance: todayAttendance } })}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer border border-black"
              >
                View Record
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 border border-black text-black text-xs font-bold transition-colors cursor-pointer"
              >
                Next Student
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && student && !alreadySubmittedToday && (
          <div className="space-y-3.5 animate-fade-in">
            <div className="flex items-center justify-between px-1">
              <div className="text-[10px] font-bold uppercase text-zinc-600 tracking-wider flex items-center gap-2">
                <span>Step 2: Face Photo Capture</span>
                <span className="font-mono text-black bg-white px-1.5 py-0.2 rounded text-[10px] font-bold border border-black">
                  ID: {student.student_id}
                </span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] text-zinc-600 hover:text-black font-bold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-md border border-zinc-300 shadow-xs"
              >
                <RotateCcw className="w-3 h-3" />
                Change Student ID
              </button>
            </div>

            <CameraCapture
              videoRef={videoRef}
              canvasRef={canvasRef}
              isCameraOpen={isCameraOpen}
              isStreaming={isStreaming}
              capturedPhoto={capturedPhoto}
              error={cameraError}
              hasCamera={hasCamera}
              startCamera={startCamera}
              stopCamera={stopCamera}
              capturePhoto={capturePhoto}
              retakePhoto={retakePhoto}
            />
          </div>
        )}

        {currentStep === 3 && student && capturedPhoto && !alreadySubmittedToday && (
          <div className="bg-white rounded-2xl border border-zinc-300 p-5 sm:p-7 shadow-lg animate-fade-in space-y-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-black" />

            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle className="w-3 h-3" />
                  Step 3: Review &amp; Submit
                </div>
                <h2 className="text-base sm:text-lg font-black text-black mt-1 tracking-tight">
                  Confirm Attendance Submission
                </h2>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-zinc-600 hover:text-black font-bold flex items-center gap-1 cursor-pointer bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Start Over
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              <div className="space-y-3 flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-full overflow-hidden border-3 border-black bg-black shadow-xl ring-6 ring-zinc-100">
                  <img
                    src={capturedPhoto}
                    alt="Captured face photo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 inset-x-0 flex justify-center">
                    <span className="bg-black/90 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-zinc-700 shadow-sm">
                      <CheckCircle className="w-3 h-3 text-white" />
                      Face Captured
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={retakePhoto}
                  className="py-1.5 px-4 rounded-xl border border-black hover:bg-zinc-100 text-black text-[11px] font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retake Photo
                </button>
              </div>

              <div className="space-y-4 bg-zinc-50 p-4 sm:p-5 rounded-2xl border border-zinc-300">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Attendance Summary
                  </span>
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <span className="text-[11px] text-zinc-600 font-medium">Student Name:</span>
                    <span className="text-xs font-black text-black">{student.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <span className="text-[11px] text-zinc-600 font-medium">Student ID:</span>
                    <span className="font-mono text-[11px] font-black bg-white px-2 py-0.5 rounded border border-black text-black shadow-xs">
                      {student.student_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <span className="text-[11px] text-zinc-600 font-medium">Class:</span>
                    <span className="text-[11px] font-bold bg-zinc-200 text-black px-2 py-0.5 rounded border border-zinc-300">{student.class_name}</span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-zinc-600 font-medium">Official Time:</span>
                    <span className="text-[11px] font-bold text-black flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Server Verified
                    </span>
                  </div>
                </div>

                {/* Error */}
                {submitError && (
                  <div className="p-2.5 rounded-lg bg-zinc-200 border border-black text-black text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-black shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleSubmitAttendance}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer border border-black shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving to Image...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Submit Attendance
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-zinc-500 font-medium">
                    Photo saved Already!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <ClassDirectoryModal
        isOpen={isClassDirectoryOpen}
        onClose={() => setIsClassDirectoryOpen(false)}
        onSelectStudent={(selStudent) => {
          setStudentIdInput(selStudent.student_id);
          handleSearchStudent(null, selStudent.student_id);
        }}
      />
    </div>
  );
}
