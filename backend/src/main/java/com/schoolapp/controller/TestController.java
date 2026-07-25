package com.schoolapp.controller;

import com.schoolapp.dto.CreateTestRequest;
import com.schoolapp.dto.TestDetailDTO;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Test;
import com.schoolapp.service.TestService;
import com.schoolapp.service.StarsService;
import com.schoolapp.dto.AwardStarRequest;
import com.schoolapp.model.StarCategory;
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
@RequestMapping("/test")
public class TestController {

    private final TestService testService;
    private final StarsService starsService;
    private final Path uploadDir = Paths.get("data", "uploads", "test");

    public TestController(TestService testService, StarsService starsService) {
        this.testService = testService;
        this.starsService = starsService;
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createTest(@RequestBody CreateTestRequest request, Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            Test test = testService.createTest(teacher, request);
            return ResponseEntity.status(201).body(successBody(toMap(test)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getTestCount(Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            long count = testService.countByTeacher(teacher.getId());
            return ResponseEntity.ok(successBody(count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/count/{classId}")
    public ResponseEntity<Map<String, Object>> getTestCountForClass(@PathVariable String classId) {
        try {
            long count = testService.countByClass(classId);
            return ResponseEntity.ok(successBody(count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/list/{classId}")
    public ResponseEntity<Map<String, Object>> getTestList(@PathVariable String classId) {
        try {
            List<Map<String, Object>> data = testService.getTestForClass(classId)
                    .stream()
                    .map(this::toMap)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(successBody(data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @DeleteMapping("/{testId}")
    public ResponseEntity<Map<String, Object>> deleteTest(@PathVariable String testId, Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            testService.deleteTest(testId, teacher);
            return ResponseEntity.ok(successBody("Test deleted", "Test deleted"));
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

            return ResponseEntity.ok(Map.of("success", true, "url", "/api/test/attachments/" + storedName));
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

    private Map<String, Object> toMap(Test test) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", test.getId());
        map.put("classId", test.getSchoolClass() != null ? test.getSchoolClass().getId() : null);
        map.put("teacherId", test.getTeacher() != null ? test.getTeacher().getId() : null);
        map.put("title", test.getTitle());
        map.put("description", test.getDescription());
        map.put("dueDate", test.getDueDate() != null ? test.getDueDate().toString() : null);
        map.put("attachmentUrls", testService.deserializeUrls(test.getAttachmentUrls()));
        map.put("createdAt", test.getCreatedAt() != null ? test.getCreatedAt().toString() : null);
        return map;
    }

    @GetMapping("/detail/{testId}")
    public ResponseEntity<Map<String, Object>> getTestDetail(@PathVariable String testId) {
        try {
            TestDetailDTO detail = testService.getTestDetail(testId);
            return ResponseEntity.ok(successBody(detail));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{testId}/mark")
    public ResponseEntity<Map<String, Object>> captureMark(
            @PathVariable String testId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            String learnerId = (String) body.get("learnerId");
            Double mark = body.get("mark") != null ? Double.parseDouble(body.get("mark").toString()) : null;
            if (learnerId == null) {
                return ResponseEntity.badRequest().body(errorBody("learnerId is required"));
            }
            testService.captureMark(testId, learnerId, mark);
            return ResponseEntity.ok(Map.of("success", true, "message", "Mark captured"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{testId}/toggle-submission")
    public ResponseEntity<Map<String, Object>> toggleSubmission(
            @PathVariable String testId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            String learnerId = (String) body.get("learnerId");
            Boolean submitted = (Boolean) body.get("submitted");
            if (learnerId == null || submitted == null) {
                return ResponseEntity.badRequest().body(errorBody("learnerId and submitted are required"));
            }
            testService.toggleSubmission(testId, learnerId, submitted);
            return ResponseEntity.ok(Map.of("success", true, "message", "Submission toggled"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{testId}/bulk-submissions")
    public ResponseEntity<Map<String, Object>> bulkUpdateSubmissions(
            @PathVariable String testId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }

            Object rawEntries = body.get("entries");
            if (!(rawEntries instanceof List<?> entries) || entries.isEmpty()) {
                return ResponseEntity.badRequest().body(errorBody("entries is required"));
            }

            int updatedCount = testService.bulkUpdateSubmissions(testId, entries, teacher.getId());
            return ResponseEntity.ok(successBody(Map.of("updatedCount", updatedCount), "Test entries submitted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{testId}/award-star")
    public ResponseEntity<Map<String, Object>> awardStarFromTest(
            @PathVariable String testId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            String teacherId = teacher.getId();
            String learnerId = (String) body.get("learnerId");
            String classId = (String) body.get("classId");
            String note = (String) body.get("note");
            Integer starCount = body.get("starCount") != null ? Integer.parseInt(body.get("starCount").toString()) : 1;
            if (learnerId == null || classId == null) {
                return ResponseEntity.badRequest().body(errorBody("learnerId and classId are required"));
            }
            AwardStarRequest req = new AwardStarRequest();
            req.setLearnerId(learnerId);
            req.setClassId(classId);
            req.setCategory(StarCategory.TEST);
            req.setStarCount(starCount);
            req.setNote(note != null ? note : "Test star");
            starsService.awardStar(req, teacherId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Star awarded"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{testId}/toggle-star")
    public ResponseEntity<Map<String, Object>> toggleStarFromTest(
            @PathVariable String testId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }

            String learnerId = (String) body.get("learnerId");
            String classId = (String) body.get("classId");
            if (learnerId == null || classId == null) {
                return ResponseEntity.badRequest().body(errorBody("learnerId and classId are required"));
            }

            boolean awarded = testService.toggleTestStar(testId, learnerId, classId, teacher.getId());
            return ResponseEntity.ok(successBody(Map.of("awarded", awarded), awarded ? "Star awarded" : "Star removed"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    private Map<String, Object> successBody(Object payload) {
        return Map.of("success", true, "data", payload, "payload", payload);
    }

    private Map<String, Object> successBody(Object payload, String message) {
        return Map.of("success", true, "data", payload, "payload", payload, "message", message);
    }

    private Map<String, Object> errorBody(String message) {
        return Map.of("success", false, "error", Map.of("message", message));
    }
}

