package com.schoolapp.service;

import com.schoolapp.dto.CreateTestRequest;
import com.schoolapp.dto.TestDetailDTO;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Test;
import com.schoolapp.model.TestSubmission;
import com.schoolapp.model.Learner;
import com.schoolapp.model.SchoolClass;
import com.schoolapp.model.StudentStar;
import com.schoolapp.model.StarCategory;
import com.schoolapp.repository.ClassRepository;
import com.schoolapp.repository.TestRepository;
import com.schoolapp.repository.TestSubmissionRepository;
import com.schoolapp.repository.LearnerRepository;
import com.schoolapp.repository.StudentStarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TestService {

    private static final String TEST_STAR_NOTE_PREFIX = "Test star:";

    private final TestRepository testRepository;
    private final ClassRepository classRepository;
    private final LearnerRepository learnerRepository;
    private final TestSubmissionRepository submissionRepository;
    private final StudentStarRepository starRepository;

    public TestService(TestRepository testRepository,
                            ClassRepository classRepository,
                            LearnerRepository learnerRepository,
                            TestSubmissionRepository submissionRepository,
                            StudentStarRepository starRepository) {
        this.testRepository = testRepository;
        this.classRepository = classRepository;
        this.learnerRepository = learnerRepository;
        this.submissionRepository = submissionRepository;
        this.starRepository = starRepository;
    }

    public Test createTest(AppUser teacher, CreateTestRequest request) {
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
            throw new RuntimeException("You are not allowed to create test for this class");
        }

        LocalDateTime dueDate;
        try {
            dueDate = LocalDateTime.parse(request.getDueDate());
        } catch (DateTimeParseException ex) {
            throw new RuntimeException("Invalid dueDate format. Expected ISO date-time");
        }

        Test test = new Test();
        test.setSchoolClass(schoolClass);
        test.setTeacher(teacher);
        test.setTitle(request.getTitle());
        test.setDescription(request.getDescription());
        test.setDueDate(dueDate);
        test.setAttachmentUrls(serializeUrls(request.getAttachmentUrls()));

        return testRepository.save(test);
    }

    public List<Test> getTestForClass(String classId) {
        return testRepository.findBySchoolClassIdOrderByCreatedAtDesc(classId);
    }

    public long countByTeacher(String teacherId) {
        return testRepository.countByTeacherId(teacherId);
    }

    public long countByClass(String classId) {
        return testRepository.countBySchoolClassId(classId);
    }

    public void deleteTest(String testId, AppUser teacher) {
        Test test = testRepository.findById(Objects.requireNonNull(testId, "testId"))
                .orElseThrow(() -> new RuntimeException("Test not found"));
        if (test.getTeacher() == null || !test.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You are not allowed to delete this test");
        }
        testRepository.delete(test);
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

    // ── Test Detail (Dashboard) ──

    public TestDetailDTO getTestDetail(String testId) {
        Test test = testRepository.findById(Objects.requireNonNull(testId, "testId"))
                .orElseThrow(() -> new RuntimeException("Test not found"));

        String classId = test.getSchoolClass().getId();
        List<Learner> learners = learnerRepository.findBySchoolClassId(classId);

        // Ensure every learner has a submission row (lazy-create)
        Map<String, TestSubmission> submissionMap = new HashMap<>();
        List<TestSubmission> existingSubs = submissionRepository.findByTestId(testId);
        for (TestSubmission s : existingSubs) {
            submissionMap.put(s.getLearner().getId(), s);
        }
        for (Learner l : learners) {
            if (!submissionMap.containsKey(l.getId())) {
                TestSubmission newSub = new TestSubmission(test, l);
                submissionRepository.save(newSub);
                submissionMap.put(l.getId(), newSub);
            }
        }

        int totalLearners = learners.size();
        long submittedCount = submissionMap.values().stream().filter(TestSubmission::isSubmitted).count();
        double submissionRate = totalLearners > 0 ? (submittedCount * 100.0) / totalLearners : 0;

        // Pass rate: of those with marks, how many >= 50
        List<TestSubmission> marked = submissionMap.values().stream()
                .filter(s -> s.getMark() != null)
                .collect(Collectors.toList());
        long passCount = marked.stream().filter(s -> s.getMark() >= 50).count();
        double passRate = marked.isEmpty() ? 0 : (passCount * 100.0) / marked.size();

        // Top 5 learners by mark
        List<TestDetailDTO.TopLearnerDTO> topLearners = submissionMap.values().stream()
                .filter(s -> s.getMark() != null)
                .sorted(Comparator.comparingDouble(TestSubmission::getMark).reversed())
                .limit(5)
                .map(s -> {
                    Learner l = s.getLearner();
                    return new TestDetailDTO.TopLearnerDTO(l.getId(), l.getFullName(), l.getLearnerNumber(), s.getMark());
                })
                .collect(Collectors.toList());

        // All learner rows
        List<TestDetailDTO.LearnerRowDTO> rows = learners.stream().map(l -> {
            TestSubmission sub = submissionMap.get(l.getId());
            TestDetailDTO.LearnerRowDTO row = new TestDetailDTO.LearnerRowDTO();
            row.setLearnerId(l.getId());
            row.setLearnerNumber(l.getLearnerNumber());
            row.setFullName(l.getFullName());
            row.setSubmitted(sub != null && sub.isSubmitted());
            row.setMark(sub != null ? sub.getMark() : null);
            row.setSubmissionId(sub != null ? sub.getId() : null);

            int testStars = starRepository.countByLearnerIdAndCategory(l.getId(), StarCategory.TEST);
            int totalStars = starRepository.countByLearnerIdAndCategory(l.getId(), StarCategory.ATTENDANCE)
                    + starRepository.countByLearnerIdAndCategory(l.getId(), StarCategory.HOMEWORK)
                    + starRepository.countByLearnerIdAndCategory(l.getId(), StarCategory.ASSIGNMENT)
                    + testStars;
            boolean testStarAwarded = starRepository
                    .findFirstByLearnerIdAndSchoolClassIdAndCategoryAndNote(
                            l.getId(),
                            classId,
                            StarCategory.TEST,
                            buildTestStarNote(testId)
                    )
                    .isPresent();
            row.setTestStars(testStars);
            row.setTotalStars(totalStars);
            row.setTestStarAwarded(testStarAwarded);
            return row;
        }).collect(Collectors.toList());

        TestDetailDTO dto = new TestDetailDTO();
        dto.setTestId(test.getId());
        dto.setTitle(test.getTitle());
        dto.setDescription(test.getDescription());
        dto.setDueDate(test.getDueDate() != null ? test.getDueDate().toString() : null);
        dto.setCreatedAt(test.getCreatedAt() != null ? test.getCreatedAt().toString() : null);
        dto.setAttachmentUrls(deserializeUrls(test.getAttachmentUrls()));
        dto.setTotalLearners(totalLearners);
        dto.setSubmittedCount((int) submittedCount);
        dto.setSubmissionRate(Math.round(submissionRate * 100.0) / 100.0);
        dto.setPassRate(Math.round(passRate * 100.0) / 100.0);
        dto.setTopLearners(topLearners);
        dto.setLearnerRows(rows);

        return dto;
    }

    // ── Mark capture ──

    public void captureMark(String testId, String learnerId, Double mark) {
        TestSubmission sub = submissionRepository.findByTestIdAndLearnerId(testId, learnerId)
                .orElseThrow(() -> new RuntimeException("Submission not found for learner"));

        if (!sub.isSubmitted()) {
            throw new RuntimeException("Cannot capture mark before learner is marked as submitted");
        }

        sub.setMark(mark);
        sub.setMarkedAt(LocalDateTime.now());
        submissionRepository.save(sub);
    }

    // ── Toggle submission ──

    public void toggleSubmission(String testId, String learnerId, boolean submitted) {
        TestSubmission sub = submissionRepository.findByTestIdAndLearnerId(testId, learnerId)
                .orElseThrow(() -> new RuntimeException("Submission not found for learner"));
        sub.setSubmitted(submitted);
        if (submitted && sub.getSubmittedAt() == null) {
            sub.setSubmittedAt(LocalDateTime.now());
        }
        submissionRepository.save(sub);
    }

    @Transactional
    public int bulkUpdateSubmissions(String testId, List<?> entries, String teacherId) {
        Test test = testRepository.findById(Objects.requireNonNull(testId, "testId"))
                .orElseThrow(() -> new RuntimeException("Test not found"));

        if (test.getTeacher() == null || !test.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("You are not allowed to update this test");
        }

        List<TestSubmission> updates = new ArrayList<>();
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

            TestSubmission sub = submissionRepository.findByTestIdAndLearnerId(testId, learnerId)
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

    public boolean toggleTestStar(String testId, String learnerId, String classId, String teacherId) {
        Test test = testRepository.findById(Objects.requireNonNull(testId, "testId"))
                .orElseThrow(() -> new RuntimeException("Test not found"));

        if (test.getTeacher() == null || !test.getTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("You are not allowed to award stars for this test");
        }

        if (test.getSchoolClass() == null || !test.getSchoolClass().getId().equals(classId)) {
            throw new RuntimeException("Test does not belong to the provided class");
        }

        Learner learner = learnerRepository.findById(Objects.requireNonNull(learnerId, "learnerId"))
                .orElseThrow(() -> new RuntimeException("Learner not found"));

        String note = buildTestStarNote(testId);
        Optional<StudentStar> existing = starRepository
                .findFirstByLearnerIdAndSchoolClassIdAndCategoryAndNote(
                        learnerId,
                        classId,
                        StarCategory.TEST,
                        note
                );

        if (existing.isPresent()) {
            StudentStar starToDelete = existing.orElseThrow(() -> new RuntimeException("Star not found"));
            starRepository.delete(Objects.requireNonNull(starToDelete, "starToDelete"));
            return false;
        }

        StudentStar star = new StudentStar(learner, test.getTeacher(), test.getSchoolClass(), StarCategory.TEST);
        star.setStarCount(1);
        star.setNote(note);
        starRepository.save(star);
        return true;
    }

    private String buildTestStarNote(String testId) {
        return TEST_STAR_NOTE_PREFIX + testId;
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

