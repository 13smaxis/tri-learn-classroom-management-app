package com.schoolapp.repository;

import com.schoolapp.model.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, String> {

    List<AssignmentSubmission> findByAssignmentId(String assignmentId);

    Optional<AssignmentSubmission> findByAssignmentIdAndLearnerId(String assignmentId, String learnerId);
}
