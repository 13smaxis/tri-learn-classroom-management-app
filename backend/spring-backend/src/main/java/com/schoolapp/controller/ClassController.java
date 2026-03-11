package com.schoolapp.controller;

import com.schoolapp.model.AppUser;
import com.schoolapp.model.Enrollment;
import com.schoolapp.model.Learner;
import com.schoolapp.model.SchoolClass;
import com.schoolapp.repository.AssignmentRepository;
import com.schoolapp.repository.AssignmentSubmissionRepository;
import com.schoolapp.repository.ClassworkRepository;
import com.schoolapp.repository.ClassworkSubmissionRepository;
import com.schoolapp.repository.EnrollmentRepository;
import com.schoolapp.repository.HomeworkRepository;
import com.schoolapp.repository.HomeworkSubmissionRepository;
import com.schoolapp.repository.LearnerRepository;
import com.schoolapp.service.ClassService;
import org.springframework.lang.NonNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/class")
public class ClassController {

    private final ClassService classService;
    private final EnrollmentRepository enrollmentRepository;
    private final LearnerRepository learnerRepository;
    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final ClassworkRepository classworkRepository;
    private final ClassworkSubmissionRepository classworkSubmissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;

    public ClassController(ClassService classService,
                           EnrollmentRepository enrollmentRepository,
                           LearnerRepository learnerRepository,
                           HomeworkRepository homeworkRepository,
                           HomeworkSubmissionRepository homeworkSubmissionRepository,
                           ClassworkRepository classworkRepository,
                           ClassworkSubmissionRepository classworkSubmissionRepository,
                           AssignmentRepository assignmentRepository,
                           AssignmentSubmissionRepository assignmentSubmissionRepository) {
        this.classService = classService;
        this.enrollmentRepository = enrollmentRepository;
        this.learnerRepository = learnerRepository;
        this.homeworkRepository = homeworkRepository;
        this.homeworkSubmissionRepository = homeworkSubmissionRepository;
        this.classworkRepository = classworkRepository;
        this.classworkSubmissionRepository = classworkSubmissionRepository;
        this.assignmentRepository = assignmentRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
    }

    // ── POST /class/create ──
    @PostMapping("/create")
    public ResponseEntity<?> createClass(@RequestBody Map<String, String> body, Authentication auth) {
        try {
            AppUser teacher = (AppUser) auth.getPrincipal();
            SchoolClass sc = classService.createClass(
                    teacher.getId(),
                    body.get("name"),
                    body.get("grade"),
                    body.get("subject"),
                    body.getOrDefault("academicYear", "2026")
            );
            return ResponseEntity.status(201).body(Map.of("success", true, "data", classToMap(sc)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // ── GET /class/my-classes ──
    @GetMapping("/my-classes")
    public ResponseEntity<?> myClasses(Authentication auth) {
        try {
            AppUser user = (AppUser) auth.getPrincipal();
            List<SchoolClass> classes = classService.getClassesForUser(user);
            List<Map<String, Object>> data = classes.stream().map(this::classToMap).toList();
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // ── GET /class/{classId} ──
    @GetMapping("/{classId}")
    public ResponseEntity<?> getClass(@PathVariable @NonNull String classId) {
        try {
            SchoolClass sc = classService.getClassById(classId);
            return ResponseEntity.ok(Map.of("success", true, "data", classToMap(sc)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // ── GET /class/{classId}/students ──
    @GetMapping("/{classId}/students")
    public ResponseEntity<?> getStudents(@PathVariable String classId) {
        try {
            List<Enrollment> enrollments = classService.getClassEnrollments(classId);
            List<Map<String, Object>> data = enrollments.stream().map(e -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("enrollmentId", e.getId());
                m.put("userId", e.getUser().getId());
                m.put("fullName", e.getUser().getFullName());
                m.put("role", e.getRole().name().toLowerCase());
                m.put("linkedLearnerId", e.getLinkedLearnerId());
                return m;
            }).toList();
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // ── POST /class/join ──
    @PostMapping("/join")
    public ResponseEntity<?> joinClass(@RequestBody Map<String, String> body, Authentication auth) {
        try {
            AppUser user = (AppUser) auth.getPrincipal();
            Enrollment enrollment = classService.joinClass(
                    user.getId(),
                    body.get("inviteToken"),
                    body.get("linkedLearnerId")
            );
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("enrollmentId", enrollment.getId());
            data.put("classId", enrollment.getSchoolClass().getId());
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // ── GET /class/validate-invite?code=XXXX (public, no auth required) ──
    @GetMapping("/validate-invite")
    public ResponseEntity<?> validateInvite(@RequestParam @NonNull String code) {
        try {
            SchoolClass sc = classService.findByInviteToken(code);
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("classId", sc.getId());
            data.put("name", sc.getName());
            data.put("grade", sc.getGrade());
            data.put("subject", sc.getSubject());
            data.put("teacherName", sc.getTeacher().getFullName());
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // ── GET /class/{classId}/performance-summary ──
    @GetMapping("/{classId}/performance-summary")
    public ResponseEntity<?> getPerformanceSummary(@PathVariable String classId) {
        try {
            List<Learner> learners = learnerRepository.findBySchoolClassId(classId);

            // Build maps: learnerId -> list of marks from each category
            Map<String, List<Double>> hwMarks = new java.util.HashMap<>();
            Map<String, List<Double>> cwMarks = new java.util.HashMap<>();
            Map<String, List<Double>> assnMarks = new java.util.HashMap<>();

            homeworkRepository.findBySchoolClassIdOrderByCreatedAtDesc(classId).forEach(hw ->
                homeworkSubmissionRepository.findByHomeworkId(hw.getId()).forEach(sub -> {
                    if (sub.getMark() != null) {
                        hwMarks.computeIfAbsent(sub.getLearner().getId(), k -> new ArrayList<>()).add(sub.getMark());
                    }
                })
            );

            classworkRepository.findBySchoolClassIdOrderByCreatedAtDesc(classId).forEach(cw ->
                classworkSubmissionRepository.findByClassworkId(cw.getId()).forEach(sub -> {
                    if (sub.getMark() != null) {
                        cwMarks.computeIfAbsent(sub.getLearner().getId(), k -> new ArrayList<>()).add(sub.getMark());
                    }
                })
            );

            assignmentRepository.findBySchoolClassIdOrderByCreatedAtDesc(classId).forEach(assn ->
                assignmentSubmissionRepository.findByAssignmentId(assn.getId()).forEach(sub -> {
                    if (sub.getMark() != null) {
                        assnMarks.computeIfAbsent(sub.getLearner().getId(), k -> new ArrayList<>()).add(sub.getMark());
                    }
                })
            );

            List<Map<String, Object>> learnerStats = learners.stream().map(learner -> {
                String lid = learner.getId();
                double hwAvg = hwMarks.getOrDefault(lid, List.of()).stream().mapToDouble(Double::doubleValue).average().orElse(-1);
                double cwAvg = cwMarks.getOrDefault(lid, List.of()).stream().mapToDouble(Double::doubleValue).average().orElse(-1);
                double assnAvg = assnMarks.getOrDefault(lid, List.of()).stream().mapToDouble(Double::doubleValue).average().orElse(-1);

                List<Double> validAvgs = new ArrayList<>();
                if (hwAvg >= 0) validAvgs.add(hwAvg);
                if (cwAvg >= 0) validAvgs.add(cwAvg);
                if (assnAvg >= 0) validAvgs.add(assnAvg);
                double overallAvg = validAvgs.isEmpty() ? -1 : validAvgs.stream().mapToDouble(Double::doubleValue).average().orElse(-1);

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("learnerId", lid);
                m.put("fullName", learner.getFullName());
                m.put("learnerNumber", learner.getLearnerNumber());
                m.put("avgMark", overallAvg < 0 ? null : Math.round(overallAvg * 10.0) / 10.0);
                m.put("homeworkAvg", hwAvg < 0 ? null : Math.round(hwAvg * 10.0) / 10.0);
                m.put("classworkAvg", cwAvg < 0 ? null : Math.round(cwAvg * 10.0) / 10.0);
                m.put("assignmentAvg", assnAvg < 0 ? null : Math.round(assnAvg * 10.0) / 10.0);
                m.put("isAtRisk", overallAvg < 0 || overallAvg < 50);
                return m;
            }).collect(Collectors.toList());

            List<Map<String, Object>> topPerformers = learnerStats.stream()
                .filter(s -> s.get("avgMark") != null)
                .sorted(Comparator.<Map<String, Object>, Double>comparing(s -> (Double) s.get("avgMark")).reversed())
                .limit(5)
                .collect(Collectors.toList());

            List<Map<String, Object>> atRisk = learnerStats.stream()
                .filter(s -> Boolean.TRUE.equals(s.get("isAtRisk")))
                .collect(Collectors.toList());

            long passingCount = learnerStats.stream().filter(s -> !Boolean.TRUE.equals(s.get("isAtRisk"))).count();

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("learners", learnerStats);
            result.put("topPerformers", topPerformers);
            result.put("atRisk", atRisk);
            result.put("passingCount", passingCount);
            result.put("atRiskCount", atRisk.size());
            result.put("totalCount", learners.size());

            return ResponseEntity.ok(Map.of("success", true, "data", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // ── Helper ──
    private Map<String, Object> classToMap(SchoolClass sc) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", sc.getId());
        m.put("classId", sc.getId());
        m.put("name", sc.getName());
        m.put("grade", sc.getGrade());
        m.put("subject", sc.getSubject());
        m.put("academicYear", sc.getAcademicYear());
        m.put("inviteToken", sc.getInviteToken());
        m.put("teacherId", sc.getTeacher().getId());
        m.put("teacherName", sc.getTeacher().getFullName());
        m.put("createdAt", sc.getCreatedAt() != null ? sc.getCreatedAt().toString() : null);

        // Include enrollments so frontend can display learner/parent counts
        List<Enrollment> enrollments = enrollmentRepository.findBySchoolClassId(sc.getId());
        List<Map<String, Object>> enrollmentData = enrollments.stream().map(e -> {
            Map<String, Object> em = new LinkedHashMap<>();
            em.put("enrollmentId", e.getId());
            em.put("userId", e.getUser().getId());
            em.put("fullName", e.getUser().getFullName());
            em.put("role", e.getRole().name().toLowerCase());
            em.put("linkedLearnerId", e.getLinkedLearnerId());
            return em;
        }).toList();
        m.put("enrollments", enrollmentData);

        return m;
    }
}
