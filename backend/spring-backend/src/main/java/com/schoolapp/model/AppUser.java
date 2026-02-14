package com.schoolapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "app_users")
public class AppUser 
{
    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)                                                                                   //- Full name of the user, cannot be null in the database.
    private String fullName;

    @Column(unique = true)                                                                                      //- Email address of the user, must be unique across all users in the database.
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)                                                                                //- Role of the user (e.g., STUDENT, TEACHER, ADMIN), stored as a string in the database, cannot be null.
    @Column(nullable = false)
    private Role role;

    private String title;
    private String phone;
    private String avatarUrl;
    private String teacherInviteCode;
    private String teacherGrade;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AppUser() {}

    // ── Getters & Setters ──

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getTeacherInviteCode() { return teacherInviteCode; }
    public void setTeacherInviteCode(String teacherInviteCode) { this.teacherInviteCode = teacherInviteCode; }

    public String getTeacherGrade() { return teacherGrade; }
    public void setTeacherGrade(String teacherGrade) { this.teacherGrade = teacherGrade; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
