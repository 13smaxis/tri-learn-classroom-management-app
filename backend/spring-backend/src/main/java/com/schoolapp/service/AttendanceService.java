package com.schoolapp.service;

import com.schoolapp.dto.AttendanceRecordDTO;
import com.schoolapp.dto.LearnerDTO;
import com.schoolapp.dto.SaveAttendanceRequest;
import com.schoolapp.dto.UploadLearnersRequest;
import com.schoolapp.model.*;
import com.schoolapp.repository.AttendanceRepository;
import com.schoolapp.repository.ClassRepository;
import com.schoolapp.repository.LearnerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service

/**
 * Service for managing attendance records and learners. 
 * Handles uploading learners for a class, saving attendance records, and retrieving attendance data.
 *      Decides what should happen
        Coordinates repositories
        Applies business rules
        Converts entities to DTOs
        Controls transactions
 *
 */
public class AttendanceService 
{
    private final LearnerRepository learnerRepository;
    private final AttendanceRepository attendanceRepository;
    private final ClassRepository classRepository;

    public AttendanceService(
                                LearnerRepository learnerRepository,
                                AttendanceRepository attendanceRepository,
                                ClassRepository classRepository
                            )
    {
        this.learnerRepository = learnerRepository;
        this.attendanceRepository = attendanceRepository;
        this.classRepository = classRepository;
    }

    /**
     * Upload/replace learners for a class
     */
    @Transactional
    public List<LearnerDTO> uploadLearners(UploadLearnersRequest request) 
    {
        SchoolClass schoolClass = classRepository.findById(Objects.requireNonNull(request.getClassId()))
            .orElseThrow(() -> new RuntimeException("Class not found"));

        learnerRepository.deleteBySchoolClassId(request.getClassId());                                          //-Delete existing learners for this class

        List<Learner> learners = new ArrayList<>();                                                             //-Create new learners
        Set<String> allocatedNumbers = new HashSet<>();
        for (UploadLearnersRequest.LearnerData data : request.getLearners())                                    //-Iterate over the provided learner data and create Learner entities
        {
            String learnerNumber = selectLearnerNumber(data.getLearnerNumber(), schoolClass.getGrade(), allocatedNumbers);
            Learner learner = new Learner(learnerNumber, data.getFullName(), schoolClass);
            learners.add(learner);
        }

        learners = learnerRepository.saveAll(learners);                                                         //-Save new learners to the database

        return learners.stream()
            .map(l -> new LearnerDTO(l.getId(), l.getLearnerNumber(), l.getFullName()))
            .collect(Collectors.toList());
    }

    private String generateGradeBasedSixDigitLearnerNumber(String classGrade, Set<String> allocatedNumbers) {
        String gradePrefix = resolveGradePrefix(classGrade);
        int maxAttempts = 2000;
        for (int i = 0; i < maxAttempts; i++) {
            String uniqueSuffix = String.format("%04d", ThreadLocalRandom.current().nextInt(0, 10000));
            String candidate = gradePrefix + uniqueSuffix;
            if (allocatedNumbers.contains(candidate)) {
                continue;
            }
            if (!learnerRepository.existsByLearnerNumber(candidate)) {
                allocatedNumbers.add(candidate);
                return candidate;
            }
        }
        throw new RuntimeException("Could not generate a unique 6-digit learner number. Please try again.");
    }

    private String selectLearnerNumber(String requestedLearnerNumber, String classGrade, Set<String> allocatedNumbers) {
        if (isSixDigitNumber(requestedLearnerNumber)
                && !allocatedNumbers.contains(requestedLearnerNumber)
                && !learnerRepository.existsByLearnerNumber(requestedLearnerNumber)) {
            allocatedNumbers.add(requestedLearnerNumber);
            return requestedLearnerNumber;
        }
        return generateGradeBasedSixDigitLearnerNumber(classGrade, allocatedNumbers);
    }

    private boolean isSixDigitNumber(String value) {
        return value != null && value.matches("\\d{6}");
    }

    private String resolveGradePrefix(String classGrade) {
        if (classGrade == null || classGrade.trim().isEmpty()) {
            return "00";
        }

        Matcher matcher = Pattern.compile("(\\d{1,2})").matcher(classGrade);
        if (matcher.find()) {
            int gradeNumber = Integer.parseInt(matcher.group(1));
            if (gradeNumber < 0) {
                gradeNumber = 0;
            }
            if (gradeNumber > 99) {
                gradeNumber = 99;
            }
            return String.format("%02d", gradeNumber);
        }

        return "00";
    }

    /**
     * Get all learners for a class
     */
    public List<LearnerDTO> getLearnersForClass(String classId) 
    {
        List<Learner> learners = learnerRepository.findBySchoolClassId(classId);
        return learners.stream()
            .map(l -> new LearnerDTO(l.getId(), l.getLearnerNumber(), l.getFullName()))
            .collect(Collectors.toList());
    }

    /**
     * Save attendance records for a specific date
     */
    @Transactional
    public void saveAttendance(SaveAttendanceRequest request) {
        SchoolClass schoolClass = classRepository.findById(Objects.requireNonNull(request.getClassId()))
            .orElseThrow(() -> new RuntimeException("Class not found"));

        LocalDate date = LocalDate.parse(request.getDate());

        for (Map.Entry<String, String> entry : request.getAttendance().entrySet())                              //-Iterate over the attendance data, where the key is the learner ID and the value is the attendance status (e.g., "present", "absent")
        {
            String learnerId = entry.getKey();
            String statusStr = entry.getValue();

            Learner learner = learnerRepository.findById(Objects.requireNonNull(learnerId))
                .orElseThrow(() -> new RuntimeException("Learner not found: " + learnerId));

            AttendanceStatus status = parseAttendanceStatus(statusStr);

            // Check if record already exists
            AttendanceRecord record = attendanceRepository
                .findByLearnerIdAndAttendanceDate(learnerId, date)
                .orElse(new AttendanceRecord(learner, schoolClass, date, status));

            record.setStatus(status);
            attendanceRepository.save(record);
        }
    }

    private AttendanceStatus parseAttendanceStatus(String rawStatus) {
        if (rawStatus == null) {
            throw new RuntimeException("Attendance status is required");
        }

        String normalized = rawStatus.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        switch (normalized) {
            case "PRESENT":
                return AttendanceStatus.PRESENT;
            case "ABSENT":
                return AttendanceStatus.ABSENT;
            case "LATE":
                return AttendanceStatus.LATE;
            case "EXCUSED":
                return AttendanceStatus.EXCUSED;
            case "BUNKING":
                return AttendanceStatus.BUNKING;
            case "SICK":
                return AttendanceStatus.SICK;
            default:
                throw new RuntimeException("Unknown attendance status: " + rawStatus);
        }
    }

    /**
     * Get attendance records for a class on a specific date
     */
    public Map<String, String> getAttendanceForDate(String classId, String dateStr) 
    {
        LocalDate date = LocalDate.parse(dateStr);
        List<AttendanceRecord> records = attendanceRepository
            .findBySchoolClassIdAndAttendanceDate(classId, date);

        Map<String, String> attendance = new HashMap<>();
        for (AttendanceRecord record : records) {
            attendance.put(record.getLearner().getId(), record.getStatus().name().toLowerCase());
        }
        return attendance;
    }

    /**
     * Get all attendance records for a class within a date range
     */
    public List<AttendanceRecordDTO> getAttendanceForDateRange(String classId, String startDateStr, String endDateStr) 
    {
        LocalDate startDate = LocalDate.parse(startDateStr);
        LocalDate endDate = LocalDate.parse(endDateStr);

        List<AttendanceRecord> records = attendanceRepository
            .findBySchoolClassIdAndAttendanceDateBetween(classId, startDate, endDate);

        return records.stream()
            .map(r -> new AttendanceRecordDTO(
                r.getId(),
                r.getLearner().getId(),
                r.getLearner().getLearnerNumber(),
                r.getLearner().getFullName(),
                r.getAttendanceDate().toString(),
                r.getStatus().name().toLowerCase()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Get all attendance records for a specific learner
     */
    public List<AttendanceRecordDTO> getAttendanceForLearner(String learnerId) 
    {
        List<AttendanceRecord> records = attendanceRepository.findByLearnerId(learnerId);

        return records.stream()
            .map(r -> new AttendanceRecordDTO(
                r.getId(),
                r.getLearner().getId(),
                r.getLearner().getLearnerNumber(),
                r.getLearner().getFullName(),
                r.getAttendanceDate().toString(),
                r.getStatus().name().toLowerCase()
            ))
            .collect(Collectors.toList());
    }
}
