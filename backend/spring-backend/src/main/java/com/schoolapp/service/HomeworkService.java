package com.schoolapp.service;

import com.schoolapp.dto.CreateHomeworkRequest;
import com.schoolapp.dto.HomeworkDetailDTO;
import com.schoolapp.model.*;
import com.schoolapp.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HomeworkService {

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

        SchoolClass schoolClass = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (schoolClass.getTeacher() == null || !schoolClass.getTeacher().getId().equals(teacher.getId())) {
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
        Homework homework = homeworkRepository.findById(homeworkId)
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

    public HomeworkDetailDTO getHomeworkDetail(String homeworkId) {
        Homework homework = homeworkRepository.findById(homeworkId)
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
            row.setHomeworkStars(homeworkStars);
            row.setTotalStars(totalStars);
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
        sub.setMark(mark);
        sub.setMarkedAt(LocalDateTime.now());
        if (!sub.isSubmitted()) {
            sub.setSubmitted(true);
            sub.setSubmittedAt(LocalDateTime.now());
        }
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
}
