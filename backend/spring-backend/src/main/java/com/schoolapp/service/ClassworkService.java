package com.schoolapp.service;

import com.schoolapp.dto.CreateClassworkRequest;
import com.schoolapp.dto.ClassworkDetailDTO;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Classwork;
import com.schoolapp.model.ClassworkSubmission;
import com.schoolapp.model.Learner;
import com.schoolapp.model.SchoolClass;
import com.schoolapp.model.StudentStar;
import com.schoolapp.model.StarCategory;
import com.schoolapp.repository.ClassRepository;
import com.schoolapp.repository.ClassworkRepository;
import com.schoolapp.repository.ClassworkSubmissionRepository;
import com.schoolapp.repository.LearnerRepository;
import com.schoolapp.repository.StudentStarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ClassworkService {

    private static final String CLASSWORK_STAR_NOTE_PREFIX = "Classwork star:";

    private final ClassworkRepository classworkRepository;
    private final ClassRepository classRepository;
    private final LearnerRepository learnerRepository;
    private final ClassworkSubmissionRepository submissionRepository;
    private final StudentStarRepository starRepository;

    public ClassworkService(ClassworkRepository classworkRepository,
                            ClassRepository classRepository,
                            LearnerRepository learnerRepository,
                            ClassworkSubmissionRepository submissionRepository,
                            StudentStarRepository starRepository) {
        this.classworkRepository = classworkRepository;
        this.classRepository = classRepository;
        this.learnerRepository = learnerRepository;
        this.submissionRepository = submissionRepository;
        this.starRepository = starRepository;
    }

    public Classwork createClasswork(AppUser teacher, CreateClassworkRequest request) {
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
            throw new RuntimeException("You are not allowed to create classwork for this class");
        }

        LocalDateTime dueDate;
        try {
            dueDate = LocalDateTime.parse(request.getDueDate());
        } catch (DateTimeParseException ex) {
            throw new RuntimeException("Invalid dueDate format. Expected ISO date-time");
        }

        Classwork classwork = new Classwork();
        classwork.setSchoolClass(schoolClass);
        classwork.setTeacher(teacher);
        classwork.setTitle(request.getTitle());
        classwork.setDescription(request.getDescription());
        classwork.setDueDate(dueDate);
        classwork.setAttachmentUrls(serializeUrls(request.getAttachmentUrls()));

        return classworkRepository.save(classwork);
    }

    public List<Classwork> getClassworkForClass(String classId) {
        return classworkRepository.findBySchoolClassIdOrderByCreatedAtDesc(classId);
    }

    public long countByTeacher(String teacherId) {
        return classworkRepository.countByTeacherId(teacherId);
    }

    public long countByClass(String classId) {
        return classworkRepository.countBySchoolClassId(classId);
    }

    public void deleteClasswork(String classworkId, AppUser teacher) {
        Classwork classwork = classworkRepository.findById(Objects.requireNonNull(classworkId, "classworkId"))
                .orElseThrow(() -> new RuntimeException("Classwork not found"));
        if (classwork.getTeacher() == null || !classwork.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You are not allowed to delete this classwork");
        }
        classworkRepository.delete(classwork);
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

    // ── Classwork Detail (Dashboard) ──

    public ClassworkDetailDTO getClassworkDetail(String classworkId) {
        Classwork classwork = classworkRepository.findById(Objects.requireNonNull(classworkId, "classworkId"))
                .orElseThrow(() -> new RuntimeException("Classwork not found"));

        String classId = classwork.getSchoolClass().getId();
        List<Learner> learners = learnerRepository.findBySchoolClassId(classId);

        // Ensure every learner has a submission row (lazy-create)
        Map<String, ClassworkSubmission> submissionMap = new HashMap<>();
        List<ClassworkSubmission> existingSubs = submissionRepository.findByClassworkId(classworkId);
        for (ClassworkSubmission s : existingSubs) {
            submissionMap.put(s.getLearner().getId(), s);
        }
        for (Learner l : learners) {
            if (!submissionMap.containsKey(l.getId())) {
                ClassworkSubmission newSub = new ClassworkSubmission(classwork, l);
                submissionRepository.save(newSub);
                submissionMap.put(l.getId(), newSub);
            }
        }

        int totalLearners = learners.size();
        long submittedCount = submissionMap.values().stream().filter(ClassworkSubmission::isSubmitted).count();
        double submissionRate = totalLearners > 0 ? (submittedCount * 100.0) / totalLearners : 0;

        // Pass rate: of those with marks, how many >= 50
        List<ClassworkSubmission> marked = submissionMap.values().stream()
                .filter(s -> s.getMark() != null)
                .collect(Collectors.toList());
        long passCount = marked.stream().filter(s -> s.getMark() >= 50).count();
        double passRate = marked.isEmpty() ? 0 : (passCount * 100.0) / marked.size();

        // Top 5 learners by mark
        List<ClassworkDetailDTO.TopLearnerDTO> topLearners = submissionMap.values().stream()
                .filter(s -> s.getMark() != null)
                .sorted(Comparator.comparingDouble(ClassworkSubmission::getMark).reversed())
                .limit(5)
                .map(s -> {
                    Learner l = s.getLearner();
                    return new ClassworkDetailDTO.TopLearnerDTO(l.getId(), l.getFullName(), l.getLearnerNumber(), s.getMark());
                })
                .collect(Collectors.toList());

        // All learner rows
        List<ClassworkDetailDTO.LearnerRowDTO> rows = learners.stream().map(l -> {
            ClassworkSubmission sub = submissionMap.get(l.getId());
            ClassworkDetailDTO.LearnerRowDTO row = new ClassworkDetailDTO.LearnerRowDTO();
            row.setLearnerId(l.getId());
            row.setLearnerNumber(l.getLearnerNumber());
            row.setFullName(l.getFullName());
            row.setSubmitted(sub != null && sub.isSubmitted());
            row.setMark(sub != null ? sub.getMark() : null);
            row.setSubmissionId(sub != null ? sub.getId() : null);

            int classworkStars = starRepository.countByLearnerIdAndCategory(l.getId(), StarCategory.CLASSWORK);
            int totalStars = starRepository.countByLearnerIdAndCategory(l.getId(), StarCategory.ATTENDANCE)
                    + starRepository.countByLearnerIdAndCategory(l.getId(), StarCategory.HOMEWORK)
                    + starRepository.countByLearnerIdAndCategory(l.getId(), StarCategory.ASSIGNMENT)
                    + classworkStars;
            boolean classworkStarAwarded = starRepository
                    .findFirstByLearnerIdAndSchoolClassIdAndCategoryAndNote(
                            l.getId(),
                            classId,
                            StarCategory.CLASSWORK,
                            buildClassworkStarNote(classworkId)
                    )
                    .isPresent();
            row.setClassworkStars(classworkStars);
            row.setTotalStars(totalStars);
            row.setClassworkStarAwarded(classworkStarAwarded);
            return row;
        }).collect(Collectors.toList());

        ClassworkDetailDTO dto = new ClassworkDetailDTO();
        dto.setClassworkId(classwork.getId());
        dto.setTitle(classwork.getTitle());
        dto.setDescription(classwork.getDescription());
        dto.setDueDate(classwork.getDueDate() != null ? classwork.getDueDate().toString() : null);
        dto.setCreatedAt(classwork.getCreatedAt() != null ? classwork.getCreatedAt().toString() : null);
        dto.setAttachmentUrls(deserializeUrls(classwork.getAttachmentUrls()));
        dto.setTotalLearners(totalLearners);
        dto.setSubmittedCount((int) submittedCount);
        dto.setSubmissionRate(Math.round(submissionRate * 100.0) / 100.0);
        dto.setPassRate(Math.round(passRate * 100.0) / 100.0);
        dto.setTopLearners(topLearners);
        dto.setLearnerRows(rows);

        return dto;
    }

    // ── Mark capture ──

    public void captureMark(String classworkId, String learnerId, Double mark) {
        ClassworkSubmission sub = submissionRepository.findByClassworkIdAndLearnerId(classworkId, learnerId)
                .orElseThrow(() -> new RuntimeException("Submission not found for learner"));

        if (!sub.isSubmitted()) {
            throw new RuntimeException("Cannot capture mark before learner is marked as submitted");
        }

        sub.setMark(mark);
        sub.setMarkedAt(LocalDateTime.now());
        submissionRepository.save(sub);
    }

    // ── Toggle submission ──

    public void toggleSubmission(String classworkId, String learnerId, boolean submitted) {
        ClassworkSubmission sub = submissionRepository.findByClassworkIdAndLearnerId(classworkId, learnerId)
                .orElseThrow(() -> new RuntimeException("Submission not found for learner"));
        sub.setSubmitted(submitted);
        if (submitted && sub.getSubmittedAt() == null) {
            sub.setSubmittedAt(LocalDateTime.now());
        }
        submissionRepository.save(sub);
    }

    @Transactional
    public int bulkUpdateSubmissions(String classworkId, List<?> entries, String teacherId) {
        Classwork classwork = classworkRepository.findById(Objects.requireNonNull(classworkId, "classworkId"))
                .orElseThrow(() -> new RuntimeException("Classwork not found"));

        if (classwork.getTeacher() == null || !classwork.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("You are not allowed to update this classwork");
        }

        List<ClassworkSubmission> updates = new ArrayList<>();
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

            ClassworkSubmission sub = submissionRepository.findByClassworkIdAndLearnerId(classworkId, learnerId)
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

    public boolean toggleClassworkStar(String classworkId, String learnerId, String classId, String teacherId) {
        Classwork classwork = classworkRepository.findById(Objects.requireNonNull(classworkId, "classworkId"))
                .orElseThrow(() -> new RuntimeException("Classwork not found"));

        if (classwork.getTeacher() == null || !classwork.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("You are not allowed to award stars for this classwork");
        }

        if (classwork.getSchoolClass() == null || !classwork.getSchoolClass().getId().equals(classId)) {
            throw new RuntimeException("Classwork does not belong to the provided class");
        }

        Learner learner = learnerRepository.findById(Objects.requireNonNull(learnerId, "learnerId"))
                .orElseThrow(() -> new RuntimeException("Learner not found"));

        String note = buildClassworkStarNote(classworkId);
        Optional<StudentStar> existing = starRepository
                .findFirstByLearnerIdAndSchoolClassIdAndCategoryAndNote(
                        learnerId,
                        classId,
                        StarCategory.CLASSWORK,
                        note
                );

        if (existing.isPresent()) {
            StudentStar starToDelete = existing.orElseThrow(() -> new RuntimeException("Star not found"));
            starRepository.delete(Objects.requireNonNull(starToDelete, "starToDelete"));
            return false;
        }

        StudentStar star = new StudentStar(learner, classwork.getTeacher(), classwork.getSchoolClass(), StarCategory.CLASSWORK);
        star.setStarCount(1);
        star.setNote(note);
        starRepository.save(star);
        return true;
    }

    private String buildClassworkStarNote(String classworkId) {
        return CLASSWORK_STAR_NOTE_PREFIX + classworkId;
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
