package com.schoolapp.controller;

import com.schoolapp.dto.CreateHomeworkRequest;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Homework;
import com.schoolapp.service.HomeworkService;
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
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/homework")
public class HomeworkController {

    private final HomeworkService homeworkService;
    private final Path uploadDir = Paths.get("data", "uploads", "homework");

    public HomeworkController(HomeworkService homeworkService) {
        this.homeworkService = homeworkService;
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createHomework(@RequestBody CreateHomeworkRequest request, Authentication auth) {
        try {
            Object principal = auth.getPrincipal();
            if (!(principal instanceof AppUser)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            AppUser teacher = (AppUser) principal;
            Homework homework = homeworkService.createHomework(teacher, request);
            return ResponseEntity.status(201).body(Map.of("success", true, "data", toMap(homework)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(errorBody(e.getMessage()));
        }
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getHomeworkCount(Authentication auth) {
        try {
            Object principal = auth.getPrincipal();
            if (!(principal instanceof AppUser)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            AppUser teacher = (AppUser) principal;
            long count = homeworkService.getHomeworkCountForTeacher(teacher.getId());
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
            Object principal = auth.getPrincipal();
            if (!(principal instanceof AppUser)) {
                return ResponseEntity.status(401).body(errorBody("Unauthorized"));
            }
            AppUser teacher = (AppUser) principal;
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
            String sanitizedName = Paths.get(originalName).getFileName().toString();
            String storedName = UUID.randomUUID() + "-" + sanitizedName;

            Path targetPath = uploadDir.resolve(storedName).normalize();
            file.transferTo(targetPath.toFile());

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
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
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

    private Map<String, Object> errorBody(String message) {
        return Map.of("success", false, "error", Map.of("message", message));
    }
}
