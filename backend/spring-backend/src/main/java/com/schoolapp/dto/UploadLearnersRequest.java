package com.schoolapp.dto;

import java.util.List;

public class UploadLearnersRequest {
    private String classId;
    private List<LearnerData> learners;

    public static class LearnerData {
        private String learnerNumber;
        private String fullName;

        public LearnerData() {}

        public LearnerData(String learnerNumber, String fullName) {
            this.learnerNumber = learnerNumber;
            this.fullName = fullName;
        }

        public String getLearnerNumber() { return learnerNumber; }
        public void setLearnerNumber(String learnerNumber) { this.learnerNumber = learnerNumber; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
    }

    public UploadLearnersRequest() {}

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public List<LearnerData> getLearners() { return learners; }
    public void setLearners(List<LearnerData> learners) { this.learners = learners; }
}
