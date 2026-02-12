package com.schoolapp.controller;

import com.schoolapp.dto.ApiResponse;
import com.schoolapp.model.AppUser;
import com.schoolapp.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin/debug controller to list all users.
 * Useful for H2 console alternative inspection.
 */
@RestController
@RequestMapping("/users")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AppUser>>> getAllUsers() {
        List<AppUser> users = authService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
