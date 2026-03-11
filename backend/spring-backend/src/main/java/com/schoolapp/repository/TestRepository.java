package com.schoolapp.repository;

import com.schoolapp.model.Test;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestRepository extends JpaRepository<Test, String> {
    List<Test> findBySchoolClassIdOrderByCreatedAtDesc(String classId);
    long countByTeacherId(String teacherId);
    long countBySchoolClassId(String classId);
}

