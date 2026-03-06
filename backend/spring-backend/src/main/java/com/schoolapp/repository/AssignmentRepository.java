package com.schoolapp.repository;

import com.schoolapp.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, String> {
    List<Assignment> findBySchoolClassIdOrderByCreatedAtDesc(String classId);
    long countByTeacherId(String teacherId);
    long countBySchoolClassId(String classId);
}
