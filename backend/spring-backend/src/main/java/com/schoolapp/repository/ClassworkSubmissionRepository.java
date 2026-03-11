package com.schoolapp.repository;

import com.schoolapp.model.ClassworkSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClassworkSubmissionRepository extends JpaRepository<ClassworkSubmission, String> {

    List<ClassworkSubmission> findByClassworkId(String classworkId);

    Optional<ClassworkSubmission> findByClassworkIdAndLearnerId(String classworkId, String learnerId);

    long countByClassworkIdAndSubmittedTrue(String classworkId);

    long countByClassworkId(String classworkId);

    @Query("SELECT cs FROM ClassworkSubmission cs WHERE cs.classwork.id = :classworkId AND cs.mark IS NOT NULL AND cs.mark >= :passmark")
    List<ClassworkSubmission> findPassingSubmissions(@Param("classworkId") String classworkId, @Param("passmark") double passmark);

    @Query("SELECT cs FROM ClassworkSubmission cs WHERE cs.classwork.id = :classworkId AND cs.mark IS NOT NULL ORDER BY cs.mark DESC")
    List<ClassworkSubmission> findByClassworkIdOrderByMarkDesc(@Param("classworkId") String classworkId);
}
