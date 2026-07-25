package com.schoolapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Authentication related DTOs
 */
public class AuthDTO {

    /**
     * Login request
     */
    public static class LoginRequest {
        @Email(message = "Email should be valid")
        @NotBlank(message = "Email is required")
        public String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        public String password;

        public LoginRequest() {}

        public LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }
    }

    /**
     * Register request (teacher/parent/learner)
     */
    public static class RegisterRequest {
        @Email(message = "Email should be valid")
        @NotBlank(message = "Email is required")
        public String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        public String password;

        @NotBlank(message = "First name is required")
        public String firstName;

        @NotBlank(message = "Last name is required")
        public String lastName;

        @NotBlank(message = "Role is required")
        public String role; // 'teacher', 'parent', 'learner'

        public String schoolId; // Optional - can be provided or set later

        public RegisterRequest() {}

        public RegisterRequest(String email, String password, String firstName, 
                             String lastName, String role) {
            this.email = email;
            this.password = password;
            this.firstName = firstName;
            this.lastName = lastName;
            this.role = role;
        }
    }

    /**
     * Auth response with JWT token
     */
    public static class AuthResponse {
        public String token;
        public UserInfo user;
        public String message;

        public AuthResponse(String token, UserInfo user) {
            this.token = token;
            this.user = user;
            this.message = "Authentication successful";
        }

        public AuthResponse(String message) {
            this.message = message;
        }
    }

    /**
     * User info included in auth response
     */
    public static class UserInfo {
        public String id;
        public String email;
        public String firstName;
        public String lastName;
        public String role;
        public String schoolId;

        public UserInfo() {}

        public UserInfo(String id, String email, String firstName, String lastName, 
                       String role, String schoolId) {
            this.id = id;
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
            this.role = role;
            this.schoolId = schoolId;
        }
    }

    /**
     * Password reset request
     */
    public static class PasswordResetRequest {
        @Email(message = "Email should be valid")
        @NotBlank(message = "Email is required")
        public String email;

        public PasswordResetRequest() {}

        public PasswordResetRequest(String email) {
            this.email = email;
        }
    }

    /**
     * Error response
     */
    public static class ErrorResponse {
        public String error;
        public String message;
        public long timestamp;

        public ErrorResponse(String error, String message) {
            this.error = error;
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }
    }
}
