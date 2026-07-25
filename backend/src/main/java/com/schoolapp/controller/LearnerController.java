package com.schoolapp.controller;

import com.schoolapp.model.AppUser;
import com.schoolapp.repository.UserRepository;
import org.springframework.lang.NonNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/learners")
public class LearnerController {

    private final UserRepository userRepository;

    public LearnerController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Fetch all learners
    @GetMapping("")
    public ResponseEntity<?> getAllLearners() {
        List<AppUser> learners = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().name().equalsIgnoreCase("LEARNER"))
                .collect(Collectors.toList());
        List<Map<String, Object>> data = learners.stream().map(u -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", u.getId());
            m.put("fullName", u.getFullName());
            m.put("email", u.getEmail());
            m.put("learnerNumber", u.getPhone());
            m.put("createdAt", u.getCreatedAt());
            return m;
        }).collect(Collectors.toList());
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    // Fetch a single learner by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getLearnerById(@PathVariable @NonNull String id) {
        return userRepository.findById(id)
                .filter(u -> u.getRole() != null && u.getRole().name().equalsIgnoreCase("LEARNER"))
                .map(u -> {
                    Map<String, Object> data = new java.util.HashMap<>();
                    data.put("id", u.getId());
                    data.put("fullName", u.getFullName());
                    data.put("email", u.getEmail());
                    data.put("learnerNumber", u.getPhone());
                    data.put("createdAt", u.getCreatedAt());
                    Map<String, Object> response = new java.util.HashMap<>();
                    response.put("success", true);
                    response.put("data", data);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> error = new java.util.HashMap<>();
                    error.put("message", "Learner not found");
                    Map<String, Object> response = new java.util.HashMap<>();
                    response.put("success", false);
                    response.put("error", error);
                    return ResponseEntity.status(404).body(response);
                });
    }
}
