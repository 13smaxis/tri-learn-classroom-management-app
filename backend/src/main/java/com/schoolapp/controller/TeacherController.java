package com.schoolapp.controller;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.schoolapp.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.UUID;

/**
 * Teacher module endpoints
 * Base path: /api/teacher
 * 
 * All endpoints require JWT token with role='teacher'
 */
@RestController
@RequestMapping("/teacher")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class TeacherController extends BaseController {

    @Autowired
    private SupabaseService supabaseService;

    /**
     * GET /teacher/learners
     * Get all learners in teacher's classes
     */
    @GetMapping("/learners")
    public ResponseEntity<?> getLearners() {
        try {
            logOperation("GET_LEARNERS", "Fetching learners for teacher");
            UUID teacherId = getCurrentUserId();
            
            // Query: Get all classes for this teacher, then get learners in those classes
            String query = "teacher_id=eq." + teacherId + "&select=*,class_members(*,learners(*))";
            JsonArray classes = supabaseService.get("classes", query);
            
            return success(classes);
        } catch (IOException e) {
            logger.error("Error fetching learners: {}", e.getMessage());
            return error("Failed to fetch learners", 500);
        }
    }

    /**
     * GET /teacher/learners/:id
     * Get specific learner details
     */
    @GetMapping("/learners/{id}")
    public ResponseEntity<?> getLearner(@PathVariable String id) {
        try {
            logOperation("GET_LEARNER", "Fetching learner: " + id);
            UUID schoolId = getCurrentSchoolId();
            
            JsonObject learner = supabaseService.getById("learners", UUID.fromString(id), schoolId);
            if (learner == null) {
                return error("Learner not found", 404);
            }
            
            return success(learner);
        } catch (IOException e) {
            logger.error("Error fetching learner: {}", e.getMessage());
            return error("Failed to fetch learner", 500);
        }
    }

    /**
     * POST /teacher/learners
     * Create new learner (assign to class)
     */
    @PostMapping("/learners")
    public ResponseEntity<?> createLearner(@RequestBody JsonObject request) {
        try {
            logOperation("CREATE_LEARNER", "Creating new learner");
            
            // Validate required fields
            if (!request.has("user_id") || !request.has("class_id")) {
                return error("Missing required fields: user_id, class_id", 400);
            }

            // Insert learner
            JsonObject learner = supabaseService.post("learners", request);
            
            // Add to class members
            JsonObject classMember = new JsonObject();
            classMember.addProperty("class_id", request.get("class_id").getAsString());
            classMember.addProperty("learner_id", learner.get("id").getAsString());
            supabaseService.post("class_members", classMember);

            logOperation("CREATE_LEARNER_SUCCESS", "Learner created: " + learner.get("id"));
            return created(learner);
        } catch (IOException e) {
            logger.error("Error creating learner: {}", e.getMessage());
            return error("Failed to create learner", 500);
        }
    }

    /**
     * PUT /teacher/learners/:id
     * Update learner details
     */
    @PutMapping("/learners/{id}")
    public ResponseEntity<?> updateLearner(@PathVariable String id, @RequestBody JsonObject request) {
        try {
            logOperation("UPDATE_LEARNER", "Updating learner: " + id);
            
            JsonObject updated = supabaseService.put("learners", id, request);
            return success(updated);
        } catch (IOException e) {
            logger.error("Error updating learner: {}", e.getMessage());
            return error("Failed to update learner", 500);
        }
    }

    /**
     * DELETE /teacher/learners/:id
     * Remove learner from class
     */
    @DeleteMapping("/learners/{id}")
    public ResponseEntity<?> deleteLearner(@PathVariable String id) {
        try {
            logOperation("DELETE_LEARNER", "Deleting learner: " + id);
            
            supabaseService.delete("learners", id);
            return ResponseEntity.ok(new Object() {
                public String message = "Learner deleted successfully";
            });
        } catch (IOException e) {
            logger.error("Error deleting learner: {}", e.getMessage());
            return error("Failed to delete learner", 500);
        }
    }

    /**
     * GET /teacher/classes
     * Get all classes for teacher
     */
    @GetMapping("/classes")
    public ResponseEntity<?> getClasses() {
        try {
            logOperation("GET_CLASSES", "Fetching classes for teacher");
            UUID teacherId = getCurrentUserId();
            
            String query = "teacher_id=eq." + teacherId;
            JsonArray classes = supabaseService.get("classes", query);
            
            return success(classes);
        } catch (IOException e) {
            logger.error("Error fetching classes: {}", e.getMessage());
            return error("Failed to fetch classes", 500);
        }
    }

    /**
     * GET /teacher/classes/:id
     * Get class details with members
     */
    @GetMapping("/classes/{id}")
    public ResponseEntity<?> getClass(@PathVariable String id) {
        try {
            logOperation("GET_CLASS", "Fetching class: " + id);
            UUID schoolId = getCurrentSchoolId();
            
            JsonObject classData = supabaseService.getById("classes", UUID.fromString(id), schoolId);
            if (classData == null) {
                return error("Class not found", 404);
            }
            
            return success(classData);
        } catch (IOException e) {
            logger.error("Error fetching class: {}", e.getMessage());
            return error("Failed to fetch class", 500);
        }
    }

    /**
     * POST /teacher/classes
     * Create new class
     */
    @PostMapping("/classes")
    public ResponseEntity<?> createClass(@RequestBody JsonObject request) {
        try {
            logOperation("CREATE_CLASS", "Creating new class");
            UUID teacherId = getCurrentUserId();
            UUID schoolId = getCurrentSchoolId();
            
            // Set teacher and school
            request.addProperty("teacher_id", teacherId.toString());
            request.addProperty("school_id", schoolId.toString());
            
            // Generate invite code
            if (!request.has("invite_code")) {
                request.addProperty("invite_code", generateInviteCode());
            }

            JsonObject classData = supabaseService.post("classes", request);
            return created(classData);
        } catch (IOException e) {
            logger.error("Error creating class: {}", e.getMessage());
            return error("Failed to create class", 500);
        }
    }

    /**
     * PUT /teacher/classes/:id
     * Update class details
     */
    @PutMapping("/classes/{id}")
    public ResponseEntity<?> updateClass(@PathVariable String id, @RequestBody JsonObject request) {
        try {
            logOperation("UPDATE_CLASS", "Updating class: " + id);
            
            JsonObject updated = supabaseService.put("classes", id, request);
            return success(updated);
        } catch (IOException e) {
            logger.error("Error updating class: {}", e.getMessage());
            return error("Failed to update class", 500);
        }
    }

    /**
     * POST /teacher/marks
     * Record marks for learner
     */
    @PostMapping("/marks")
    public ResponseEntity<?> recordMarks(@RequestBody JsonObject request) {
        try {
            logOperation("RECORD_MARKS", "Recording marks");
            
            if (!request.has("learner_id") || !request.has("class_id") || !request.has("mark")) {
                return error("Missing required fields", 400);
            }

            // Calculate percentage
            if (request.has("mark") && request.has("total_mark")) {
                double mark = request.get("mark").getAsDouble();
                double totalMark = request.get("total_mark").getAsDouble();
                double percentage = (mark / totalMark) * 100;
                request.addProperty("percentage", percentage);
            }

            JsonObject marks = supabaseService.post("marks", request);
            return created(marks);
        } catch (IOException e) {
            logger.error("Error recording marks: {}", e.getMessage());
            return error("Failed to record marks", 500);
        }
    }

    /**
     * POST /teacher/attendance
     * Record attendance
     */
    @PostMapping("/attendance")
    public ResponseEntity<?> recordAttendance(@RequestBody JsonObject request) {
        try {
            logOperation("RECORD_ATTENDANCE", "Recording attendance");
            
            if (!request.has("learner_id") || !request.has("class_id") || !request.has("status")) {
                return error("Missing required fields", 400);
            }

            JsonObject attendance = supabaseService.post("attendance", request);
            return created(attendance);
        } catch (IOException e) {
            logger.error("Error recording attendance: {}", e.getMessage());
            return error("Failed to record attendance", 500);
        }
    }

    /**
     * Generate unique invite code for class
     */
    private String generateInviteCode() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
