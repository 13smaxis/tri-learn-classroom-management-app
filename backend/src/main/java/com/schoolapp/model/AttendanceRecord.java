package com.schoolapp.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "attendance_records",
       uniqueConstraints = @UniqueConstraint(columnNames = {"learner_id", "attendance_date"}))                  //-Ensure a learner can only have one attendance record per date

/**
 * Defines how attendance data is stored and structured in the database.
 * Creates and manages a table called attendance_records with these columns and relationships
 */
public class AttendanceRecord 
{
    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();                                                           //-Generates a unique ID for each attendance record

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learner_id", nullable = false)
    private Learner learner;                                                                                    //-Each attendance record is associated with one learner

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private SchoolClass schoolClass;

    @Column(nullable = false)
    private LocalDate attendanceDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status;

    public AttendanceRecord() {}

    /**
     * Constructor to create a new attendance record with the specified learner, class, date, and status.
     * 
     */
    public AttendanceRecord(
                                Learner learner, 
                                SchoolClass schoolClass, 
                                LocalDate attendanceDate, 
                                AttendanceStatus status
                            ) 
    {
        this.learner = learner;
        this.schoolClass = schoolClass;
        this.attendanceDate = attendanceDate;
        this.status = status;
    }

    // ── Getters & Setters ──

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Learner getLearner() { return learner; }
    public void setLearner(Learner learner) { this.learner = learner; }

    public SchoolClass getSchoolClass() { return schoolClass; }
    public void setSchoolClass(SchoolClass schoolClass) { this.schoolClass = schoolClass; }

    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }

    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }
}
