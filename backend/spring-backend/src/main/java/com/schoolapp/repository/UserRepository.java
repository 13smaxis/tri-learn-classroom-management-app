package com.schoolapp.repository;

import com.schoolapp.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Repository interface for AppUser entity, providing methods to perform CRUD operations and custom queries.
 * Defines custom methods for finding users by email and phone, as well as checking for their existence.
 */
public interface UserRepository extends JpaRepository<AppUser, String> 
{
    Optional<AppUser> findByEmail(String email);                                                                //- Finds a user by their email address, returning an Optional that may be empty if no user is found.
    Optional<AppUser> findByPhone(String phone);                                                                //- Finds a user by their phone number, returning an Optional that may be empty if no user is found.
    boolean existsByEmail(String email);                                                                        //- Checks if a user with the given email address already exists in the database, returning true if it does and false otherwise.
    boolean existsByPhone(String phone);                                                                        //- Checks if a user with the given phone number already exists in the database, returning true if it does and false otherwise.
}
