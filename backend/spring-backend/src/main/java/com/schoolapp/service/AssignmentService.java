package com.schoolapp.service;

import com.schoolapp.dto.AssignmentDetailDTO;
import com.schoolapp.dto.CreateAssignmentRequest;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Assignment;
import com.schoolapp.model.AssignmentSubmission;
import com.schoolapp.model.Learner;
import com.schoolapp.model.SchoolClass;
import com.schoolapp.model.StarCategory;
import com.schoolapp.model.StudentStar;
import com.schoolapp.repository.AssignmentRepository;
import com.schoolapp.repository.AssignmentSubmissionRepository;
import com.schoolapp.repository.ClassRepository;
import com.schoolapp.repository.LearnerRepository;
import com.schoolapp.repository.StudentStarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    private static final String ASSIGNMENT_STAR_NOTE_PREFIX = "Assignment star:";

    private final AssignmentRepository assignmentRepository;
    private final ClassRepository classRepository;
    private final LearnerRepository learnerRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final StudentStarRepository starRepository;

    public AssignmentService(
            AssignmentRepository assignmentRepository,
            ClassRepository classRepository,
            LearnerRepository learnerRepository,
            AssignmentSubmissionRepository submissionRepository,
            StudentStarRepository starRepository
    ) {
        this.assignmentRepository = assignmentRepository;
        this.classRepository = classRepository;
        this.learnerRepository = learnerRepository;
        this.submissionRepository = submissionRepository;
        this.starRepository = starRepository;
    }

    public Assignment createAssignment(AppUser teacher, CreateAssignmentRequest request) {
        if (request.getClassId() == null || request.getClassId().isBlank()) {
            throw new RuntimeException("classId is required");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new RuntimeException("title is required");
        }
        if (request.getDueDate() == null || request.getDueDate().isBlank()) {
            throw new RuntimeException("dueDate is required");
        }

        SchoolClass schoolClass = classRepository.findById(Objects.requireNonNull(request.getClassId(), "classId"))
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (schoolClass.getTeacher() == null || !schoolClass.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You are not allowed to create assignments for this class");
        }

        LocalDateTime dueDate;
        try {
            dueDate = LocalDateTime.parse(request.getDueDate());
        } catch (DateTimeParseException ex) {
            throw new RuntimeException("Invalid dueDate format. Expected ISO date-time");
        }

        Assignment assignment = new Assignment();
        assignment.setSchoolClass(schoolClass);
        assignment.setTeacher(teacher);
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setDueDate(dueDate);
        assignment.setAttachmentUrls(serializeUrls(request.getAttachmentUrls()));

        return assignmentRepository.save(assignment);
    }

    public List<Assignment> getAssignmentsForClass(String classId) {
        return assignmentRepository.findBySchoolClassIdOrderByCreatedAtDesc(classId);
    }

    public long countByTeacher(String teacherId) {
        return assignmentRepository.countByTeacherId(teacherId);
    }

    public long countByClass(String classId) {
        return assignmentRepository.countBySchoolClassId(classId);
    }

    public void deleteAssignment(String assignmentId, AppUser teacher) {
        Assignment assignment = assignmentRepository.findById(Objects.requireNonNull(assignmentId, "assignmentId"))
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        if (assignment.getTeacher() == null || !assignment.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You are not allowed to delete this assignment");
        }
        assignmentRepository.delete(assignment);
    }

    public List<String> deserializeUrls(String rawUrls) {
        if (rawUrls == null || rawUrls.isBlank()) {
            return List.of();
        }
        return Arrays.stream(rawUrls.split("\\n"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }

    private String serializeUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            return null;
        }
        return String.join("\n", urls);
    }

    public AssignmentDetailDTO getAssignmentDetail(String assignmentId) {
        Assignment assignment = assignmentRepository.findById(Objects.requireNonNull(assignmentId, "assignmentId"))
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        String classId = assignment.getSchoolClass().getId();
        List<Learner> learners = learnerRepository.findBySchoolClassId(classId);

        Map<String, AssignmentSubmission> submissionMap = new HashMap<>();
        List<AssignmentSubmission> existingSubs = submissionRepository.findByAssignmentId(assignmentId);
        for (AssignmentSubmission s : existingSubs) {
            submissionMap.put(s.getLearner().getId(), s);
        }

        for (Learner learner : learners) {
            if (!submissionMap.containsKey(learner.getId())) {
                AssignmentSubmission newSub = new AssignmentSubmission(assignment, learner);
                submissionRepository.save(newSub);
                submissionMap.put(learner.getId(), newSub);
            }
        }

        int totalLearners = learners.size();
        long submittedCount = submissionMap.values().stream().filter(AssignmentSubmission::isSubmitted).count();
        double submissionRate = totalLearners > 0 ? (submittedCount * 100.0) / totalLearners : 0;

        List<AssignmentSubmission> marked = submissionMap.values().stream()
                .filter(s -> s.getMark() != null)
                .collect(Collectors.toList());
        long passCount = marked.stream().filter(s -> s.getMark() >= 50).count();
        double passRate = marked.isEmpty() ? 0 : (passCount * 100.0) / marked.size();

        List<AssignmentDetailDTO.TopLearnerDTO> topLearners = submissionMap.values().stream()
                .filter(s -> s.getMark() != null)
                .sorted(Comparator.comparingDouble(AssignmentSubmission::getMark).reversed())
                .limit(5)
                .map(s -> {
                    Learner l = s.getLearner();
                    return new AssignmentDetailDTO.TopLearnerDTO(l.getId(), l.getFullName(), l.getLearnerNumber(), s.getMark());
                })
                .collect(Collectors.toList());

        List<AssignmentDetailDTO.LearnerRowDTO> rows = learners.stream().map(learner -> {
            AssignmentSubmission sub = submissionMap.get(learner.getId());
            AssignmentDetailDTO.LearnerRowDTO row = new AssignmentDetailDTO.LearnerRowDTO();
            row.setLearnerId(learner.getId());
            row.setLearnerNumber(learner.getLearnerNumber());
            row.setFullName(learner.getFullName());
            row.setSubmitted(sub != null && sub.isSubmitted());
            row.setMark(sub != null ? sub.getMark() : null);
            row.setSubmissionId(sub != null ? sub.getId() : null);

            int assignmentStars = starRepository.countByLearnerIdAndCategory(learner.getId(), StarCategory.ASSIGNMENT);
            int totalStars = starRepository.countByLearnerIdAndCategory(learner.getId(), StarCategory.ATTENDANCE)
                    + starRepository.countByLearnerIdAndCategory(learner.getId(), StarCategory.HOMEWORK)
                    + assignmentStars;
            boolean assignmentStarAwarded = starRepository
                    .findFirstByLearnerIdAndSchoolClassIdAndCategoryAndNote(
                            learner.getId(),
                            classId,
                            StarCategory.ASSIGNMENT,
                            buildAssignmentStarNote(assignmentId)
                    )
                    .isPresent();

            row.setAssignmentStars(assignmentStars);
            row.setTotalStars(totalStars);
            row.setAssignmentStarAwarded(assignmentStarAwarded);
            return row;
        }).collect(Collectors.toList());

        AssignmentDetailDTO dto = new AssignmentDetailDTO();
        dto.setAssignmentId(assignment.getId());
        dto.setTitle(assignment.getTitle());
        dto.setDescription(assignment.getDescription());
        dto.setDueDate(assignment.getDueDate() != null ? assignment.getDueDate().toString() : null);
        dto.setCreatedAt(assignment.getCreatedAt() != null ? assignment.getCreatedAt().toString() : null);
        dto.setAttachmentUrls(deserializeUrls(assignment.getAttachmentUrls()));
        dto.setTotalLearners(totalLearners);
        dto.setSubmittedCount((int) submittedCount);
        dto.setSubmissionRate(Math.round(submissionRate * 100.0) / 100.0);
        dto.setPassRate(Math.round(passRate * 100.0) / 100.0);
        dto.setTopLearners(topLearners);
        dto.setLearnerRows(rows);

        return dto;
    }

    @Transactional
    public int bulkUpdateSubmissions(String assignmentId, List<?> entries, String teacherId) {
        Assignment assignment = assignmentRepository.findById(Objects.requireNonNull(assignmentId, "assignmentId"))
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (assignment.getTeacher() == null || !assignment.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("You are not allowed to update this assignment");
        }

        List<AssignmentSubmission> updates = new ArrayList<>();
        for (Object entryObj : entries) {
            if (!(entryObj instanceof Map<?, ?> entryMap)) {
                throw new RuntimeException("Invalid entry payload");
            }

            String learnerId = toStringValue(entryMap.get("learnerId"));
            Boolean submitted = toBooleanValue(entryMap.get("submitted"));
            Double mark = toDoubleValue(entryMap.get("mark"));

            if (learnerId == null || learnerId.isBlank() || submitted == null) {
                throw new RuntimeException("Each entry requires learnerId and submitted");
            }
            if (mark != null && (mark < 0 || mark > 100)) {
                throw new RuntimeException("Mark must be between 0 and 100");
            }
            if (!submitted && mark != null) {
                throw new RuntimeException("Cannot capture mark before learner is marked as submitted");
            }

            AssignmentSubmission sub = submissionRepository.findByAssignmentIdAndLearnerId(assignmentId, learnerId)
                    .orElseThrow(() -> new RuntimeException("Submission not found for learner"));

            sub.setSubmitted(submitted);
            if (submitted && sub.getSubmittedAt() == null) {
                sub.setSubmittedAt(LocalDateTime.now());
            }

            sub.setMark(mark);
            sub.setMarkedAt(mark != null ? LocalDateTime.now() : null);
            updates.add(sub);
        }

        submissionRepository.saveAll(updates);
        return updates.size();
    }

    public boolean toggleAssignmentStar(String assignmentId, String learnerId, String classId, String teacherId) {
        Assignment assignment = assignmentRepository.findById(Objects.requireNonNull(assignmentId, "assignmentId"))
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (assignment.getTeacher() == null || !assignment.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("You are not allowed to award stars for this assignment");
        }

        if (assignment.getSchoolClass() == null || !assignment.getSchoolClass().getId().equals(classId)) {
            throw new RuntimeException("Assignment does not belong to the provided class");
        }

        Learner learner = learnerRepository.findById(Objects.requireNonNull(learnerId, "learnerId"))
                .orElseThrow(() -> new RuntimeException("Learner not found"));

        String note = buildAssignmentStarNote(assignmentId);
        Optional<StudentStar> existing = starRepository.findFirstByLearnerIdAndSchoolClassIdAndCategoryAndNote(
                learnerId,
                classId,
                StarCategory.ASSIGNMENT,
                note
        );

        if (existing.isPresent()) {
            StudentStar starToDelete = existing.orElseThrow(() -> new RuntimeException("Star not found"));
            starRepository.delete(Objects.requireNonNull(starToDelete, "starToDelete"));
            return false;
        }

        StudentStar star = new StudentStar(learner, assignment.getTeacher(), assignment.getSchoolClass(), StarCategory.ASSIGNMENT);
        star.setStarCount(1);
        star.setNote(note);
        starRepository.save(star);
        return true;
    }

    private String buildAssignmentStarNote(String assignmentId) {
        return ASSIGNMENT_STAR_NOTE_PREFIX + assignmentId;
    }

    private String toStringValue(Object value) {
        if (value == null) {
            return null;
        }
        return value.toString();
    }

    private Boolean toBooleanValue(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Boolean b) {
            return b;
        }
        String str = value.toString();
        if ("true".equalsIgnoreCase(str)) {
            return true;
        }
        if ("false".equalsIgnoreCase(str)) {
            return false;
        }
        return null;
    }

    private Double toDoubleValue(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException ex) {
            throw new RuntimeException("Invalid mark value");
        }
    }
}
