package com.schoolapp.dto;

import com.schoolapp.model.StarCategory;

public class AwardStarRequest {
    private String learnerId;
    private String classId;
    private StarCategory category;
    private Integer starCount = 1;
    private String note;

    public AwardStarRequest() {}

    public String getLearnerId() { return learnerId; }
    public void setLearnerId(String learnerId) { this.learnerId = learnerId; }

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public StarCategory getCategory() { return category; }
    public void setCategory(StarCategory category) { this.category = category; }

    public Integer getStarCount() { return starCount; }
    public void setStarCount(Integer starCount) { this.starCount = starCount; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
