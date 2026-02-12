package com.schoolapp.dto;

public class LearnerDTO {
    private String id;
    private String learnerNumber;
    private String fullName;

    public LearnerDTO() {}

    public LearnerDTO(String id, String learnerNumber, String fullName) {
        this.id = id;
        this.learnerNumber = learnerNumber;
        this.fullName = fullName;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLearnerNumber() { return learnerNumber; }
    public void setLearnerNumber(String learnerNumber) { this.learnerNumber = learnerNumber; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
}
