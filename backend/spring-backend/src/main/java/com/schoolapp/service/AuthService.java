package com.schoolapp.service;

import com.schoolapp.dto.LoginRequest;
import com.schoolapp.dto.RegisterRequest;
import com.schoolapp.dto.UserResponse;
import com.schoolapp.model.AppUser;
import com.schoolapp.model.Role;
import com.schoolapp.repository.UserRepository;
import com.schoolapp.security.JwtUtil;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public UserResponse register(RegisterRequest req) {
        // Check phone uniqueness (phone is the primary identifier)
        if (req.getPhone() != null && userRepository.existsByPhone(req.getPhone())) {
            throw new RuntimeException("Phone number already registered");
        }

        // Check email uniqueness only if provided
        if (req.getEmail() != null && !req.getEmail().isBlank() && userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        Role role = Role.valueOf(req.getRole().toUpperCase());

        AppUser user = new AppUser();
        user.setFullName(req.getFullName());
        // Store null instead of blank so the unique constraint allows multiple no-email users
        String email = (req.getEmail() != null && !req.getEmail().isBlank()) ? req.getEmail() : null;
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(role);
        user.setTitle(req.getTitle());
        user.setPhone(req.getPhone());
        user.setTeacherGrade(req.getTeacherGrade());

        // Generate invite code for teachers
        if (role == Role.TEACHER) {
            String district = "02";
            int suffix = (int) (1000 + Math.random() * 9000);
            user.setTeacherInviteCode("TRI" + district + suffix);
        }

        AppUser saved = userRepository.save(user);
        String token = jwtUtil.generateToken(saved.getId(), saved.getPhone(), saved.getRole().name());

        return toResponse(saved, token);
    }

    public UserResponse login(LoginRequest req) {
        AppUser user = userRepository.findByPhone(req.getPhone())
                .orElseThrow(() -> new RuntimeException("Invalid phone number or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid phone number or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getPhone(), user.getRole().name());
        return toResponse(user, token);
    }

    public UserResponse getCurrentUser(@NonNull String userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toResponse(user, null);
    }

    public List<AppUser> getAllUsers() {
        return userRepository.findAll();
    }

    private UserResponse toResponse(AppUser user, String token) {
        UserResponse res = new UserResponse();
        res.setUserId(user.getId());
        res.setEmail(user.getEmail());
        res.setFullName(user.getFullName());
        res.setTitle(user.getTitle());
        res.setRole(user.getRole().name().toLowerCase());
        res.setAvatarUrl(user.getAvatarUrl());
        res.setTeacherInviteCode(user.getTeacherInviteCode());
        res.setTeacherGrade(user.getTeacherGrade());
        res.setToken(token);
        res.setCreatedAt(user.getCreatedAt());
        return res;
    }
}
