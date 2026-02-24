package com.schoolapp.dto;

public class StudentRecognitionDTO {
    private String learnerId;
    private String learnerNumber;
    private String fullName;
    private Double attendanceRate;  // percentage
    private Integer attendanceStars;
    private Integer homeworkStars;
    private Integer assignmentStars;
    private Integer totalStars;

    public StudentRecognitionDTO() {}

    public StudentRecognitionDTO(String learnerId, String learnerNumber, String fullName) {
        this.learnerId = learnerId;
        this.learnerNumber = learnerNumber;
        this.fullName = fullName;
    }

    public String getLearnerId() { return learnerId; }
    public void setLearnerId(String learnerId) { this.learnerId = learnerId; }

    public String getLearnerNumber() { return learnerNumber; }
    public void setLearnerNumber(String learnerNumber) { this.learnerNumber = learnerNumber; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Double getAttendanceRate() { return attendanceRate; }
    public void setAttendanceRate(Double attendanceRate) { this.attendanceRate = attendanceRate; }

    public Integer getAttendanceStars() { return attendanceStars; }
    public void setAttendanceStars(Integer attendanceStars) { this.attendanceStars = attendanceStars; }

    public Integer getHomeworkStars() { return homeworkStars; }
    public void setHomeworkStars(Integer homeworkStars) { this.homeworkStars = homeworkStars; }

    public Integer getAssignmentStars() { return assignmentStars; }
    public void setAssignmentStars(Integer assignmentStars) { this.assignmentStars = assignmentStars; }

    public Integer getTotalStars() { return totalStars; }
    public void setTotalStars(Integer totalStars) { this.totalStars = totalStars; }
}
