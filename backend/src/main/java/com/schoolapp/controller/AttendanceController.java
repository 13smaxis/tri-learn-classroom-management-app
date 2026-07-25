package com.schoolapp.controller;

import com.schoolapp.dto.AttendanceRecordDTO;
import com.schoolapp.dto.LearnerDTO;
import com.schoolapp.dto.SaveAttendanceRequest;
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

    // GET /attendance/learners/{classId}
    @GetMapping("/learners/{classId}")
    public ResponseEntity<?> getLearners(@PathVariable String classId) {
        try {
            List<LearnerDTO> learners = attendanceService.getLearnersForClass(classId);
            return ResponseEntity.ok(Map.of("success", true, "data", learners));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
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

    // POST /attendance/save
    @PostMapping("/save")
    public ResponseEntity<?> saveAttendance(@RequestBody SaveAttendanceRequest request) {
        try {
            attendanceService.saveAttendance(request);
            return ResponseEntity.ok(Map.of("success", true, "data", "Attendance saved"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // GET /attendance/records/{classId}/{date}
    @GetMapping("/records/{classId}/{date}")
    public ResponseEntity<?> getAttendanceForDate(@PathVariable String classId, @PathVariable String date) {
        try {
            Map<String, String> records = attendanceService.getAttendanceForDate(classId, date);
            return ResponseEntity.ok(Map.of("success", true, "data", records));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // GET /attendance/records/{classId}?startDate=...&endDate=...
    @GetMapping("/records/{classId}")
    public ResponseEntity<?> getAttendanceForDateRange(
            @PathVariable String classId,
            @RequestParam String startDate,
            @RequestParam String endDate
    ) {
        try {
            List<AttendanceRecordDTO> records = attendanceService.getAttendanceForDateRange(classId, startDate, endDate);
            return ResponseEntity.ok(Map.of("success", true, "data", records));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    // GET /attendance/learner/{learnerId}
    @GetMapping("/learner/{learnerId}")
    public ResponseEntity<?> getAttendanceForLearner(@PathVariable String learnerId) {
        try {
            List<AttendanceRecordDTO> records = attendanceService.getAttendanceForLearner(learnerId);
            return ResponseEntity.ok(Map.of("success", true, "data", records));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }
}
