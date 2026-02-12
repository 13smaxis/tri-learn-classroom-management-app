package com.schoolapp.repository;

import com.schoolapp.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, String> {
    List<Enrollment> findBySchoolClassId(String classId);
    List<Enrollment> findByUserId(String userId);
    boolean existsByUserIdAndSchoolClassId(String userId, String classId);
}
