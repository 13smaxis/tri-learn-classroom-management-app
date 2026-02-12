package com.schoolapp.dto;

public class AttendanceRecordDTO {
    private String id;
    private String learnerId;
    private String learnerNumber;
    private String learnerName;
    private String date;
    private String status;

    public AttendanceRecordDTO() {}

    public AttendanceRecordDTO(String id, String learnerId, String learnerNumber, String learnerName, String date, String status) {
        this.id = id;
        this.learnerId = learnerId;
        this.learnerNumber = learnerNumber;
        this.learnerName = learnerName;
        this.date = date;
        this.status = status;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLearnerId() { return learnerId; }
    public void setLearnerId(String learnerId) { this.learnerId = learnerId; }

    public String getLearnerNumber() { return learnerNumber; }
    public void setLearnerNumber(String learnerNumber) { this.learnerNumber = learnerNumber; }

    public String getLearnerName() { return learnerName; }
    public void setLearnerName(String learnerName) { this.learnerName = learnerName; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
