package com.schoolapp.service;

import com.schoolapp.dto.CreateHomeworkRequest;
import com.schoolapp.dto.HomeworkDetailDTO;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Homework;
import com.schoolapp.model.HomeworkSubmission;
import com.schoolapp.model.Learner;
import com.schoolapp.model.SchoolClass;
import com.schoolapp.model.StudentStar;
import com.schoolapp.model.StarCategory;
import com.schoolapp.repository.ClassRepository;
import com.schoolapp.repository.HomeworkRepository;
import com.schoolapp.repository.HomeworkSubmissionRepository;
import com.schoolapp.repository.LearnerRepository;
import com.schoolapp.repository.StudentStarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HomeworkService {

    private static final String HOMEWORK_STAR_NOTE_PREFIX = "Homework star:";

    private final HomeworkRepository homeworkRepository;
    private final ClassRepository classRepository;
    private final LearnerRepository learnerRepository;
    private final HomeworkSubmissionRepository submissionRepository;
    private final StudentStarRepository starRepository;

    public HomeworkService(HomeworkRepository homeworkRepository,
                           ClassRepository classRepository,
                           LearnerRepository learnerRepository,
                           HomeworkSubmissionRepository submissionRepository,
                           StudentStarRepository starRepository) {
        this.homeworkRepository = homeworkRepository;
        this.classRepository = classRepository;
        this.learnerRepository = learnerRepository;
        this.submissionRepository = submissionRepository;
        this.starRepository = starRepository;
    }

    public Homework createHomework(AppUser teacher, CreateHomeworkRequest request) {
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

        if (schoolClass.getTeacher() == null || !schoolClass.getTeacher().getId().equals(teacher.getId())) 
        {
            throw new RuntimeException("You are not allowed to create homework for this class");
        }

        LocalDateTime dueDate;
        try {
            dueDate = LocalDateTime.parse(request.getDueDate());
        } catch (DateTimeParseException ex) {
            throw new RuntimeException("Invalid dueDate format. Expected ISO date-time");
        }

        Homework homework = new Homework();
        homework.setSchoolClass(schoolClass);
        homework.setTeacher(teacher);
        homework.setTitle(request.getTitle());
        homework.setDescription(request.getDescription());
        homework.setDueDate(dueDate);
        homework.setAttachmentUrls(serializeUrls(request.getAttachmentUrls()));

        return homeworkRepository.save(homework);
    }

    public List<Homework> getHomeworkForClass(String classId) {
        return homeworkRepository.findBySchoolClassIdOrderByCreatedAtDesc(classId);
    }

    public long countByTeacher(String teacherId) {
        return homeworkRepository.countByTeacherId(teacherId);
    }

    public long countByClass(String classId) {
        return homeworkRepository.countBySchoolClassId(classId);
    }


    public void deleteHomework(String homeworkId, AppUser teacher) {
        Homework homework = homeworkRepository.findById(Objects.requireNonNull(homeworkId, "homeworkId"))
                .orElseThrow(() -> new RuntimeException("Homework not found"));
        if (homework.getTeacher() == null || !homework.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You are not allowed to delete this homework");
        }
        homeworkRepository.delete(homework);
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

    // ── Homework Detail (Dashboard) ──

    public HomeworkDetailDTO getHomeworkDetail(String homeworkId) 
    {
        Homework homework = homeworkRepository.findById(Objects.requireNonNull(homeworkId, "homeworkId"))
                .orElseThrow(() -> new RuntimeException("Homework not found"));

        String classId = homework.getSchoolClass().getId();
        List<Learner> learners = learnerRepository.findBySchoolClassId(classId);

        // Ensure every learner has a submission row (lazy-create)
        Map<String, HomeworkSubmission> submissionMap = new HashMap<>();
        List<HomeworkSubmission> existingSubs = submissionRepository.findByHomeworkId(homeworkId);
        for (HomeworkSubmission s : existingSubs) {
            submissionMap.put(s.getLearner().getId(), s);
        }
        for (Learner l : learners) {
            if (!submissionMap.containsKey(l.getId())) {
                HomeworkSubmission newSub = new HomeworkSubmission(homework, l);
                submissionRepository.save(newSub);
                submissionMap.put(l.getId(), newSub);
            }
        }

        int totalLearners = learners.size();
        long submittedCount = submissionMap.values().stream().filter(HomeworkSubmission::isSubmitted).count();
        double submissionRate = totalLearners > 0 ? (submittedCount * 100.0) / totalLearners : 0;

        // Pass rate: of those with marks, how many >= 50
        List<HomeworkSubmission> marked = submissionMap.values().stream()
                .filter(s -> s.getMark() != null)
                .collect(Collectors.toList());
        long passCount = marked.stream().filter(s -> s.getMark() >= 50).count();
        double passRate = marked.isEmpty() ? 0 : (passCount * 100.0) / marked.size();

        // Top 5 learners by mark
        List<HomeworkDetailDTO.TopLearnerDTO> topLearners = submissionMap.values().stream()
                .filter(s -> s.getMark() != null)
                .sorted(Comparator.comparingDouble(HomeworkSubmission::getMark).reversed())
                .limit(5)
                .map(s -> {
                    Learner l = s.getLearner();
                    return new HomeworkDetailDTO.TopLearnerDTO(l.getId(), l.getFullName(), l.getLearnerNumber(), s.getMark());
                })
                .collect(Collectors.toList());

        // All learner rows
        List<HomeworkDetailDTO.LearnerRowDTO> rows = learners.stream().map(l -> {
            HomeworkSubmission sub = submissionMap.get(l.getId());
            HomeworkDetailDTO.LearnerRowDTO row = new HomeworkDetailDTO.LearnerRowDTO();
            row.setLearnerId(l.getId());
            row.setLearnerNumber(l.getLearnerNumber());
            row.setFullName(l.getFullName());
            row.setSubmitted(sub != null && sub.isSubmitted());
            row.setMark(sub != null ? sub.getMark() : null);
            row.setSubmissionId(sub != null ? sub.getId() : null);

            int homeworkStars = starRepository.countByLearnerIdAndCategory(l.getId(), StarCategory.HOMEWORK);
            int totalStars = starRepository.countByLearnerIdAndCategory(l.getId(), StarCategory.ATTENDANCE)
                    + homeworkStars
                    + starRepository.countByLearnerIdAndCategory(l.getId(), StarCategory.ASSIGNMENT);
                boolean homeworkStarAwarded = starRepository
                    .findFirstByLearnerIdAndSchoolClassIdAndCategoryAndNote(
                        l.getId(),
                        classId,
                        StarCategory.HOMEWORK,
                        buildHomeworkStarNote(homeworkId)
                    )
                    .isPresent();
            row.setHomeworkStars(homeworkStars);
            row.setTotalStars(totalStars);
                row.setHomeworkStarAwarded(homeworkStarAwarded);
            return row;
        }).collect(Collectors.toList());

        HomeworkDetailDTO dto = new HomeworkDetailDTO();
        dto.setHomeworkId(homework.getId());
        dto.setTitle(homework.getTitle());
        dto.setDescription(homework.getDescription());
        dto.setDueDate(homework.getDueDate() != null ? homework.getDueDate().toString() : null);
        dto.setCreatedAt(homework.getCreatedAt() != null ? homework.getCreatedAt().toString() : null);
        dto.setAttachmentUrls(deserializeUrls(homework.getAttachmentUrls()));
        dto.setTotalLearners(totalLearners);
        dto.setSubmittedCount((int) submittedCount);
        dto.setSubmissionRate(Math.round(submissionRate * 100.0) / 100.0);
        dto.setPassRate(Math.round(passRate * 100.0) / 100.0);
        dto.setTopLearners(topLearners);
        dto.setLearnerRows(rows);

        return dto;
    }

    // ── Mark capture ──

    public void captureMark(String homeworkId, String learnerId, Double mark) {
        HomeworkSubmission sub = submissionRepository.findByHomeworkIdAndLearnerId(homeworkId, learnerId)
                .orElseThrow(() -> new RuntimeException("Submission not found for learner"));

        if (!sub.isSubmitted()) {
            throw new RuntimeException("Cannot capture mark before learner is marked as submitted");
        }

        sub.setMark(mark);
        sub.setMarkedAt(LocalDateTime.now());
        submissionRepository.save(sub);
    }

    // ── Toggle submission ──

    public void toggleSubmission(String homeworkId, String learnerId, boolean submitted) {
        HomeworkSubmission sub = submissionRepository.findByHomeworkIdAndLearnerId(homeworkId, learnerId)
                .orElseThrow(() -> new RuntimeException("Submission not found for learner"));
        sub.setSubmitted(submitted);
        if (submitted && sub.getSubmittedAt() == null) {
            sub.setSubmittedAt(LocalDateTime.now());
        }
        submissionRepository.save(sub);
    }

    @Transactional
    public int bulkUpdateSubmissions(String homeworkId, List<?> entries, String teacherId) {
        Homework homework = homeworkRepository.findById(Objects.requireNonNull(homeworkId, "homeworkId"))
                .orElseThrow(() -> new RuntimeException("Homework not found"));

        if (homework.getTeacher() == null || !homework.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("You are not allowed to update this homework");
        }

        List<HomeworkSubmission> updates = new ArrayList<>();
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

            HomeworkSubmission sub = submissionRepository.findByHomeworkIdAndLearnerId(homeworkId, learnerId)
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

    public boolean toggleHomeworkStar(String homeworkId, String learnerId, String classId, String teacherId) {
        Homework homework = homeworkRepository.findById(Objects.requireNonNull(homeworkId, "homeworkId"))
                .orElseThrow(() -> new RuntimeException("Homework not found"));

        if (homework.getTeacher() == null || !homework.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("You are not allowed to award stars for this homework");
        }

        if (homework.getSchoolClass() == null || !homework.getSchoolClass().getId().equals(classId)) {
            throw new RuntimeException("Homework does not belong to the provided class");
        }

        Learner learner = learnerRepository.findById(Objects.requireNonNull(learnerId, "learnerId"))
                .orElseThrow(() -> new RuntimeException("Learner not found"));

        String note = buildHomeworkStarNote(homeworkId);
        Optional<StudentStar> existing = starRepository
                .findFirstByLearnerIdAndSchoolClassIdAndCategoryAndNote(
                        learnerId,
                        classId,
                        StarCategory.HOMEWORK,
                        note
                );

        if (existing.isPresent()) {
            StudentStar starToDelete = existing.orElseThrow(() -> new RuntimeException("Star not found"));
            starRepository.delete(Objects.requireNonNull(starToDelete, "starToDelete"));
            return false;
        }

        StudentStar star = new StudentStar(learner, homework.getTeacher(), homework.getSchoolClass(), StarCategory.HOMEWORK);
        star.setStarCount(1);
        star.setNote(note);
        starRepository.save(star);
        return true;
    }

    private String buildHomeworkStarNote(String homeworkId) {
        return HOMEWORK_STAR_NOTE_PREFIX + homeworkId;
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
