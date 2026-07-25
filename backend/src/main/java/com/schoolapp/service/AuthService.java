package com.schoolapp.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.schoolapp.dto.AuthDTO;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.*;

/**
 * Authentication service handling Supabase auth operations
 */
@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final Gson gson = new Gson();
    private static final OkHttpClient client = new OkHttpClient();

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String anonKey;

    @Value("${supabase.jwt-secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    /**
     * Login with email and password via Supabase
     */
    public AuthDTO.AuthResponse login(String email, String password) throws Exception {
        String url = String.format("%s/auth/v1/token?grant_type=password", supabaseUrl);
        
        JsonObject body = new JsonObject();
        body.addProperty("email", email);
        body.addProperty("password", password);

        RequestBody requestBody = RequestBody.create(
                body.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Content-Type", "application/json")
                .post(requestBody)
                .build();

        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "{}";
            JsonObject result = gson.fromJson(responseBody, JsonObject.class);

            if (!response.isSuccessful()) {
                logger.warn("Supabase login failed: {}", result);
                throw new Exception("Authentication failed");
            }

            String userId = result.get("user").getAsJsonObject().get("id").getAsString();
            String accessToken = result.get("access_token").getAsString();

            // Get user profile to fetch school_id and role
            AuthDTO.UserInfo userInfo = getUserInfo(userId);
            if (userInfo == null) {
                throw new Exception("User profile not found");
            }

            // Create custom JWT with school_id and role
            String customToken = createCustomJwt(userId, userInfo);

            logger.info("Login successful for user: {}", userId);
            return new AuthDTO.AuthResponse(customToken, userInfo);
        }
    }

    /**
     * Sign up new user and create profile
     */
    public AuthDTO.AuthResponse signup(AuthDTO.RegisterRequest request) throws Exception {
        // Validate role
        if (!isValidRole(request.role)) {
            throw new IllegalArgumentException("Invalid role. Must be 'teacher', 'parent', or 'learner'");
        }

        // Create user in Supabase Auth
        String userId = createSupabaseUser(request.email, request.password);
        logger.info("Supabase user created: {}", userId);

        // Create profile in profiles table
        createUserProfile(userId, request, request.schoolId);
        logger.info("User profile created for: {}", userId);

        // Get user info
        AuthDTO.UserInfo userInfo = getUserInfo(userId);
        if (userInfo == null) {
            throw new Exception("Failed to retrieve user profile after signup");
        }

        // Create custom JWT
        String token = createCustomJwt(userId, userInfo);

        logger.info("Signup successful for user: {} with role: {}", userId, request.role);
        return new AuthDTO.AuthResponse(token, userInfo);
    }

    /**
     * Request password reset
     */
    public void requestPasswordReset(String email) throws Exception {
        String url = String.format("%s/auth/v1/recover", supabaseUrl);
        
        JsonObject body = new JsonObject();
        body.addProperty("email", email);

        RequestBody requestBody = RequestBody.create(
                body.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Content-Type", "application/json")
                .post(requestBody)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                logger.warn("Password reset request failed for email: {}", email);
            } else {
                logger.info("Password reset email sent to: {}", email);
            }
        }
    }

    /**
     * Create user in Supabase Auth
     */
    private String createSupabaseUser(String email, String password) throws Exception {
        String url = String.format("%s/auth/v1/signup", supabaseUrl);
        
        JsonObject body = new JsonObject();
        body.addProperty("email", email);
        body.addProperty("password", password);

        RequestBody requestBody = RequestBody.create(
                body.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Content-Type", "application/json")
                .post(requestBody)
                .build();

        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "{}";
            JsonObject result = gson.fromJson(responseBody, JsonObject.class);

            if (!response.isSuccessful()) {
                logger.error("Supabase user creation failed: {}", result);
                throw new Exception("User creation failed: " + result.get("error_description"));
            }

            return result.get("user").getAsJsonObject().get("id").getAsString();
        }
    }

    /**
     * Create user profile in profiles table
     */
    private void createUserProfile(String userId, AuthDTO.RegisterRequest request, String schoolId) throws Exception {
        String url = String.format("%s/rest/v1/profiles", supabaseUrl);
        
        JsonObject profile = new JsonObject();
        profile.addProperty("id", userId);
        profile.addProperty("email", request.email);
        profile.addProperty("first_name", request.firstName);
        profile.addProperty("last_name", request.lastName);
        profile.addProperty("role", request.role);
        if (schoolId != null) {
            profile.addProperty("school_id", schoolId);
        }

        RequestBody requestBody = RequestBody.create(
                profile.toString(),
                MediaType.parse("application/json")
        );

        Request httpRequest = new Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Content-Type", "application/json")
                .post(requestBody)
                .build();

        try (Response response = client.newCall(httpRequest).execute()) {
            if (!response.isSuccessful()) {
                String error = response.body() != null ? response.body().string() : "Unknown error";
                logger.error("Profile creation failed: {}", error);
                throw new Exception("Failed to create user profile");
            }
        }
    }

    /**
     * Get user info from profiles table
     */
    private AuthDTO.UserInfo getUserInfo(String userId) throws Exception {
        String url = String.format("%s/rest/v1/profiles?id=eq.%s", supabaseUrl, userId);
        
        Request request = new Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer " + anonKey)
                .build();

        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "[]";
            JsonObject[] profiles = gson.fromJson(responseBody, JsonObject[].class);

            if (profiles.length == 0) {
                logger.warn("No profile found for user: {}", userId);
                return null;
            }

            JsonObject profile = profiles[0];
            return new AuthDTO.UserInfo(
                profile.get("id").getAsString(),
                profile.get("email").getAsString(),
                profile.get("first_name").getAsString(),
                profile.get("last_name").getAsString(),
                profile.get("role").getAsString(),
                profile.has("school_id") && !profile.get("school_id").isJsonNull() ? 
                    profile.get("school_id").getAsString() : null
            );
        }
    }

    /**
     * Create custom JWT with school_id and role claims
     */
    private String createCustomJwt(String userId, AuthDTO.UserInfo userInfo) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("school_id", userInfo.schoolId);
        claims.put("role", userInfo.role);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(SignatureAlgorithm.HS256, jwtSecret.getBytes())
                .compact();
    }

    /**
     * Validate role
     */
    private boolean isValidRole(String role) {
        return role != null && (role.equals("teacher") || role.equals("parent") || role.equals("learner"));
    }
}
