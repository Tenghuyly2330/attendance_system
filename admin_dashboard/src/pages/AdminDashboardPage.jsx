/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  UserX, 
  Clock, 
  Percent, 
  Download, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  Lock, 
  LogOut, 
  AlertCircle,
  RefreshCw,
  Camera,
  ArrowLeft,
  School,
  ChevronRight,
  Radio,
  Calendar
} from 'lucide-react';
import { 
  adminService, 
  attendanceService, 
  studentService, 
  classService, 
  getFullPhotoUrl 
} from '../services/api';

// Helper to determine if a class is currently in study session
function getStudyTimeStatus(studyTimeStr) {
  if (!studyTimeStr) return { isLive: false, label: 'Study Time Not Set', status: 'unset' };
  try {
    const parts = studyTimeStr.split('-').map((s) => s.trim());
    if (parts.length !== 2) return { isLive: false, label: studyTimeStr, status: 'custom' };

    const parseMinutes = (tStr) => {
      const match = tStr.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
      if (!match) return null;
      let [_, h, m, period] = match;
      let hours = parseInt(h, 10);
      const minutes = parseInt(m, 10);
      if (period) {
        const p = period.toUpperCase();
        if (p === 'PM' && hours < 12) hours += 12;
        if (p === 'AM' && hours === 12) hours = 0;
      }
      return hours * 60 + minutes;
    };

    const start = parseMinutes(parts[0]);
    const end = parseMinutes(parts[1]);
    if (start === null || end === null) return { isLive: false, label: studyTimeStr, status: 'custom' };

    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();

    if (current >= start && current <= end) {
      return { isLive: true, label: 'LIVE IN SESSION', status: 'live' };
    } else if (current < start) {
      return { isLive: false, label: 'Upcoming Today', status: 'upcoming' };
    } else {
      return { isLive: false, label: 'Session Completed', status: 'completed' };
    }
  } catch (e) {
    return { isLive: false, label: studyTimeStr, status: 'custom' };
  }
}

export default function AdminDashboardPage() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('classrooms');

  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [classroomData, setClassroomData] = useState(null);
  const [classroomStatusFilter, setClassroomStatusFilter] = useState('All');
  const [isLoadingClassroom, setIsLoadingClassroom] = useState(false);

  const [selectedDirectoryClass, setSelectedDirectoryClass] = useState('All');

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const [classes, setClasses] = useState([]);
  const [classStats, setClassStats] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);

  const [studentForm, setStudentForm] = useState({
    id: null,
    student_id: '',
    full_name: '',
    class_name: '',
    profile_photo: null,
    custom_class: ''
  });

  const [classForm, setClassForm] = useState({
    id: null,
    class_name: '',
    description: '',
    study_time: '08:00 AM - 11:30 AM'
  });
  const [formError, setFormError] = useState(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('attendance_admin_token');
    if (token) {
      setIsAdminLoggedIn(true);
    }
  }, []);
  const fetchClassesAndStats = async (targetDate = filterDate) => {
    try {
      const statsRes = await adminService.getStats({ date: targetDate });
      if (statsRes.success) {
        setClassStats(statsRes.class_stats || []);
      }
      const classesRes = await classService.getAllClasses();
      if (classesRes.success) {
        setClasses(classesRes.classes);
      }
    } catch (e) {
      console.warn('Stats fetch error:', e);
    }
  };

  const fetchClassroomAttendance = async (className, status = classroomStatusFilter, date = filterDate) => {
    if (!className) return;
    setIsLoadingClassroom(true);
    try {
      const params = { date };
      if (status !== 'All') params.status = status;
      const res = await classService.getClassAttendance(className, params);
      if (res.success) {
        setClassroomData(res);
      }
    } catch (e) {
      console.warn('Classroom attendance fetch error:', e);
    } finally {
      setIsLoadingClassroom(false);
    }
  };

  const handleOpenClassroom = (className) => {
    setSelectedClassroom(className);
    setClassroomStatusFilter('All');
    fetchClassroomAttendance(className, 'All', filterDate);
  };

  const handleBackToAllClassrooms = () => {
    setSelectedClassroom(null);
    setClassroomData(null);
  };

  const fetchStudents = async () => {
    try {
      const res = await studentService.getAllStudents();
      if (res.success) {
        setStudents(res.students);
      }
    } catch (e) {
      console.warn('Students fetch error:', e);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchClassesAndStats(filterDate);
      fetchStudents();
    }
  }, [fetchClassesAndStats, filterDate, isAdminLoggedIn]);

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchClassesAndStats(filterDate);
      if (selectedClassroom) {
        fetchClassroomAttendance(selectedClassroom, classroomStatusFilter, filterDate);
      }
    }
  }, [filterDate, selectedClassroom, classroomStatusFilter]);

  // Handle Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await adminService.login({
        username: adminUsername,
        password: adminPassword
      });
      if (res.success) {
        setIsAdminLoggedIn(true);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed. Check username and password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Admin Logout
  const handleLogout = () => {
    adminService.logout();
    setIsAdminLoggedIn(false);
  };

  // CSV Export for Classroom
  const handleExportClassroomCSV = (className = selectedClassroom) => {
    if (!className) return;
    const params = {
      date: filterDate,
      class_name: className
    };
    if (classroomStatusFilter !== 'All') {
      params.status = classroomStatusFilter;
    }
    window.location.href = attendanceService.exportCSVUrl(params);
  };

  // Reset Test Attendance
  const handleResetAttendance = async () => {
    if (!window.confirm("Reset today's attendance logs for fresh testing?")) return;
    try {
      await attendanceService.resetAttendance();
      fetchClassesAndStats(filterDate);
      if (selectedClassroom) {
        fetchClassroomAttendance(selectedClassroom, classroomStatusFilter, filterDate);
      }
      alert('Attendance logs cleared.');
    } catch (e) {
      alert('Failed to reset attendance.');
    }
  };

  // Student CRUD Handlers
  const handleOpenAddStudent = (preselectedClass = null) => {
    const targetClass = preselectedClass 
      || (selectedDirectoryClass !== 'All' ? selectedDirectoryClass : classes[0]?.class_name || 'Grade 10-A');
    setStudentForm({
      id: null,
      student_id: '',
      full_name: '',
      class_name: targetClass,
      profile_photo: null,
      custom_class: ''
    });
    setFormError(null);
    setShowAddStudentModal(true);
  };

  const handleOpenEditStudent = (s) => {
    setStudentForm({
      id: s.id,
      student_id: s.student_id,
      full_name: s.full_name,
      class_name: s.class_name,
      profile_photo: null,
      custom_class: ''
    });
    setFormError(null);
    setShowEditStudentModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setIsSubmittingForm(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('student_id', studentForm.student_id);
    formData.append('full_name', studentForm.full_name);
    formData.append('class_name', studentForm.class_name);
    if (studentForm.profile_photo) {
      formData.append('profile_photo', studentForm.profile_photo);
    }

    try {
      if (studentForm.id) {
        await studentService.updateStudent(studentForm.id, formData);
      } else {
        await studentService.createStudent(formData);
      }
      setShowAddStudentModal(false);
      setShowEditStudentModal(false);
      fetchStudents();
      fetchClassesAndStats(filterDate);
      if (selectedClassroom) {
        fetchClassroomAttendance(selectedClassroom, classroomStatusFilter, filterDate);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save student.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"?`)) return;
    try {
      await studentService.deleteStudent(id);
      fetchStudents();
      fetchClassesAndStats(filterDate);
      if (selectedClassroom) {
        fetchClassroomAttendance(selectedClassroom, classroomStatusFilter, filterDate);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student.');
    }
  };

  // Classroom CRUD Handlers (with Study Time)
  const handleOpenAddClass = () => {
    setClassForm({
      id: null,
      class_name: '',
      description: '',
      study_time: '08:00 AM - 11:30 AM'
    });
    setFormError(null);
    setShowAddClassModal(true);
  };

  const handleOpenEditClass = (c) => {
    setClassForm({
      id: c.id,
      class_name: c.class_name,
      description: c.description || '',
      study_time: c.study_time || '08:00 AM - 11:30 AM'
    });
    setFormError(null);
    setShowEditClassModal(true);
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (!classForm.class_name.trim()) return;
    setIsSubmittingForm(true);
    setFormError(null);
    try {
      if (classForm.id) {
        await classService.updateClass(classForm.id, classForm);
        setShowEditClassModal(false);
      } else {
        await classService.createClass(classForm);
        setShowAddClassModal(false);
      }
      fetchClassesAndStats(filterDate);
      if (selectedClassroom === classForm.class_name) {
        fetchClassroomAttendance(classForm.class_name, classroomStatusFilter, filterDate);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save classroom.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleDeleteClass = async (id, name) => {
    if (!window.confirm(`Delete classroom "${name}"?`)) return;
    try {
      await classService.deleteClass(id);
      fetchClassesAndStats(filterDate);
      if (selectedClassroom === name) {
        setSelectedClassroom(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete class.');
    }
  };

  // If not logged in, show sleek Monochrome Admin Login Form
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-zinc-950 py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border-2 border-black shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-black text-white mx-auto flex items-center justify-center">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-black">Admin Authentication</h2>
            <p className="text-xs text-zinc-600">
              Sign in to monitor live classroom attendance, study hours, and absent students.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-black uppercase mb-1">
                Admin Username
              </label>
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-black outline-hidden font-bold text-black text-xs sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-black uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-black outline-hidden font-bold text-black text-xs sm:text-sm"
                required
              />
              <p className="text-[11px] text-zinc-500 mt-1">Default demo: <code>admin</code> / <code>admin123</code></p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-zinc-100 border-2 border-black text-black text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm border-2 border-black transition-colors cursor-pointer"
            >
              {isLoggingIn ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <a href="http://localhost:3000" className="text-xs text-black hover:underline font-bold">
              &larr; Open Attendance Kiosk (Port 3000)
            </a>
          </div>
        </div>
      </div>
    );
  }

  const distinctDirectoryClasses = Array.from(
    new Set([
      ...classes.map((c) => c.class_name),
      ...students.map((s) => s.class_name)
    ].filter(Boolean))
  );

  const displayedDirectoryClasses = selectedDirectoryClass === 'All'
    ? distinctDirectoryClasses
    : distinctDirectoryClasses.filter((c) => c === selectedDirectoryClass);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">
              Admin Attendance Dashboard
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              Live attendance monitoring and absent tracking by classroom with scheduled study times.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* <button
              onClick={() => {
                fetchClassesAndStats(filterDate);
                fetchStudents();
                if (selectedClassroom) {
                  fetchClassroomAttendance(selectedClassroom, classroomStatusFilter, filterDate);
                }
              }}
              className="p-2 rounded-xl border-2 border-black bg-white hover:bg-zinc-100 text-black transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetAttendance}
              className="px-3 py-1.5 rounded-xl border-2 border-zinc-400 bg-white hover:bg-zinc-100 text-black text-xs font-bold transition-colors cursor-pointer"
              title="Reset today's logs for fresh testing"
            >
              Clear Logs
            </button> */}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 border-2 border-black text-black text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b-2 border-black">
          <button
            onClick={() => {
              setActiveTab('classrooms');
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black border-b-4 transition-colors cursor-pointer ${
              activeTab === 'classrooms'
                ? 'border-black text-black'
                : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            Classroom Hub
          </button>
          <button
            onClick={() => {
              setActiveTab('students');
              setSelectedClassroom(null);
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black border-b-4 transition-colors cursor-pointer ${
              activeTab === 'students'
                ? 'border-black text-black'
                : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            Student Directory ({students.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('classes');
              setSelectedClassroom(null);
            }}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black border-b-4 transition-colors cursor-pointer ${
              activeTab === 'classes'
                ? 'border-black text-black'
                : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            Classroom Settings & Study Times ({classes.length})
          </button>
        </div>


        {activeTab === 'classrooms' && (
          <div className="space-y-5">
            
            {selectedClassroom ? (
              <div className="bg-white rounded-2xl border-2 border-black p-4 sm:p-6 space-y-5 animate-fade-in shadow-xs">
                
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-200">
                  <button
                    onClick={handleBackToAllClassrooms}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-zinc-100 text-black text-xs font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Classrooms</span>
                  </button>

                  {classes.map((c) => {
                    const statusInfo = getStudyTimeStatus(c.study_time);
                    const isCurrent = selectedClassroom === c.class_name;
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleOpenClassroom(c.class_name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer border-2 ${
                          isCurrent
                            ? 'bg-black text-white border-black'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:border-black'
                        }`}
                      >
                        {statusInfo.isLive && (
                          <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white' : 'bg-black'} animate-pulse`} />
                        )}
                        <span>{c.class_name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Classroom Detailed Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <School className="w-5 h-5 text-black" />
                      <h2 className="text-lg sm:text-xl font-black text-black">
                        Classroom: {selectedClassroom}
                      </h2>

                      {/* Live Session Status Badge */}
                      {(() => {
                        const currentClassObj = classes.find((c) => c.class_name === selectedClassroom);
                        const statusInfo = getStudyTimeStatus(currentClassObj?.study_time);
                        return statusInfo.isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black text-white text-[11px] font-bold shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            LIVE IN SESSION
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-400 text-black text-[11px] font-bold">
                            {statusInfo.label}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Study Time Display */}
                    <div className="flex items-center gap-2 text-xs text-zinc-700">
                      <div className="flex items-center gap-1 font-bold text-black">
                        <Clock className="w-3.5 h-3.5 text-black" />
                        <span>Study Time:</span>
                        <span className="font-mono bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">
                          {classes.find((c) => c.class_name === selectedClassroom)?.study_time || '08:00 AM - 11:30 AM'}
                        </span>
                      </div>
                      <span className="text-zinc-300">|</span>
                      <span className="text-zinc-500">
                        {classroomData?.class_info?.description || 'Active classroom attendance roster'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-2.5 py-1 rounded-lg border-2 border-black text-xs font-bold text-black outline-hidden"
                      />
                    </div>

                    <button
                      onClick={() => handleExportClassroomCSV(selectedClassroom)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-zinc-800 text-white text-xs font-bold border-2 border-black transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Class CSV
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border-2 border-black bg-zinc-50">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase block">Total Enrolled</span>
                    <span className="text-xl font-black text-black">{classroomData?.stats?.total_enrolled || 0}</span>
                    <span className="text-[10px] text-zinc-500 block">Class Roster</span>
                  </div>

                  <div className="p-3.5 rounded-xl border-2 border-black bg-zinc-50">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase block">Present Today</span>
                    <span className="text-xl font-black text-black">{classroomData?.stats?.present_today || 0}</span>
                    <span className="text-[10px] text-zinc-500 block">Checked In</span>
                  </div>

                  <div className={`p-3.5 rounded-xl border-2 ${
                    (classroomData?.stats?.absent_today || 0) > 0
                      ? 'border-black bg-white ring-2 ring-black/10'
                      : 'border-zinc-300 bg-zinc-50'
                  }`}>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase block">Absent Today</span>
                    <span className="text-xl font-black text-black">{classroomData?.stats?.absent_today || 0}</span>
                    <span className="text-[10px] text-zinc-500 block">Missing Check-in</span>
                  </div>

                  <div className="p-3.5 rounded-xl border-2 border-black bg-zinc-50">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase block">Turnout Rate</span>
                    <span className="text-xl font-black text-black">{classroomData?.stats?.attendance_rate || 0}%</span>
                    <span className="text-[10px] text-zinc-500 block">{classroomData?.stats?.late_today || 0} Late arrivals</span>
                  </div>
                </div>

                {/* Status Filter Tabs for this Classroom */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200">
                  <span className="text-[10px] font-black text-zinc-500 uppercase mr-1">Roster Filter:</span>
                  <button
                    type="button"
                    onClick={() => setClassroomStatusFilter('All')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      classroomStatusFilter === 'All'
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-black'
                    }`}
                  >
                    All Enrolled ({classroomData?.stats?.total_enrolled || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassroomStatusFilter('Present')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      classroomStatusFilter === 'Present'
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-black'
                    }`}
                  >
                    Present ({classroomData?.stats?.present_today || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassroomStatusFilter('Absent')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-colors cursor-pointer ${
                      classroomStatusFilter === 'Absent'
                        ? 'bg-white text-black border-black font-black'
                        : 'bg-white text-zinc-700 border-dashed border-zinc-400 hover:border-black'
                    }`}
                  >
                    Absent ({classroomData?.stats?.absent_today || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassroomStatusFilter('Late')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      classroomStatusFilter === 'Late'
                        ? 'bg-zinc-800 text-white border-zinc-800'
                        : 'bg-white text-zinc-700 border-zinc-300 hover:border-black'
                    }`}
                  >
                    Late ({classroomData?.stats?.late_today || 0})
                  </button>
                </div>

                {/* Classroom Students Live Roster Table */}
                <div className="overflow-x-auto rounded-xl border-2 border-black">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-100 border-b-2 border-black text-black font-black uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-3">Avatar</th>
                        <th className="py-2.5 px-3">Student ID</th>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Check-in Time</th>
                        <th className="py-2.5 px-3 text-center">Face Photo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {isLoadingClassroom ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-zinc-500 font-bold">
                            Loading classroom attendance...
                          </td>
                        </tr>
                      ) : (classroomData?.students || []).length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-zinc-500 font-bold">
                            No students found matching this status filter in {selectedClassroom}.
                          </td>
                        </tr>
                      ) : (
                        (classroomData?.students || []).map((s) => {
                          const firstLetter = (s.full_name || 'S').trim().charAt(0).toUpperCase();
                          return (
                            <tr key={s.student_id} className="hover:bg-zinc-100 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="w-8 h-8 rounded-full bg-black text-white font-black text-xs flex items-center justify-center shrink-0 border border-black">
                                  {firstLetter}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-black">
                                {s.student_id}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-black">
                                {s.full_name}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[10px] sm:text-[11px] ${
                                    s.status === 'Late'
                                      ? 'bg-zinc-200 text-black border border-black'
                                      : s.status === 'Absent'
                                      ? 'bg-white text-black border-2 border-dashed border-black'
                                      : 'bg-black text-white'
                                  }`}
                                >
                                  {s.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-black">
                                {s.attendance_time ? (
                                  s.attendance_time
                                ) : (
                                  <span className="text-zinc-400 font-normal italic text-[11px]">Not Checked In</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {s.face_photo && s.face_photo !== 'N/A' ? (
                                  <button
                                    onClick={() => setSelectedPhoto(getFullPhotoUrl(s.face_photo))}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black hover:bg-zinc-800 text-white font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Photo
                                  </button>
                                ) : (
                                  <span className="text-zinc-400 text-[10px] sm:text-[11px] italic">No Photo</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border-2 border-black">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-black flex items-center gap-2">
                      <School className="w-4 h-4 text-black" />
                      Classroom Hub (Select a Class for Live Attendance)
                    </h2>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      Each classroom has designated study hours. Enter any class to monitor live check-ins and absent tracking.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500">Date:</span>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border-2 border-black text-xs font-bold text-black outline-hidden"
                    />
                  </div>
                </div>

                {/* Classroom Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                  {classes.map((c) => {
                    const statusInfo = getStudyTimeStatus(c.study_time);
                    const classStat = classStats.find((cs) => cs.class_name === c.class_name) || {
                      total_enrolled: c.total_students || 0,
                      present_today: c.present_today || 0,
                      absent_today: c.absent_today || 0,
                      late_today: c.late_today || 0,
                      attendance_rate: c.attendance_rate || 0
                    };

                    return (
                      <div
                        key={c.id}
                        className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 bg-white shadow-xs hover:shadow-md ${
                          statusInfo.isLive ? 'border-black ring-2 ring-black/10' : 'border-zinc-300 hover:border-black'
                        }`}
                      >
                        <div className="space-y-2">
                          
                          {/* Title & Live Status */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-base text-black">{c.class_name}</span>
                              </div>
                              <p className="text-xs text-zinc-600 mt-0.5">{c.description || 'Academic Classroom'}</p>
                            </div>

                            {/* Live Badge */}
                            {statusInfo.isLive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black text-white text-[10px] font-bold shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                LIVE IN SESSION
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-700 text-[10px] font-bold">
                                {statusInfo.label}
                              </span>
                            )}
                          </div>

                          {/* Study Time Badge */}
                          <div className="inline-flex items-center gap-1.5 bg-zinc-100 border border-zinc-300 px-2.5 py-1 rounded-lg text-black text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 text-black" />
                            <span>Study Time:</span>
                            <span className="font-mono">{c.study_time || '08:00 AM - 11:30 AM'}</span>
                          </div>

                          {/* Turnout Progress Bar */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-zinc-600">Attendance Turnout</span>
                              <span className="text-black">{classStat.attendance_rate || 0}%</span>
                            </div>
                            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                              <div
                                className="bg-black h-full transition-all duration-300"
                                style={{ width: `${Math.min(100, classStat.attendance_rate || 0)}%` }}
                              />
                            </div>
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                            <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                              <span className="text-[9px] text-zinc-500 uppercase block font-medium">Enrolled</span>
                              <span className="font-bold text-sm text-black">{classStat.total_enrolled}</span>
                            </div>
                            <div className="bg-black text-white p-2 rounded-lg">
                              <span className="text-[9px] text-zinc-300 uppercase block font-medium">Present</span>
                              <span className="font-bold text-sm">{classStat.present_today}</span>
                            </div>
                            <div className={`p-2 rounded-lg border ${
                              classStat.absent_today > 0 
                                ? 'bg-white text-black border-dashed border-black font-black' 
                                : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                            }`}>
                              <span className="text-[9px] text-zinc-500 uppercase block font-medium">Absent</span>
                              <span className="font-bold text-sm">{classStat.absent_today}</span>
                            </div>
                            <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                              <span className="text-[9px] text-zinc-500 uppercase block font-medium">Late</span>
                              <span className="font-bold text-sm text-black">{classStat.late_today}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenClassroom(c.class_name)}
                          className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <span>Enter Classroom (Live View)</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-4">
            
            <div className="bg-white rounded-2xl border-2 border-black p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-black flex items-center gap-2">
                    <Users className="w-4 h-4 text-black" />
                    Student Directory (By Classroom)
                  </h3>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Search and manage enrolled students categorized by their assigned classrooms with study hours.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="text"
                      value={searchStudentQuery}
                      onChange={(e) => setSearchStudentQuery(e.target.value)}
                      placeholder="Search student or ID..."
                      className="w-full px-3 py-1.5 pl-8 rounded-xl border-2 border-black text-xs font-bold text-black outline-hidden"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <button
                    onClick={() => handleOpenAddStudent()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs border-2 border-black transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Student
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[11px] font-bold text-zinc-500 shrink-0 mr-1">
                    Select Class:
                  </span>

                  <button
                    onClick={() => setSelectedDirectoryClass('All')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer border-2 ${
                      selectedDirectoryClass === 'All'
                        ? 'bg-black text-white border-black'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:border-black'
                    }`}
                  >
                    <span>All Classrooms</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedDirectoryClass === 'All' ? 'bg-white text-black font-black' : 'bg-zinc-200 text-black'
                    }`}>
                      {students.length}
                    </span>
                  </button>

                  {distinctDirectoryClasses.map((cName) => {
                    const classObj = classes.find((c) => c.class_name === cName);
                    const classStudentCount = students.filter((s) => s.class_name === cName).length;
                    const isSelected = selectedDirectoryClass === cName;
                    const statusInfo = getStudyTimeStatus(classObj?.study_time);

                    return (
                      <button
                        key={cName}
                        onClick={() => setSelectedDirectoryClass(cName)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer border-2 ${
                          isSelected
                            ? 'bg-black text-white border-black'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-300 hover:border-black'
                        }`}
                      >
                        {statusInfo.isLive && (
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-black'} animate-pulse`} />
                        )}
                        <span>{cName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-white text-black font-black' : 'bg-zinc-200 text-black'
                        }`}>
                          {classStudentCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {distinctDirectoryClasses.length === 0 && (
              <div className="bg-white rounded-2xl border-2 border-black p-8 text-center space-y-3">
                <p className="text-sm font-bold text-black">No classrooms or students found.</p>
                <button
                  onClick={handleOpenAddClass}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Classroom</span>
                </button>
              </div>
            )}

            {/* List of Classrooms (Grouped Strictly By Class, Not All In One) */}
            <div className="space-y-4">
              {displayedDirectoryClasses.map((cName) => {
                const classObj = classes.find((c) => c.class_name === cName);
                const classStudents = students.filter((s) => s.class_name === cName);
                
                // Filter by search query if any
                const filteredClassStudents = classStudents.filter((s) => {
                  if (!searchStudentQuery.trim()) return true;
                  const q = searchStudentQuery.toLowerCase().trim();
                  return s.full_name?.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q);
                });

                // If searching and this class has 0 matches, skip rendering this class section
                if (searchStudentQuery.trim() && filteredClassStudents.length === 0) {
                  return null;
                }

                const statusInfo = getStudyTimeStatus(classObj?.study_time);

                return (
                  <div
                    key={cName}
                    className="bg-white rounded-2xl border-2 border-black p-4 sm:p-5 space-y-3 shadow-xs"
                  >
                    {/* Class Section Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-zinc-200">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <School className="w-4 h-4 text-black" />
                          <h4 className="text-sm sm:text-base font-black text-black">
                            {cName}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                            {classStudents.length} {classStudents.length === 1 ? 'Student' : 'Students'}
                          </span>
                          
                          {statusInfo.isLive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              LIVE IN SESSION
                            </span>
                          )}
                        </div>

                        {/* Study Time / Schedule */}
                        <div className="flex items-center gap-2 text-xs text-zinc-600 flex-wrap">
                          <div className="flex items-center gap-1 font-mono text-[11px] bg-zinc-100 border border-zinc-300 px-2 py-0.5 rounded text-black font-bold">
                            <Clock className="w-3 h-3 text-black" />
                            <span>Study Time:</span>
                            <span>{classObj?.study_time || '08:00 AM - 11:30 AM'}</span>
                          </div>
                          {classObj?.description && (
                            <>
                              <span className="text-zinc-300">|</span>
                              <span className="text-zinc-500 text-xs">{classObj.description}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Class Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setActiveTab('classrooms');
                            handleOpenClassroom(cName);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-zinc-100 text-black text-xs font-bold transition-colors cursor-pointer"
                          title="Open Live Attendance View for this class"
                        >
                          <Radio className="w-3 h-3 text-black" />
                          <span>Live</span>
                        </button>

                      </div>
                    </div>

                    {filteredClassStudents.length === 0 ? (
                      <div className="p-6 text-center text-zinc-500 bg-zinc-50 rounded-xl border border-dashed border-zinc-300 space-y-2">
                        <p className="text-xs font-bold">
                          {searchStudentQuery.trim()
                            ? `No students matching "${searchStudentQuery}" found in ${cName}.`
                            : `No students enrolled in ${cName} yet.`}
                        </p>
                        {!searchStudentQuery.trim() && (
                          <button
                            onClick={() => handleOpenAddStudent(cName)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Enroll First Student</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border-2 border-black">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-zinc-100 border-b-2 border-black text-black font-black uppercase tracking-wider text-[11px]">
                              <th className="py-2.5 px-3">Avatar</th>
                              <th className="py-2.5 px-3">Student ID</th>
                              <th className="py-2.5 px-3">Full Name</th>
                              <th className="py-2.5 px-3">Classroom</th>
                              <th className="py-2.5 px-3">Total Check-ins</th>
                              <th className="py-2.5 px-3 text-center">Photo</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            {filteredClassStudents.map((s) => {
                              const firstLetter = (s.full_name || 'S').trim().charAt(0).toUpperCase();
                              return (
                                <tr key={s.id} className="hover:bg-zinc-100 transition-colors">
                                  <td className="py-2 px-3">
                                    <div className="w-8 h-8 rounded-full bg-black text-white font-black text-xs flex items-center justify-center shrink-0 border border-black">
                                      {firstLetter}
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 font-mono font-bold text-black">
                                    {s.student_id}
                                  </td>
                                  <td className="py-2 px-3 font-bold text-black">{s.full_name}</td>
                                  <td className="py-2 px-3 text-zinc-700">
                                    <span className="font-bold text-black bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300 text-[11px]">
                                      {s.class_name}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 font-bold text-black">
                                    {s.total_attendances || 0}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    {s.profile_photo && !s.profile_photo.includes('default.svg') ? (
                                      <button
                                        onClick={() => setSelectedPhoto(getFullPhotoUrl(s.profile_photo))}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-black hover:bg-zinc-800 text-white font-bold text-[10px] transition-colors cursor-pointer"
                                      >
                                        <Eye className="w-3 h-3" />
                                        View
                                      </button>
                                    ) : (
                                      <span className="text-zinc-400 text-[10px] italic">Default</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-right space-x-1.5">
                                    <button
                                      onClick={() => handleOpenEditStudent(s)}
                                      className="p-1 rounded-lg text-black hover:bg-zinc-200 transition-colors cursor-pointer"
                                      title="Edit Student"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStudent(s.id, s.full_name)}
                                      className="p-1 rounded-lg text-black hover:bg-zinc-200 transition-colors cursor-pointer"
                                      title="Delete Student"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}

              {searchStudentQuery.trim() && displayedDirectoryClasses.every((cName) => {
                const classStudents = students.filter((s) => s.class_name === cName);
                const q = searchStudentQuery.toLowerCase().trim();
                return !classStudents.some((s) => 
                  s.full_name?.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q)
                );
              }) && (
                <div className="bg-white rounded-2xl border-2 border-black p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-black">
                    No students matching "{searchStudentQuery}" found across any classroom.
                  </p>
                  <button
                    onClick={() => setSearchStudentQuery('')}
                    className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Clear Search Filter
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'classes' && (
          <div className="bg-white rounded-2xl border-2 border-black p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-black">Classrooms & Study Times</h3>
                <p className="text-xs text-zinc-600">Configure class schedules, study hours, and enrolled sections</p>
              </div>
              <button
                onClick={handleOpenAddClass}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs border-2 border-black transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Classroom
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {classes.map((c) => {
                const statusInfo = getStudyTimeStatus(c.study_time);
                return (
                  <div 
                    key={c.id} 
                    className="p-4 rounded-xl border-2 border-black bg-zinc-50 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-black text-black text-sm block">{c.class_name}</span>
                          <p className="text-xs text-zinc-600">{c.description || 'Academic Classroom'}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditClass(c)}
                            className="p-1.5 text-black hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                            title="Edit Study Time & Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClass(c.id, c.class_name)}
                            className="p-1.5 text-black hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                            title="Delete Class"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Study Time Display */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-black font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Study Time:</span>
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-zinc-300">
                            {c.study_time || '08:00 AM - 11:30 AM'}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          statusInfo.isLive ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-700'
                        }`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="pt-1">
                        <span className="text-[11px] font-bold text-black bg-zinc-200 px-2 py-0.5 rounded border border-zinc-300">
                          {c.total_students || 0} Students Enrolled
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleOpenClassroom(c.class_name);
                        setActiveTab('classrooms');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-white hover:bg-zinc-100 text-black border border-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>View Live Attendance</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL: FACE PHOTO PREVIEW --- */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-5 space-y-4 border-2 border-black animate-scale-up">
            <div className="flex items-center justify-between pb-2.5 border-b-2 border-zinc-200">
              <h3 className="font-black text-black text-xs sm:text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-black" />
                Captured Attendance Face Photo
              </h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-xl hover:bg-zinc-100 text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-black">
              <img
                src={selectedPhoto}
                alt="Captured Face"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-center pt-1">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-5 py-2 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD / EDIT STUDENT --- */}
      {(showAddStudentModal || showEditStudentModal) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 border-2 border-black animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-200">
              <h3 className="font-black text-black text-sm sm:text-base">
                {showEditStudentModal ? 'Edit Student Details' : 'Add New Student'}
              </h3>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setShowEditStudentModal(false);
                }}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Student ID Card Number
                </label>
                <input
                  type="text"
                  value={studentForm.student_id}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, student_id: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. STU-1006"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black font-mono font-bold uppercase text-xs text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={studentForm.full_name}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, full_name: e.target.value })
                  }
                  placeholder="e.g. Alexander Pierce"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-bold text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Classroom
                </label>
                <select
                  value={studentForm.class_name}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, class_name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-bold text-black"
                  required
                >
                  <option value="">Select a classroom...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.class_name}>
                      {c.class_name} ({c.study_time})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Profile Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, profile_photo: e.target.files[0] })
                  }
                  className="w-full text-xs text-black file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-2 file:border-black file:font-bold file:bg-zinc-100 hover:file:bg-zinc-200 cursor-pointer"
                />
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-zinc-100 border-2 border-black text-black text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setShowEditStudentModal(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-black hover:bg-zinc-100 border border-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold border-2 border-black cursor-pointer"
                >
                  {isSubmittingForm ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Classroom */}
      {(showAddClassModal || showEditClassModal) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-5 space-y-4 border-2 border-black animate-scale-up">
            <div className="flex items-center justify-between pb-2.5 border-b-2 border-zinc-200">
              <h3 className="font-black text-black text-sm sm:text-base flex items-center gap-2">
                <School className="w-4 h-4 text-black" />
                {showEditClassModal ? 'Edit Classroom & Study Time' : 'Create New Classroom'}
              </h3>
              <button
                onClick={() => {
                  setShowAddClassModal(false);
                  setShowEditClassModal(false);
                }}
                className="p-1 rounded-xl hover:bg-zinc-100 text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Classroom Name
                </label>
                <input
                  type="text"
                  value={classForm.class_name}
                  onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
                  placeholder="e.g. Grade 11-B"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-bold text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                  placeholder="e.g. High School Junior - Section B"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black text-xs font-medium text-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                  Study Time (Schedule)
                </label>
                <input
                  type="text"
                  value={classForm.study_time}
                  onChange={(e) => setClassForm({ ...classForm, study_time: e.target.value })}
                  placeholder="e.g. 08:00 AM - 11:30 AM"
                  className="w-full px-3 py-2 rounded-xl border-2 border-black font-mono text-xs font-bold text-black"
                  required
                />

                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setClassForm({ ...classForm, study_time: '08:00 AM - 11:30 AM' })}
                    className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-black text-[10px] font-bold border border-zinc-300 cursor-pointer"
                  >
                    Morning (08:00 - 11:30)
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassForm({ ...classForm, study_time: '01:00 PM - 04:30 PM' })}
                    className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-black text-[10px] font-bold border border-zinc-300 cursor-pointer"
                  >
                    Afternoon (01:00 - 04:30)
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassForm({ ...classForm, study_time: '05:30 PM - 08:30 PM' })}
                    className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-black text-[10px] font-bold border border-zinc-300 cursor-pointer"
                  >
                    Evening (05:30 - 08:30)
                  </button>
                </div>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-zinc-100 border-2 border-black text-black text-xs">{formError}</div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClassModal(false);
                    setShowEditClassModal(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-black hover:bg-zinc-100 border border-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold border-2 border-black cursor-pointer"
                >
                  {isSubmittingForm ? 'Saving...' : showEditClassModal ? 'Update Classroom' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
