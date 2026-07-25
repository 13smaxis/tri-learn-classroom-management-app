package com.schoolapp.repository;

import com.schoolapp.model.HomeworkSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, String> {

    List<HomeworkSubmission> findByHomeworkId(String homeworkId);

    Optional<HomeworkSubmission> findByHomeworkIdAndLearnerId(String homeworkId, String learnerId);

    long countByHomeworkIdAndSubmittedTrue(String homeworkId);

    long countByHomeworkId(String homeworkId);

    @Query("SELECT hs FROM HomeworkSubmission hs WHERE hs.homework.id = :homeworkId AND hs.mark IS NOT NULL AND hs.mark >= :passmark")
    List<HomeworkSubmission> findPassingSubmissions(@Param("homeworkId") String homeworkId, @Param("passmark") double passmark);

    @Query("SELECT hs FROM HomeworkSubmission hs WHERE hs.homework.id = :homeworkId AND hs.mark IS NOT NULL ORDER BY hs.mark DESC")
    List<HomeworkSubmission> findByHomeworkIdOrderByMarkDesc(@Param("homeworkId") String homeworkId);
}
