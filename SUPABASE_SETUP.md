# Supabase Setup Guide

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose a name and database password
4. Wait for the project to initialize

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

Find these values in: **Supabase Dashboard → Settings → API**

> **Note:** Use the **publishable** (anon) key, NOT the service role key.
> The publishable key is safe to expose in browser code — Row Level Security
> enforces all access permissions.

### 3. Run the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `src/lib/supabase.sql`
3. Paste and run it

This creates:
- All required tables (profiles, skills, projects, achievements, journey)
- Row Level Security policies
- Storage buckets

### 4. Create Your Admin User

1. Go to **Authentication → Users**
2. Click "Add user"
3. Enter your email and password
4. Confirm the email (or disable email confirmation for testing)

### 5. Create Storage Buckets

If the SQL didn't create them automatically:

1. Go to **Storage**
2. Create these buckets:
   - `profile-photos` (public)
   - `project-images` (public)
   - `certifications` (public)
   - `resumes` (private)

### 6. Start the Dev Server

```bash
npm run dev
```

### 7. Access the Admin

1. Go to `http://localhost:5173/admin/login`
2. Sign in with your Supabase credentials
3. Start editing your portfolio!

## Security

- **Row Level Security (RLS)** is enabled on all tables
- Public users can only **read** published data
- Only authenticated users can **write** data
- The anon key is safe to expose (RLS enforces permissions)
- **Never** use the service role key in frontend code

## Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | Single-row profile data |
| `skills` | Technology skills |
| `projects` | Portfolio projects |
| `achievements` | Awards and certifications |
| `journey` | Developer timeline |
