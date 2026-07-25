package com.schoolapp.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.UUID;

/**
 * Supabase REST API client for direct database operations
 * Uses service role key for backend operations (bypasses RLS)
 */
@Service
public class SupabaseService {
    private static final Logger logger = LoggerFactory.getLogger(SupabaseService.class);
    private static final Gson gson = new Gson();

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    private static final OkHttpClient client = new OkHttpClient();

    /**
     * Execute a GET request to Supabase
     */
    public JsonArray get(String table, String query) throws IOException {
        String url = String.format("%s/rest/v1/%s?%s", supabaseUrl, table, query);
        Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + serviceRoleKey)
                .addHeader("apikey", serviceRoleKey)
                .addHeader("Content-Type", "application/json")
                .get()
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                logger.error("Supabase GET failed: {} {}", response.code(), response.body());
                throw new IOException("Failed to fetch from " + table);
            }
            String body = response.body() != null ? response.body().string() : "[]";
            return gson.fromJson(body, JsonArray.class);
        }
    }

    /**
     * Execute a POST request to Supabase (insert)
     */
    public JsonObject post(String table, JsonObject data) throws IOException {
        String url = String.format("%s/rest/v1/%s", supabaseUrl, table);
        RequestBody body = RequestBody.create(
                data.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + serviceRoleKey)
                .addHeader("apikey", serviceRoleKey)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                logger.error("Supabase POST failed: {} {}", response.code(), response.body());
                throw new IOException("Failed to insert into " + table);
            }
            String responseBody = response.body() != null ? response.body().string() : "{}";
            return gson.fromJson(responseBody, JsonObject.class);
        }
    }

    /**
     * Execute a PUT request to Supabase (update)
     */
    public JsonObject put(String table, String id, JsonObject data) throws IOException {
        String url = String.format("%s/rest/v1/%s?id=eq.%s", supabaseUrl, table, id);
        RequestBody body = RequestBody.create(
                data.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + serviceRoleKey)
                .addHeader("apikey", serviceRoleKey)
                .addHeader("Content-Type", "application/json")
                .put(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                logger.error("Supabase PUT failed: {} {}", response.code(), response.body());
                throw new IOException("Failed to update " + table);
            }
            String responseBody = response.body() != null ? response.body().string() : "{}";
            return gson.fromJson(responseBody, JsonObject.class);
        }
    }

    /**
     * Execute a DELETE request to Supabase
     */
    public void delete(String table, String id) throws IOException {
        String url = String.format("%s/rest/v1/%s?id=eq.%s", supabaseUrl, table, id);
        Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + serviceRoleKey)
                .addHeader("apikey", serviceRoleKey)
                .delete()
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                logger.error("Supabase DELETE failed: {} {}", response.code(), response.body());
                throw new IOException("Failed to delete from " + table);
            }
        }
    }

    /**
     * Get records with tenant filtering (school_id)
     */
    public JsonArray getBySchool(String table, UUID schoolId) throws IOException {
        String query = "school_id=eq." + schoolId;
        return get(table, query);
    }

    /**
     * Get a single record by ID with tenant check
     */
    public JsonObject getById(String table, UUID id, UUID schoolId) throws IOException {
        String query = String.format("id=eq.%s&school_id=eq.%s", id, schoolId);
        JsonArray results = get(table, query);
        if (results.size() > 0) {
            return results.get(0).getAsJsonObject();
        }
        return null;
    }
}
