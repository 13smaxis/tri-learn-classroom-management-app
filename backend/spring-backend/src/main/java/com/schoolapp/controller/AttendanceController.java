package com.schoolapp.controller;

import com.schoolapp.dto.*;
import com.schoolapp.model.AppUser;
import com.schoolapp.service.AttendanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    /**
     * Upload learners for a class (replace existing)
     */
    @PostMapping("/upload-learners")
    public ResponseEntity<ApiResponse<List<LearnerDTO>>> uploadLearners(
            @AuthenticationPrincipal AppUser teacher,
            @RequestBody UploadLearnersRequest request) {

        if (teacher == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }

        try {
            List<LearnerDTO> learners = attendanceService.uploadLearners(request);
            return ResponseEntity.ok(ApiResponse.success(learners));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("UPLOAD_FAILED", e.getMessage()));
        }
    }

    /**
     * Get all learners for a class
     */
    @GetMapping("/learners/{classId}")
    public ResponseEntity<ApiResponse<List<LearnerDTO>>> getLearners(
            @AuthenticationPrincipal AppUser user,
            @PathVariable String classId) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }

        try {
            List<LearnerDTO> learners = attendanceService.getLearnersForClass(classId);
            return ResponseEntity.ok(ApiResponse.success(learners));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("FETCH_FAILED", e.getMessage()));
        }
    }

    /**
     * Save attendance records
     */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<String>> saveAttendance(
            @AuthenticationPrincipal AppUser teacher,
            @RequestBody SaveAttendanceRequest request) {

        if (teacher == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }

        try {
            attendanceService.saveAttendance(request);
            return ResponseEntity.ok(ApiResponse.success("Attendance saved successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("SAVE_FAILED", e.getMessage()));
        }
    }

    /**
     * Get attendance for a specific date
     */
    @GetMapping("/records/{classId}/{date}")
    public ResponseEntity<ApiResponse<Map<String, String>>> getAttendanceForDate(
            @AuthenticationPrincipal AppUser user,
            @PathVariable String classId,
            @PathVariable String date) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }

        try {
            Map<String, String> attendance = attendanceService.getAttendanceForDate(classId, date);
            return ResponseEntity.ok(ApiResponse.success(attendance));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("FETCH_FAILED", e.getMessage()));
        }
    }

    /**
     * Get attendance records for a date range (for reports)
     */
    @GetMapping("/records/{classId}")
    public ResponseEntity<ApiResponse<List<AttendanceRecordDTO>>> getAttendanceForDateRange(
            @AuthenticationPrincipal AppUser user,
            @PathVariable String classId,
            @RequestParam String startDate,
            @RequestParam String endDate) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }

        try {
            List<AttendanceRecordDTO> records = attendanceService
                    .getAttendanceForDateRange(classId, startDate, endDate);
            return ResponseEntity.ok(ApiResponse.success(records));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("FETCH_FAILED", e.getMessage()));
        }
    }

    /**
     * Get all attendance records for a learner
     */
    @GetMapping("/learner/{learnerId}")
    public ResponseEntity<ApiResponse<List<AttendanceRecordDTO>>> getAttendanceForLearner(
            @AuthenticationPrincipal AppUser user,
            @PathVariable String learnerId) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }

        try {
            List<AttendanceRecordDTO> records = attendanceService.getAttendanceForLearner(learnerId);
            return ResponseEntity.ok(ApiResponse.success(records));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("FETCH_FAILED", e.getMessage()));
        }
    }
}
