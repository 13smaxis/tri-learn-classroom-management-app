package com.schoolapp.controller;

import com.schoolapp.dto.LoginRequest;
import com.schoolapp.dto.RegisterRequest;
import com.schoolapp.dto.UserResponse;
import com.schoolapp.model.AppUser;
import com.schoolapp.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * This controller handles authentication-related endpoints such as registration, login, fetching current user info, and logout.
 * It's sole function is to receive HTTP requests related to authentication, delegate the processing to the AuthService and return appropriate HTTP responses.
 * It uses the AuthService to perform the actual business logic.
 */
@RestController
@RequestMapping("/auth")
public class AuthController 
{
    private final AuthService authService;

    public AuthController(AuthService authService) 
    {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) 
    {
        try {
            UserResponse user = authService.register(req);
            return ResponseEntity.status(201).body(Map.of("success", true, "data", user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            UserResponse user = authService.login(req);
            return ResponseEntity.ok(Map.of("success", true, "data", user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        try {
            AppUser appUser = (AppUser) authentication.getPrincipal();
            UserResponse user = authService.getCurrentUser(appUser.getId());
            return ResponseEntity.ok(Map.of("success", true, "data", user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("success", false, "error", Map.of("message", e.getMessage())));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("success", true));
    }
}
