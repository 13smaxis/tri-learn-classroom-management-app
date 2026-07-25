package com.schoolapp.repository;

import com.schoolapp.model.TestSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TestSubmissionRepository extends JpaRepository<TestSubmission, String> {

    List<TestSubmission> findByTestId(String testId);

    Optional<TestSubmission> findByTestIdAndLearnerId(String testId, String learnerId);

    long countByTestIdAndSubmittedTrue(String testId);

    long countByTestId(String testId);

    @Query("SELECT cs FROM TestSubmission cs WHERE cs.test.id = :testId AND cs.mark IS NOT NULL AND cs.mark >= :passmark")
    List<TestSubmission> findPassingSubmissions(@Param("testId") String testId, @Param("passmark") double passmark);

    @Query("SELECT cs FROM TestSubmission cs WHERE cs.test.id = :testId AND cs.mark IS NOT NULL ORDER BY cs.mark DESC")
    List<TestSubmission> findByTestIdOrderByMarkDesc(@Param("testId") String testId);
}

