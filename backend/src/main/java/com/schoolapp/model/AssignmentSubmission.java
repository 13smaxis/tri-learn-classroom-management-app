package com.schoolapp.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "assignment_submissions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"assignment_id", "learner_id"})
)
public class AssignmentSubmission {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    private Double mark;

    @Column(nullable = false)
    private boolean submitted = false;

    @Column(updatable = false)
    private LocalDateTime submittedAt;

    private LocalDateTime markedAt;

    public AssignmentSubmission() {}

    public AssignmentSubmission(Assignment assignment, Learner learner) {
        this.assignment = assignment;
        this.learner = learner;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }

    public Learner getLearner() { return learner; }
    public void setLearner(Learner learner) { this.learner = learner; }

    public Double getMark() { return mark; }
    public void setMark(Double mark) { this.mark = mark; }

    public boolean isSubmitted() { return submitted; }
    public void setSubmitted(boolean submitted) { this.submitted = submitted; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getMarkedAt() { return markedAt; }
    public void setMarkedAt(LocalDateTime markedAt) { this.markedAt = markedAt; }
}
