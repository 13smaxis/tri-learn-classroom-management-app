package com.schoolapp.controller;

import com.schoolapp.dto.CreateClassworkRequest;
import com.schoolapp.dto.ClassworkDetailDTO;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Classwork;
import com.schoolapp.service.ClassworkService;
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
@RequestMapping("/classwork")
public class ClassworkController {

    private final ClassworkService classworkService;
    private final StarsService starsService;
    private final Path uploadDir = Paths.get("data", "uploads", "classwork");

    public ClassworkController(ClassworkService classworkService, StarsService starsService) {
        this.classworkService = classworkService;
        this.starsService = starsService;
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createClasswork(@RequestBody CreateClassworkRequest request, Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            Classwork classwork = classworkService.createClasswork(teacher, request);
            return ResponseEntity.status(201).body(Map.of("success", true, "data", toMap(classwork)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getClassworkCount(Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            long count = classworkService.countByTeacher(teacher.getId());
            return ResponseEntity.ok(Map.of("success", true, "data", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/count/{classId}")
    public ResponseEntity<Map<String, Object>> getClassworkCountForClass(@PathVariable String classId) {
        try {
            long count = classworkService.countByClass(classId);
            return ResponseEntity.ok(Map.of("success", true, "data", count));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/list/{classId}")
    public ResponseEntity<Map<String, Object>> getClassworkList(@PathVariable String classId) {
        try {
            List<Map<String, Object>> data = classworkService.getClassworkForClass(classId)
                    .stream()
                    .map(this::toMap)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @DeleteMapping("/{classworkId}")
    public ResponseEntity<Map<String, Object>> deleteClasswork(@PathVariable String classworkId, Authentication auth) {
        try {
            if (!(auth.getPrincipal() instanceof AppUser teacher)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            classworkService.deleteClasswork(classworkId, teacher);
            return ResponseEntity.ok(Map.of("success", true, "data", "Classwork deleted"));
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

            return ResponseEntity.ok(Map.of("success", true, "url", "/api/classwork/attachments/" + storedName));
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

    private Map<String, Object> toMap(Classwork classwork) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", classwork.getId());
        map.put("classId", classwork.getSchoolClass() != null ? classwork.getSchoolClass().getId() : null);
        map.put("teacherId", classwork.getTeacher() != null ? classwork.getTeacher().getId() : null);
        map.put("title", classwork.getTitle());
        map.put("description", classwork.getDescription());
        map.put("dueDate", classwork.getDueDate() != null ? classwork.getDueDate().toString() : null);
        map.put("attachmentUrls", classworkService.deserializeUrls(classwork.getAttachmentUrls()));
        map.put("createdAt", classwork.getCreatedAt() != null ? classwork.getCreatedAt().toString() : null);
        return map;
    }

    @GetMapping("/detail/{classworkId}")
    public ResponseEntity<Map<String, Object>> getClassworkDetail(@PathVariable String classworkId) {
        try {
            ClassworkDetailDTO detail = classworkService.getClassworkDetail(classworkId);
            return ResponseEntity.ok(Map.of("success", true, "data", detail));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{classworkId}/mark")
    public ResponseEntity<Map<String, Object>> captureMark(
            @PathVariable String classworkId,
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
            classworkService.captureMark(classworkId, learnerId, mark);
            return ResponseEntity.ok(Map.of("success", true, "message", "Mark captured"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{classworkId}/toggle-submission")
    public ResponseEntity<Map<String, Object>> toggleSubmission(
            @PathVariable String classworkId,
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
            classworkService.toggleSubmission(classworkId, learnerId, submitted);
            return ResponseEntity.ok(Map.of("success", true, "message", "Submission toggled"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{classworkId}/bulk-submissions")
    public ResponseEntity<Map<String, Object>> bulkUpdateSubmissions(
            @PathVariable String classworkId,
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

            int updatedCount = classworkService.bulkUpdateSubmissions(classworkId, entries, teacher.getId());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of("updatedCount", updatedCount),
                    "message", "Classwork entries submitted"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{classworkId}/award-star")
    public ResponseEntity<Map<String, Object>> awardStarFromClasswork(
            @PathVariable String classworkId,
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
            req.setCategory(StarCategory.CLASSWORK);
            req.setStarCount(starCount);
            req.setNote(note != null ? note : "Classwork star");
            starsService.awardStar(req, teacherId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Star awarded"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @PostMapping("/{classworkId}/toggle-star")
    public ResponseEntity<Map<String, Object>> toggleStarFromClasswork(
            @PathVariable String classworkId,
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

            boolean awarded = classworkService.toggleClassworkStar(classworkId, learnerId, classId, teacher.getId());
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
