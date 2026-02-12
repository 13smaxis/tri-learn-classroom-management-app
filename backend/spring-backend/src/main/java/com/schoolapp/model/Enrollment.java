package com.schoolapp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "class_id"})
})
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer", "handler"})
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private SchoolClass schoolClass;

    @Enumerated(EnumType.STRING)
    private Role role;

    /** For parents: the learner they are linked to */
    private String linkedLearnerId;

    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }

    // Getters and Setters

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }

    public SchoolClass getSchoolClass() { return schoolClass; }
    public void setSchoolClass(SchoolClass schoolClass) { this.schoolClass = schoolClass; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getLinkedLearnerId() { return linkedLearnerId; }
    public void setLinkedLearnerId(String linkedLearnerId) { this.linkedLearnerId = linkedLearnerId; }

    public LocalDateTime getJoinedAt() { return joinedAt; }
}
