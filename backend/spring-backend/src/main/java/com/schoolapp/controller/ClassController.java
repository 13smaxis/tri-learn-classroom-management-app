package com.schoolapp.controller;

import com.schoolapp.dto.ApiResponse;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Enrollment;
import com.schoolapp.model.SchoolClass;
import com.schoolapp.service.ClassService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/class")
public class ClassController {

    private final ClassService classService;

    public ClassController(ClassService classService) {
        this.classService = classService;
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<SchoolClass>> createClass(
            @AuthenticationPrincipal AppUser teacher,
            @RequestBody Map<String, String> body) {
        if (teacher == null) 
        {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        try {
            SchoolClass sc = classService.createClass(
                    Objects.requireNonNull(teacher.getId()),
                    body.get("name"),
                    body.get("grade"),
                    body.get("subject"),
                    body.getOrDefault("academicYear", "2026")
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(sc));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("CREATE_FAILED", e.getMessage()));
        }
    }

    @GetMapping("/my-classes")
    public ResponseEntity<ApiResponse<List<SchoolClass>>> myClasses(@AuthenticationPrincipal AppUser teacher) {
        if (teacher == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        List<SchoolClass> classes = classService.getClassesByTeacher(teacher.getId());
        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    @GetMapping("/{classId}")
    public ResponseEntity<ApiResponse<SchoolClass>> getClass(@PathVariable String classId) {
        try {
            SchoolClass sc = classService.getClassById(Objects.requireNonNull(classId));
            return ResponseEntity.ok(ApiResponse.success(sc));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("NOT_FOUND", e.getMessage()));
        }
    }

    @GetMapping("/{classId}/students")
    public ResponseEntity<ApiResponse<List<Enrollment>>> getStudents(@PathVariable String classId) {
        List<Enrollment> enrollments = classService.getClassEnrollments(classId);
        return ResponseEntity.ok(ApiResponse.success(enrollments));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<Enrollment>> joinClass(
            @AuthenticationPrincipal AppUser user,
            @RequestBody Map<String, String> body) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        try {
            Enrollment enrollment = classService.joinClass(
                    Objects.requireNonNull(user.getId()),
                    body.get("inviteToken"),
                    body.get("linkedLearnerId")
            );
            return ResponseEntity.ok(ApiResponse.success(enrollment));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("JOIN_FAILED", e.getMessage()));
        }
    }
}
