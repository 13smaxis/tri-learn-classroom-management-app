package com.schoolapp.repository;

import com.schoolapp.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository

/**
 * Repository interface for managing attendance records in the database.
 * Runs SQL queries to perform CRUD operations on attendance records and return results to the service layer.
 * Provides methods to find attendance records by learner ID, class ID, and date.
 */
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, String> 
{
    Optional<AttendanceRecord> findByLearnerIdAndAttendanceDate(String learnerId, LocalDate date);

    List<AttendanceRecord> findBySchoolClassIdAndAttendanceDate(String classId, LocalDate date);

    List<AttendanceRecord> findBySchoolClassIdAndAttendanceDateBetween(String classId, LocalDate startDate, LocalDate endDate);

    List<AttendanceRecord> findByLearnerId(String learnerId);
}
