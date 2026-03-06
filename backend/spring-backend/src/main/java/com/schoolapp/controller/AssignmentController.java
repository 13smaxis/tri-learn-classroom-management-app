package com.schoolapp.controller;

import com.schoolapp.dto.AssignmentDetailDTO;
import com.schoolapp.dto.CreateAssignmentRequest;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Assignment;
import com.schoolapp.service.AssignmentService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/assignment")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final Path uploadDir = Paths.get("data", "uploads", "assignment");

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createAssignment(@RequestBody CreateAssignmentRequest request, Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            Assignment assignment = assignmentService.createAssignment(teacher, request);
            return ResponseEntity.status(201).body(Map.of("success", true, "data", toMap(assignment)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getAssignmentCount(Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            long count = assignmentService.countByTeacher(teacher.getId());
            return ResponseEntity.ok(Map.of("success", true, "data", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/count/{classId}")
    public ResponseEntity<Map<String, Object>> getAssignmentCountForClass(@PathVariable String classId) {
        try {
            long count = assignmentService.countByClass(classId);
            return ResponseEntity.ok(Map.of("success", true, "data", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/list/{classId}")
    public ResponseEntity<Map<String, Object>> getAssignmentList(@PathVariable String classId) {
        try {
            List<Map<String, Object>> data = assignmentService.getAssignmentsForClass(classId)
                    .stream()
                    .map(this::toMap)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<Map<String, Object>> deleteAssignment(@PathVariable String assignmentId, Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            assignmentService.deleteAssignment(assignmentId, teacher);
            return ResponseEntity.ok(Map.of("success", true, "data", "Assignment deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/upload-attachment")
    public ResponseEntity<Map<String, Object>> uploadAttachment(@RequestParam("attachment") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(errorBody("No file uploaded"));
            }

            Files.createDirectories(uploadDir);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            Path originalPath = Paths.get(originalName);
            Path fileNamePath = originalPath.getFileName();
            String sanitizedName = Objects.toString(fileNamePath, "file");
            String storedName = UUID.randomUUID() + "-" + sanitizedName;

            Path targetPath = uploadDir.resolve(storedName).normalize();
            file.transferTo(Objects.requireNonNull(targetPath, "targetPath"));

            return ResponseEntity.ok(Map.of("success", true, "url", "/api/assignment/attachments/" + storedName));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/attachments/{fileName:.+}")
    public ResponseEntity<Resource> getAttachment(@PathVariable String fileName) {
        try {
            Path filePath = uploadDir.resolve(fileName).normalize();
            Resource resource = new UrlResource(Objects.requireNonNull(filePath.toUri(), "fileUri"));

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" +
                                    Objects.toString(resource.getFilename(), Objects.toString(filePath.getFileName(), "attachment")) +
                                    "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/detail/{assignmentId}")
    public ResponseEntity<Map<String, Object>> getAssignmentDetail(@PathVariable String assignmentId) {
        try {
            AssignmentDetailDTO detail = assignmentService.getAssignmentDetail(assignmentId);
            return ResponseEntity.ok(Map.of("success", true, "data", detail));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{assignmentId}/bulk-submissions")
    public ResponseEntity<Map<String, Object>> bulkUpdateSubmissions(
            @PathVariable String assignmentId,
            @RequestBody Map<String, Object> body,
            Authentication auth
    ) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }

            Object rawEntries = body.get("entries");
            if (!(rawEntries instanceof List<?> entries) || entries.isEmpty()) {
                return ResponseEntity.badRequest().body(errorBody("entries is required"));
            }

            int updatedCount = assignmentService.bulkUpdateSubmissions(assignmentId, entries, teacher.getId());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of("updatedCount", updatedCount),
                    "message", "Assignment entries submitted"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{assignmentId}/toggle-star")
    public ResponseEntity<Map<String, Object>> toggleStarFromAssignment(
            @PathVariable String assignmentId,
            @RequestBody Map<String, Object> body,
            Authentication auth
    ) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }

            String learnerId = (String) body.get("learnerId");
            String classId = (String) body.get("classId");
            if (learnerId == null || classId == null) {
                return ResponseEntity.badRequest().body(errorBody("learnerId and classId are required"));
            }

            boolean awarded = assignmentService.toggleAssignmentStar(assignmentId, learnerId, classId, teacher.getId());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of("awarded", awarded),
                    "message", awarded ? "Star awarded" : "Star removed"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    private Map<String, Object> toMap(Assignment assignment) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", assignment.getId());
        map.put("classId", assignment.getSchoolClass() != null ? assignment.getSchoolClass().getId() : null);
        map.put("teacherId", assignment.getTeacher() != null ? assignment.getTeacher().getId() : null);
        map.put("title", assignment.getTitle());
        map.put("description", assignment.getDescription());
        map.put("dueDate", assignment.getDueDate() != null ? assignment.getDueDate().toString() : null);
        map.put("attachmentUrls", assignmentService.deserializeUrls(assignment.getAttachmentUrls()));
        map.put("createdAt", assignment.getCreatedAt() != null ? assignment.getCreatedAt().toString() : null);
        return map;
    }

    private Map<String, Object> errorBody(String message) {
        return Map.of("success", false, "error", Map.of("message", message));
    }
}
