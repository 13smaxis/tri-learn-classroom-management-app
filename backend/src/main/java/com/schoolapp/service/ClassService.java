package com.schoolapp.service;

import com.schoolapp.model.AppUser;
import com.schoolapp.model.Enrollment;
import com.schoolapp.model.SchoolClass;
import com.schoolapp.repository.ClassRepository;
import com.schoolapp.repository.EnrollmentRepository;
import com.schoolapp.repository.UserRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ClassService {

    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public ClassService(ClassRepository classRepository,
                        EnrollmentRepository enrollmentRepository,
                        UserRepository userRepository) {
        this.classRepository = classRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    public SchoolClass createClass(@NonNull String teacherId, String name, String grade, String subject, String academicYear) {
        AppUser teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        SchoolClass sc = new SchoolClass();
        sc.setName(name);
        sc.setGrade(grade);
        sc.setSubject(subject);
        sc.setAcademicYear(academicYear);
        sc.setTeacher(teacher);
        sc.setInviteToken(UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        return classRepository.save(sc);
    }

    public List<SchoolClass> getClassesByTeacher(String teacherId) {
        return classRepository.findByTeacherId(teacherId);
    }

    public List<SchoolClass> getClassesForUser(AppUser user) {
        // Teachers see classes they own
        if (user.getRole() == com.schoolapp.model.Role.TEACHER) {
            return classRepository.findByTeacherId(user.getId());
        }
        // Parents/Learners see classes they've enrolled in
        List<Enrollment> enrollments = enrollmentRepository.findByUserId(user.getId());
        return enrollments.stream()
                .map(Enrollment::getSchoolClass)
                .toList();
    }

    public SchoolClass getClassById(@NonNull String classId) {
        return classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));
    }

    public List<Enrollment> getClassEnrollments(String classId) {
        return enrollmentRepository.findBySchoolClassId(classId);
    }

    public SchoolClass findByInviteToken(@NonNull String inviteToken) {
        return classRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new RuntimeException("Invalid invite code"));
    }

    public Enrollment joinClass(@NonNull String userId, String inviteToken, String linkedLearnerId) {
        SchoolClass sc = classRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new RuntimeException("Invalid invite token"));

        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (enrollmentRepository.existsByUserIdAndSchoolClassId(userId, sc.getId())) {
            throw new RuntimeException("Already enrolled in this class");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setUser(user);
        enrollment.setSchoolClass(sc);
        enrollment.setRole(user.getRole());
        enrollment.setLinkedLearnerId(linkedLearnerId);

        return enrollmentRepository.save(enrollment);
    }
}
