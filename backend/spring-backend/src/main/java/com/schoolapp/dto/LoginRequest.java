package com.schoolapp.dto;

/**
 * Data Transfer Object for login requests, containing the user's phone number and password.
 * This class is used to encapsulate the login credentials sent from the client to the server during authentication.
 */
public class LoginRequest 
{
    private String phone;
    private String password;

    public LoginRequest() {}                                                                                    //- Default constructor for deserialization

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
