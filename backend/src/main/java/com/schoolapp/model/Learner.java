package com.schoolapp.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "learners")
public class Learner {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String learnerNumber;

    @Column(nullable = false)
    private String fullName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private SchoolClass schoolClass;

    public Learner() {}

    public Learner(String learnerNumber, String fullName, SchoolClass schoolClass) {
        this.learnerNumber = learnerNumber;
        this.fullName = fullName;
        this.schoolClass = schoolClass;
    }

    // ── Getters & Setters ──

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLearnerNumber() { return learnerNumber; }
    public void setLearnerNumber(String learnerNumber) { this.learnerNumber = learnerNumber; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public SchoolClass getSchoolClass() { return schoolClass; }
    public void setSchoolClass(SchoolClass schoolClass) { this.schoolClass = schoolClass; }
}
