package com.schoolapp.repository;

import com.schoolapp.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, String> {

    List<AttendanceRecord> findBySchoolClassIdAndAttendanceDate(String classId, LocalDate date);

    List<AttendanceRecord> findBySchoolClassIdAndAttendanceDateBetween(String classId, LocalDate startDate, LocalDate endDate);

    Optional<AttendanceRecord> findByLearnerIdAndAttendanceDate(String learnerId, LocalDate date);

    List<AttendanceRecord> findByLearnerId(String learnerId);
}
