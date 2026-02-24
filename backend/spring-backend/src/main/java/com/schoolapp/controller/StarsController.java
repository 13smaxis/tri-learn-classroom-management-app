package com.schoolapp.controller;

import com.schoolapp.dto.AwardStarRequest;
import com.schoolapp.dto.StudentRecognitionDTO;
import com.schoolapp.service.StarsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/stars")
public class StarsController {
    private final StarsService starsService;

    public StarsController(StarsService starsService) {
        this.starsService = starsService;
    }

    // POST /stars/award
    @PostMapping("/award")
    public ResponseEntity<?> awardStar(@RequestBody AwardStarRequest request, Authentication auth) {
        try {
            String teacherId = auth.getName();
            starsService.awardStar(request, teacherId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Star awarded successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // GET /stars/class/{classId}
    @GetMapping("/class/{classId}")
    public ResponseEntity<?> getClassRecognition(@PathVariable String classId, Authentication auth) {
        try {
            String teacherId = auth.getName();
            List<StudentRecognitionDTO> recognition = starsService.getClassRecognition(classId, teacherId);
            return ResponseEntity.ok(Map.of("success", true, "data", recognition));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // GET /stars/student/{learnerId}
    @GetMapping("/student/{learnerId}")
    public ResponseEntity<?> getStudentRecognition(@PathVariable String learnerId) {
        try {
            StudentRecognitionDTO recognition = starsService.getStudentRecognition(learnerId);
            return ResponseEntity.ok(Map.of("success", true, "data", recognition));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }
}
