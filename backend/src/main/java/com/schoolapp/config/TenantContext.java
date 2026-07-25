package com.schoolapp.config;

import java.util.UUID;

/**
 * ThreadLocal-based tenant context for multi-tenancy.
 * Stores school_id and user_id for every request.
 */
public class TenantContext {
    private static final ThreadLocal<UUID> schoolIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<UUID> userIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userRoleHolder = new ThreadLocal<>();

    /**
     * Set the current school (tenant) ID
     */
    public static void setSchoolId(UUID schoolId) {
        schoolIdHolder.set(schoolId);
    }

    /**
     * Get the current school (tenant) ID
     */
    public static UUID getSchoolId() {
        UUID schoolId = schoolIdHolder.get();
        if (schoolId == null) {
            throw new IllegalStateException("School ID not set in TenantContext");
        }
        return schoolId;
    }

    /**
     * Set the current user ID
     */
    public static void setUserId(UUID userId) {
        userIdHolder.set(userId);
    }

    /**
     * Get the current user ID
     */
    public static UUID getUserId() {
        UUID userId = userIdHolder.get();
        if (userId == null) {
            throw new IllegalStateException("User ID not set in TenantContext");
        }
        return userId;
    }

    /**
     * Set the current user role (teacher, parent, learner)
     */
    public static void setUserRole(String role) {
        userRoleHolder.set(role);
    }

    /**
     * Get the current user role
     */
    public static String getUserRole() {
        String role = userRoleHolder.get();
        if (role == null) {
            throw new IllegalStateException("User role not set in TenantContext");
        }
        return role;
    }

    /**
     * Clear all context - call this in finally block
     */
    public static void clear() {
        schoolIdHolder.remove();
        userIdHolder.remove();
        userRoleHolder.remove();
    }

    /**
     * Check if context is initialized
     */
    public static boolean isInitialized() {
        return schoolIdHolder.get() != null && userIdHolder.get() != null;
    }
}
