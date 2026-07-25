package com.schoolapp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "homework_submissions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"homework_id", "learner_id"}))
public class HomeworkSubmission {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homework_id", nullable = false)
    private Homework homework;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;

    /** Mark out of 100, nullable until teacher captures it */
    private Double mark;

    /** Whether the learner has submitted */
    @Column(nullable = false)
    private boolean submitted = false;

    @Column(updatable = false)
    private LocalDateTime submittedAt;

    private LocalDateTime markedAt;

    public HomeworkSubmission() {}

    public HomeworkSubmission(Homework homework, Learner learner) {
        this.homework = homework;
        this.learner = learner;
    }

    // ── Getters & Setters ──

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Homework getHomework() { return homework; }
    public void setHomework(Homework homework) { this.homework = homework; }

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
