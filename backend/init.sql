-- Student Attendance Management System Database Schema

-- 1. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    study_time VARCHAR(100) DEFAULT '08:00 AM - 11:30 AM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL REFERENCES classes(class_name) ON UPDATE CASCADE ON DELETE RESTRICT,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    attendance_time VARCHAR(20) NOT NULL,
    face_photo VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'Present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_daily_attendance UNIQUE (student_id, attendance_date)
);

-- 4. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, attendance_date);

-- 6. Seed Sample Classes
INSERT INTO classes (class_name, description) VALUES
    ('Grade 10-A', 'High School Sophomore - Section A'),
    ('Grade 10-B', 'High School Sophomore - Section B'),
    ('Grade 11-A', 'High School Junior - Section A'),
    ('Grade 12-Science', 'High School Senior - Science Track')
ON CONFLICT (class_name) DO NOTHING;

-- 7. Seed Sample Admin User (Username: admin, Password: admin123)
INSERT INTO admin_users (username, password_hash) VALUES
    ('admin', '$2b$10$U/HwF0LIL3i.1U0/byTFpuJFb7gyWgQNMdu8mQX5Xp9bPhiD2Ble.')
ON CONFLICT (username) DO NOTHING;

-- 8. Seed Sample Students
INSERT INTO students (student_id, full_name, class_name, profile_photo) VALUES
    ('STU-1001', 'John Anderson', 'Grade 10-A', '/uploads/profiles/stu-1001.svg'),
    ('STU-1002', 'Emily Watson', 'Grade 10-A', '/uploads/profiles/stu-1002.svg'),
    ('STU-1003', 'Michael Chang', 'Grade 10-B', '/uploads/profiles/stu-1003.svg'),
    ('STU-1004', 'Sophia Rodriguez', 'Grade 11-A', '/uploads/profiles/stu-1004.svg'),
    ('STU-1005', 'David Kim', 'Grade 12-Science', '/uploads/profiles/stu-1005.svg')
ON CONFLICT (student_id) DO NOTHING;

