package com.schoolapp.controller;

import com.schoolapp.dto.AuthDTO;
import com.schoolapp.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication endpoints (login, signup, password reset)
 * These endpoints bypass JWT validation (see JwtFilter.shouldNotFilter)
 */
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * POST /auth/login
     * Login with email and password
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        try {
            logger.info("Login attempt for email: {}", request.email);
            AuthDTO.AuthResponse response = authService.login(request.email, request.password);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Login failed: {}", e.getMessage());
            return ResponseEntity.status(401).body(
                new AuthDTO.AuthResponse("Invalid email or password")
            );
        }
    }

    /**
     * POST /auth/signup
     * Register new user (teacher/parent/learner)
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        try {
            logger.info("Signup attempt for email: {} with role: {}", request.email, request.role);
            AuthDTO.AuthResponse response = authService.signup(request);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Signup validation failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(
                new AuthDTO.AuthResponse(e.getMessage())
            );
        } catch (Exception e) {
            logger.error("Signup failed: {}", e.getMessage());
            return ResponseEntity.status(500).body(
                new AuthDTO.AuthResponse("Signup failed: " + e.getMessage())
            );
        }
    }

    /**
     * POST /auth/reset-password
     * Request password reset (sends email link)
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody AuthDTO.PasswordResetRequest request) {
        try {
            logger.info("Password reset requested for email: {}", request.email);
            authService.requestPasswordReset(request.email);
            return ResponseEntity.ok(new AuthDTO.AuthResponse("Password reset email sent"));
        } catch (Exception e) {
            logger.error("Password reset failed: {}", e.getMessage());
            // Don't expose if email exists or not (security)
            return ResponseEntity.ok(new AuthDTO.AuthResponse("If email exists, password reset link was sent"));
        }
    }

    /**
     * GET /auth/health
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(new Object() {
            public String status = "ok";
            public long timestamp = System.currentTimeMillis();
        });
    }

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuthController.class);
}
