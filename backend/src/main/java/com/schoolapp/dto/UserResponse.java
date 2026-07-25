package com.schoolapp.dto;

import java.time.LocalDateTime;

public class UserResponse {
    private String userId;
    private String email;
    private String fullName;
    private String title;
    private String role;
    private String avatarUrl;
    private String teacherInviteCode;
    private String teacherGrade;
    private String token;
    private LocalDateTime createdAt;

    public UserResponse() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getTeacherInviteCode() { return teacherInviteCode; }
    public void setTeacherInviteCode(String teacherInviteCode) { this.teacherInviteCode = teacherInviteCode; }

    public String getTeacherGrade() { return teacherGrade; }
    public void setTeacherGrade(String teacherGrade) { this.teacherGrade = teacherGrade; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
