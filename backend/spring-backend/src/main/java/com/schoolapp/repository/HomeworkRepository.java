package com.schoolapp.repository;

import com.schoolapp.model.Homework;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HomeworkRepository extends JpaRepository<Homework, String> {
    List<Homework> findBySchoolClassIdOrderByCreatedAtDesc(String classId);
    long countByTeacherId(String teacherId);
}
