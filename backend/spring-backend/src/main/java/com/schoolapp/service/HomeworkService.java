package com.schoolapp.service;

import com.schoolapp.dto.CreateHomeworkRequest;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Homework;
import com.schoolapp.model.SchoolClass;
import com.schoolapp.repository.ClassRepository;
import com.schoolapp.repository.HomeworkRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HomeworkService {

    private final HomeworkRepository homeworkRepository;
    private final ClassRepository classRepository;

    public HomeworkService(HomeworkRepository homeworkRepository, ClassRepository classRepository) {
        this.homeworkRepository = homeworkRepository;
        this.classRepository = classRepository;
    }

    public Homework createHomework(AppUser teacher, CreateHomeworkRequest request) {
        if (request.getClassId() == null || request.getClassId().isBlank()) {
            throw new RuntimeException("classId is required");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new RuntimeException("title is required");
        }
        if (request.getDueDate() == null || request.getDueDate().isBlank()) {
            throw new RuntimeException("dueDate is required");
        }

        SchoolClass schoolClass = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (schoolClass.getTeacher() == null || !schoolClass.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You are not allowed to create homework for this class");
        }

        LocalDateTime dueDate;
        try {
            dueDate = LocalDateTime.parse(request.getDueDate());
        } catch (DateTimeParseException ex) {
            throw new RuntimeException("Invalid dueDate format. Expected ISO date-time");
        }

        Homework homework = new Homework();
        homework.setSchoolClass(schoolClass);
        homework.setTeacher(teacher);
        homework.setTitle(request.getTitle());
        homework.setDescription(request.getDescription());
        homework.setDueDate(dueDate);
        homework.setAttachmentUrls(serializeUrls(request.getAttachmentUrls()));

        return homeworkRepository.save(homework);
    }

    public List<Homework> getHomeworkForClass(String classId) {
        return homeworkRepository.findBySchoolClassIdOrderByCreatedAtDesc(classId);
    }

    public long getHomeworkCountForTeacher(String teacherId) {
        return homeworkRepository.countByTeacherId(teacherId);
    }

    public void deleteHomework(String homeworkId, AppUser teacher) {
        Homework homework = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new RuntimeException("Homework not found"));
        if (homework.getTeacher() == null || !homework.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You are not allowed to delete this homework");
        }
        homeworkRepository.delete(homework);
    }

    public List<String> deserializeUrls(String rawUrls) {
        if (rawUrls == null || rawUrls.isBlank()) {
            return List.of();
        }
        return Arrays.stream(rawUrls.split("\\n"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
            .collect(Collectors.toList());
    }

    private String serializeUrls(List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            return null;
        }
        return String.join("\n", urls);
    }
}
