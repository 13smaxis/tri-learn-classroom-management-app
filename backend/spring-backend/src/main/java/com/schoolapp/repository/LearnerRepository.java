package com.schoolapp.repository;

import com.schoolapp.model.Learner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearnerRepository extends JpaRepository<Learner, String> {

    List<Learner> findBySchoolClassId(String classId);

    Optional<Learner> findByLearnerNumberAndSchoolClassId(String learnerNumber, String classId);

    void deleteBySchoolClassId(String classId);
}
