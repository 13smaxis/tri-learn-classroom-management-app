import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://rklwwzrxsevzdvzjgaxb.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjhkZDdiZGU3LTY3YjItNDJiOS04NjVjLTI1ZjdkNDc0NDlmMCJ9.eyJwcm9qZWN0SWQiOiJya2x3d3pyeHNldnpkdnpqZ2F4YiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY5NzAwMzc3LCJleHAiOjIwODUwNjAzNzcsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.XiFFdpt3QqwqK3iFHa_ReHzkt2_lOORfbtpL_2aHu9g';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };