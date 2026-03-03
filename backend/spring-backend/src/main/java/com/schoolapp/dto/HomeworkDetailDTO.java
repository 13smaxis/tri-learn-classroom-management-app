package com.schoolapp.dto;

import java.util.List;

public class HomeworkDetailDTO {

    private String homeworkId;
    private String title;
    private String description;
    private String dueDate;
    private String createdAt;
    private List<String> attachmentUrls;

    // Aggregated stats
    private int totalLearners;
    private int submittedCount;
    private double submissionRate;   // percentage
    private double passRate;         // percentage (marks >= 50)
    private List<TopLearnerDTO> topLearners;     // top 5 by mark
    private List<LearnerRowDTO> learnerRows;     // all learners with marks & stars

    public HomeworkDetailDTO() {}

    // ── Getters & Setters ──

    public String getHomeworkId() { return homeworkId; }
    public void setHomeworkId(String homeworkId) { this.homeworkId = homeworkId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public List<String> getAttachmentUrls() { return attachmentUrls; }
    public void setAttachmentUrls(List<String> attachmentUrls) { this.attachmentUrls = attachmentUrls; }

    public int getTotalLearners() { return totalLearners; }
    public void setTotalLearners(int totalLearners) { this.totalLearners = totalLearners; }

    public int getSubmittedCount() { return submittedCount; }
    public void setSubmittedCount(int submittedCount) { this.submittedCount = submittedCount; }

    public double getSubmissionRate() { return submissionRate; }
    public void setSubmissionRate(double submissionRate) { this.submissionRate = submissionRate; }

    public double getPassRate() { return passRate; }
    public void setPassRate(double passRate) { this.passRate = passRate; }

    public List<TopLearnerDTO> getTopLearners() { return topLearners; }
    public void setTopLearners(List<TopLearnerDTO> topLearners) { this.topLearners = topLearners; }

    public List<LearnerRowDTO> getLearnerRows() { return learnerRows; }
    public void setLearnerRows(List<LearnerRowDTO> learnerRows) { this.learnerRows = learnerRows; }

    // ── Nested DTOs ──

    public static class TopLearnerDTO {
        private String learnerId;
        private String fullName;
        private String learnerNumber;
        private Double mark;

        public TopLearnerDTO() {}
        public TopLearnerDTO(String learnerId, String fullName, String learnerNumber, Double mark) {
            this.learnerId = learnerId;
            this.fullName = fullName;
            this.learnerNumber = learnerNumber;
            this.mark = mark;
        }

        public String getLearnerId() { return learnerId; }
        public void setLearnerId(String learnerId) { this.learnerId = learnerId; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getLearnerNumber() { return learnerNumber; }
        public void setLearnerNumber(String learnerNumber) { this.learnerNumber = learnerNumber; }
        public Double getMark() { return mark; }
        public void setMark(Double mark) { this.mark = mark; }
    }

    public static class LearnerRowDTO {
        private String learnerId;
        private String learnerNumber;
        private String fullName;
        private boolean submitted;
        private Double mark;
        private int totalStars;
        private int homeworkStars;
        private String submissionId;

        public LearnerRowDTO() {}

        public String getLearnerId() { return learnerId; }
        public void setLearnerId(String learnerId) { this.learnerId = learnerId; }
        public String getLearnerNumber() { return learnerNumber; }
        public void setLearnerNumber(String learnerNumber) { this.learnerNumber = learnerNumber; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public boolean isSubmitted() { return submitted; }
        public void setSubmitted(boolean submitted) { this.submitted = submitted; }
        public Double getMark() { return mark; }
        public void setMark(Double mark) { this.mark = mark; }
        public int getTotalStars() { return totalStars; }
        public void setTotalStars(int totalStars) { this.totalStars = totalStars; }
        public int getHomeworkStars() { return homeworkStars; }
        public void setHomeworkStars(int homeworkStars) { this.homeworkStars = homeworkStars; }
        public String getSubmissionId() { return submissionId; }
        public void setSubmissionId(String submissionId) { this.submissionId = submissionId; }
    }
}
