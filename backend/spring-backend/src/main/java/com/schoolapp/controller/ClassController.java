package com.schoolapp.controller;

import com.schoolapp.model.AppUser;
import com.schoolapp.model.Enrollment;
import com.schoolapp.model.SchoolClass;
import com.schoolapp.service.ClassService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/class")
public class ClassController {

    private final ClassService classService;

    public ClassController(ClassService classService) {
        this.classService = classService;
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
            List<SchoolClass> classes = classService.getClassesByTeacher(user.getId());
            List<Map<String, Object>> data = classes.stream().map(this::classToMap).toList();
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // ── GET /class/{classId} ──
    @GetMapping("/{classId}")
    public ResponseEntity<?> getClass(@PathVariable String classId) {
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
    public ResponseEntity<?> validateInvite(@RequestParam String code) {
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

    // ── Helper ──
    private Map<String, Object> classToMap(SchoolClass sc) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("classId", sc.getId());
        m.put("name", sc.getName());
        m.put("grade", sc.getGrade());
        m.put("subject", sc.getSubject());
        m.put("academicYear", sc.getAcademicYear());
        m.put("inviteToken", sc.getInviteToken());
        m.put("teacherId", sc.getTeacher().getId());
        m.put("createdAt", sc.getCreatedAt() != null ? sc.getCreatedAt().toString() : null);
        return m;
    }
}
