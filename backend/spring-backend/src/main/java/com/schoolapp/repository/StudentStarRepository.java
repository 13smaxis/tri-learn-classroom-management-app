package com.schoolapp.repository;

import com.schoolapp.model.StudentStar;
import com.schoolapp.model.StarCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudentStarRepository extends JpaRepository<StudentStar, String> {
    List<StudentStar> findByLearnerId(String learnerId);
    List<StudentStar> findByLearnerIdAndCategory(String learnerId, StarCategory category);
    List<StudentStar> findByTeacherIdAndSchoolClassId(String teacherId, String schoolClassId);
    int countByLearnerIdAndCategory(String learnerId, StarCategory category);
}
