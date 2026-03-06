package com.schoolapp.controller;

import com.schoolapp.dto.CreateHomeworkRequest;
import com.schoolapp.dto.HomeworkDetailDTO;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Homework;
import com.schoolapp.service.HomeworkService;
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
@RequestMapping("/homework")
public class HomeworkController {

    private final HomeworkService homeworkService;
    private final StarsService starsService;
    private final Path uploadDir = Paths.get("data", "uploads", "homework");

    public HomeworkController(HomeworkService homeworkService, StarsService starsService) {
        this.homeworkService = homeworkService;
        this.starsService = starsService;
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createHomework(@RequestBody CreateHomeworkRequest request, Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            Homework homework = homeworkService.createHomework(teacher, request);
            return ResponseEntity.status(201).body(Map.of("success", true, "data", toMap(homework)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }


    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getHomeworkCount(Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            long count = homeworkService.countByTeacher(teacher.getId());
            return ResponseEntity.ok(Map.of("success", true, "data", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/count/{classId}")
    public ResponseEntity<Map<String, Object>> getHomeworkCountForClass(@PathVariable String classId) {
        try {
            long count = homeworkService.countByClass(classId);
            return ResponseEntity.ok(Map.of("success", true, "data", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/list/{classId}")
    public ResponseEntity<Map<String, Object>> getHomeworkList(@PathVariable String classId) {
        try {
            List<Map<String, Object>> data = homeworkService.getHomeworkForClass(classId)
                    .stream()
                    .map(this::toMap)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @DeleteMapping("/{homeworkId}")
    public ResponseEntity<Map<String, Object>> deleteHomework(@PathVariable String homeworkId, Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            homeworkService.deleteHomework(homeworkId, teacher);
            return ResponseEntity.ok(Map.of("success", true, "data", "Homework deleted"));
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
            file.transferTo(targetPath);

            return ResponseEntity.ok(Map.of("success", true, "url", "/api/homework/attachments/" + storedName));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/attachments/{fileName:.+}")
    public ResponseEntity<Resource> getAttachment(@PathVariable String fileName) {
        try {
            Path filePath = uploadDir.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

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

    private Map<String, Object> toMap(Homework homework) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", homework.getId());
        map.put("classId", homework.getSchoolClass() != null ? homework.getSchoolClass().getId() : null);
        map.put("teacherId", homework.getTeacher() != null ? homework.getTeacher().getId() : null);
        map.put("title", homework.getTitle());
        map.put("description", homework.getDescription());
        map.put("dueDate", homework.getDueDate() != null ? homework.getDueDate().toString() : null);
        map.put("attachmentUrls", homeworkService.deserializeUrls(homework.getAttachmentUrls()));
        map.put("createdAt", homework.getCreatedAt() != null ? homework.getCreatedAt().toString() : null);
        return map;
    }

    // ── NEW: Homework Detail Dashboard ──

    @GetMapping("/detail/{homeworkId}")
    public ResponseEntity<Map<String, Object>> getHomeworkDetail(@PathVariable String homeworkId) {
        try {
            HomeworkDetailDTO detail = homeworkService.getHomeworkDetail(homeworkId);
            return ResponseEntity.ok(Map.of("success", true, "data", detail));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    // ── NEW: Capture mark for a learner on a homework ──

    @PostMapping("/{homeworkId}/mark")
    public ResponseEntity<Map<String, Object>> captureMark(
            @PathVariable String homeworkId,
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
            homeworkService.captureMark(homeworkId, learnerId, mark);
            return ResponseEntity.ok(Map.of("success", true, "message", "Mark captured"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    // ── NEW: Toggle submission status ──

    @PostMapping("/{homeworkId}/toggle-submission")
    public ResponseEntity<Map<String, Object>> toggleSubmission(
            @PathVariable String homeworkId,
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
            homeworkService.toggleSubmission(homeworkId, learnerId, submitted);
            return ResponseEntity.ok(Map.of("success", true, "message", "Submission toggled"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{homeworkId}/bulk-submissions")
    public ResponseEntity<Map<String, Object>> bulkUpdateSubmissions(
            @PathVariable String homeworkId,
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

            int updatedCount = homeworkService.bulkUpdateSubmissions(homeworkId, entries, teacher.getId());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of("updatedCount", updatedCount),
                    "message", "Homework entries submitted"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    // ── NEW: Award star from homework view ──

    @PostMapping("/{homeworkId}/award-star")
    public ResponseEntity<Map<String, Object>> awardStarFromHomework(
            @PathVariable String homeworkId,
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
            req.setCategory(StarCategory.HOMEWORK);
            req.setStarCount(starCount);
            req.setNote(note != null ? note : "Homework star");
            starsService.awardStar(req, teacherId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Star awarded"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{homeworkId}/toggle-star")
    public ResponseEntity<Map<String, Object>> toggleStarFromHomework(
            @PathVariable String homeworkId,
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

            boolean awarded = homeworkService.toggleHomeworkStar(homeworkId, learnerId, classId, teacher.getId());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of("awarded", awarded),
                    "message", awarded ? "Star awarded" : "Star removed"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    private Map<String, Object> errorBody(String message) {
        return Map.of("success", false, "error", Map.of("message", message));
    }
}
