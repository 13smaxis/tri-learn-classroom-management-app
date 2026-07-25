package com.schoolapp.controller;

import com.schoolapp.config.TenantContext;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;

/**
 * Base controller with common tenant and security helpers
 */
public abstract class BaseController {
    protected static final Logger logger = LoggerFactory.getLogger(BaseController.class);

    /**
     * Get current user ID from tenant context
     */
    protected UUID getCurrentUserId() {
        return TenantContext.getUserId();
    }

    /**
     * Get current school ID from tenant context
     */
    protected UUID getCurrentSchoolId() {
        return TenantContext.getSchoolId();
    }

    /**
     * Get current user role from tenant context
     */
    protected String getCurrentUserRole() {
        return TenantContext.getUserRole();
    }

    /**
     * Log operation for debugging
     */
    protected void logOperation(String operation, String details) {
        logger.info("Operation: {} | User: {} | School: {} | Details: {}", 
            operation, getCurrentUserId(), getCurrentSchoolId(), details);
    }

    /**
     * Create success response
     */
    protected <T> ResponseEntity<T> success(T data) {
        return ResponseEntity.ok(data);
    }

    /**
     * Create created response (201)
     */
    protected <T> ResponseEntity<T> created(T data) {
        return ResponseEntity.status(201).body(data);
    }

    /**
     * Create error response
     */
    protected ResponseEntity<?> error(String message, int status) {
        ErrorResponse error = new ErrorResponse(message, status);
        return ResponseEntity.status(status).body(error);
    }

    /**
     * Error response object
     */
    public static class ErrorResponse {
        public String message;
        public int status;
        public long timestamp;

        public ErrorResponse(String message, int status) {
            this.message = message;
            this.status = status;
            this.timestamp = System.currentTimeMillis();
        }
    }
}
