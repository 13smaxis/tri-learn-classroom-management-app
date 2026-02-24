package com.schoolapp.service;

import com.schoolapp.dto.AwardStarRequest;
import com.schoolapp.dto.StudentRecognitionDTO;
import com.schoolapp.model.*;
import com.schoolapp.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class StarsService {
    private final StudentStarRepository starRepository;
    private final LearnerRepository learnerRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final AttendanceRepository attendanceRepository;

    public StarsService(StudentStarRepository starRepository, LearnerRepository learnerRepository, 
                       UserRepository userRepository, ClassRepository classRepository,
                       AttendanceRepository attendanceRepository) {
        this.starRepository = starRepository;
        this.learnerRepository = learnerRepository;
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.attendanceRepository = attendanceRepository;
    }

    public void awardStar(AwardStarRequest request, String teacherId) {
        String learnerId = Objects.requireNonNull(request.getLearnerId(), "Learner ID is required");
        String resolvedTeacherId = Objects.requireNonNull(teacherId, "Teacher ID is required");
        String classId = Objects.requireNonNull(request.getClassId(), "Class ID is required");

        Learner learner = learnerRepository.findById(learnerId)
            .orElseThrow(() -> new RuntimeException("Learner not found"));
        
        AppUser teacher = userRepository.findById(resolvedTeacherId)
            .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        SchoolClass schoolClass = classRepository.findById(classId)
            .orElseThrow(() -> new RuntimeException("Class not found"));

        StudentStar star = new StudentStar(learner, teacher, schoolClass, request.getCategory());
        star.setStarCount(request.getStarCount() != null ? request.getStarCount() : 1);
        star.setNote(request.getNote());
        
        starRepository.save(star);
    }

    public StudentRecognitionDTO getStudentRecognition(String learnerId) {
        String resolvedLearnerId = Objects.requireNonNull(learnerId, "Learner ID is required");

        Learner learner = learnerRepository.findById(resolvedLearnerId)
            .orElseThrow(() -> new RuntimeException("Learner not found"));

        StudentRecognitionDTO dto = new StudentRecognitionDTO(learner.getId(), learner.getLearnerNumber(), learner.getFullName());
        
        // Calculate attendance rate
        List<AttendanceRecord> attendanceRecords = attendanceRepository.findByLearnerId(resolvedLearnerId);
        if (!attendanceRecords.isEmpty()) {
            long presentCount = attendanceRecords.stream()
                .filter(r -> r.getStatus() == AttendanceStatus.PRESENT)
                .count();
            double rate = (presentCount * 100.0) / attendanceRecords.size();
            dto.setAttendanceRate(rate);
        } else {
            dto.setAttendanceRate(0.0);
        }

        // Count stars by category
        int attendanceStars = starRepository.countByLearnerIdAndCategory(resolvedLearnerId, StarCategory.ATTENDANCE);
        int homeworkStars = starRepository.countByLearnerIdAndCategory(resolvedLearnerId, StarCategory.HOMEWORK);
        int assignmentStars = starRepository.countByLearnerIdAndCategory(resolvedLearnerId, StarCategory.ASSIGNMENT);

        dto.setAttendanceStars(attendanceStars);
        dto.setHomeworkStars(homeworkStars);
        dto.setAssignmentStars(assignmentStars);
        dto.setTotalStars(attendanceStars + homeworkStars + assignmentStars);

        return dto;
    }

    public List<StudentRecognitionDTO> getClassRecognition(String classId, String teacherId) {
        String resolvedClassId = Objects.requireNonNull(classId, "Class ID is required");
        String resolvedTeacherId = Objects.requireNonNull(teacherId, "Teacher ID is required");

        // Verify teacher owns the class
        SchoolClass schoolClass = classRepository.findById(resolvedClassId)
            .orElseThrow(() -> new RuntimeException("Class not found"));
        
        if (!schoolClass.getTeacher().getId().equals(resolvedTeacherId)) {
            throw new RuntimeException("Unauthorized: Teacher does not own this class");
        }

        List<Learner> learners = learnerRepository.findBySchoolClassId(resolvedClassId);
        
        return learners.stream()
            .map(learner -> getStudentRecognition(learner.getId()))
            .collect(Collectors.toList());
    }
}
