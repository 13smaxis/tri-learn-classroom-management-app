package com.schoolapp.dto;

import java.util.Map;

public class SaveAttendanceRequest {
    private String classId;
    private String date;
    private Map<String, String> attendance; // learnerId -> status

    public SaveAttendanceRequest() {}

    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public Map<String, String> getAttendance() { return attendance; }
    public void setAttendance(Map<String, String> attendance) { this.attendance = attendance; }
}
