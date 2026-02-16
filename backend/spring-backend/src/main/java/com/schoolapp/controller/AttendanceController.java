package com.schoolapp.controller;

import com.schoolapp.dto.LearnerDTO;
import com.schoolapp.dto.UploadLearnersRequest;
import com.schoolapp.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {
    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    // POST /attendance/upload-learners
    @PostMapping("/upload-learners")
    public ResponseEntity<?> uploadLearners(@RequestBody UploadLearnersRequest request, Authentication auth) {
        try {
            // Optionally, check if the user is a teacher for the class here
            List<LearnerDTO> learners = attendanceService.uploadLearners(request);
            return ResponseEntity.ok(Map.of("success", true, "data", learners));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }
}
