package com.schoolapp.repository;

import com.schoolapp.model.Classwork;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassworkRepository extends JpaRepository<Classwork, String> {
    List<Classwork> findBySchoolClassIdOrderByCreatedAtDesc(String classId);
    long countByTeacherId(String teacherId);
    long countBySchoolClassId(String classId);
}
