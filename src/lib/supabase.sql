-- =====================================================================
--  HARI HARA SUDHAN — PORTFOLIO SCHEMA
--  Run ONCE: Supabase Dashboard → SQL Editor → New query → Run
--  (Idempotent: safe to re-run.)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
--  1. ADMIN ALLOWLIST — the ONLY accounts allowed to write portfolio data
-- =====================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  user_id    UUID PRIMARY KEY,                 -- = auth.users.id
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SECURITY DEFINER so RLS can check admin rights without a policy loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- =====================================================================
--  2. TABLES
-- =====================================================================

-- 2.1 profiles (single row, id = 'single')
CREATE TABLE IF NOT EXISTS profiles (
  id                TEXT PRIMARY KEY DEFAULT 'single',
  full_name         TEXT NOT NULL DEFAULT 'Hari Hara Sudhan D',
  role              TEXT NOT NULL DEFAULT 'Java Full Stack Developer',
  status            TEXT NOT NULL DEFAULT 'Computer Science Engineering Student',
  college           TEXT NOT NULL DEFAULT 'Panimalar Engineering College, Chennai',
  graduation        TEXT NOT NULL DEFAULT '2028',
  badge             TEXT NOT NULL DEFAULT 'Available for opportunities',
  hero_lead         TEXT NOT NULL DEFAULT '',
  intro             TEXT NOT NULL DEFAULT '',
  goal              TEXT NOT NULL DEFAULT '',
  goal_label        TEXT NOT NULL DEFAULT 'Career goal',
  github_url        TEXT NOT NULL DEFAULT 'https://github.com/hari-0824',
  linkedin_url      TEXT NOT NULL DEFAULT 'https://www.linkedin.com/in/hari-hara-sudhan-d/',
  email             TEXT NOT NULL DEFAULT '',
  profile_photo_url TEXT,
  resume_url        TEXT,
  published         BOOLEAN NOT NULL DEFAULT true,
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO profiles (id) VALUES ('single') ON CONFLICT (id) DO NOTHING;

-- 2.2 about (paragraphs + milestones for the About section)
CREATE TABLE IF NOT EXISTS about (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        TEXT NOT NULL DEFAULT 'paragraph'
              CHECK (kind IN ('paragraph','milestone')),
  heading     TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL DEFAULT '',
  year        TEXT NOT NULL DEFAULT '',
  published   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 skills
CREATE TABLE IF NOT EXISTS skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL DEFAULT 'Programming',
  sort_order  INT NOT NULL DEFAULT 0,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'code',
  "desc"      TEXT NOT NULL DEFAULT '',          -- quoted: DESC is a reserved word
  level       INT NOT NULL DEFAULT 50 CHECK (level BETWEEN 0 AND 100),
  published   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 projects
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  kicker        TEXT NOT NULL DEFAULT '',
  summary       TEXT NOT NULL DEFAULT '',
  image_url     TEXT,
  image_alt     TEXT NOT NULL DEFAULT '',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  tech          TEXT[] NOT NULL DEFAULT '{}',
  github_url    TEXT NOT NULL DEFAULT '',
  live_url      TEXT NOT NULL DEFAULT '',
  problem       TEXT NOT NULL DEFAULT '',
  solution      TEXT NOT NULL DEFAULT '',
  features      TEXT[] NOT NULL DEFAULT '{}',
  stack         TEXT[] NOT NULL DEFAULT '{}',
  contribution  TEXT NOT NULL DEFAULT '',
  future        TEXT[] NOT NULL DEFAULT '{}',
  published     BOOLEAN NOT NULL DEFAULT false,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 achievements (hackathons / certifications / workshops / awards)
CREATE TABLE IF NOT EXISTS achievements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          TEXT NOT NULL DEFAULT 'achievement'
                CHECK (kind IN ('hackathon','certification','workshop','award','achievement')),
  title         TEXT NOT NULL,
  organisation  TEXT NOT NULL DEFAULT '',
  date          TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  image_url     TEXT,
  published     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 journey
CREATE TABLE IF NOT EXISTS journey (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year        TEXT NOT NULL,
  title       TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  state       TEXT NOT NULL DEFAULT 'done' CHECK (state IN ('done','now','next')),
  published   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 resume (active resume document)
CREATE TABLE IF NOT EXISTS resume (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL DEFAULT 'Primary Resume',
  file_url    TEXT NOT NULL,
  file_size   BIGINT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  published   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','about','skills','projects','achievements','journey','resume'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%I ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_touch_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();', t, t);
  END LOOP;
END $$;

-- =====================================================================
--  3. ROW LEVEL SECURITY
--     anon/public → READ published rows only
--     is_admin()  → INSERT / UPDATE / DELETE
--     any other authenticated user → READ only, NO writes
-- =====================================================================
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE about        ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills       ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey      ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume       ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users  ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','about','skills','projects','achievements','journey','resume'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_public_read ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_read   ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_ins    ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_upd    ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_del    ON public.%I;', t, t);

    EXECUTE format('CREATE POLICY %I_public_read ON public.%I FOR SELECT USING (published = true OR public.is_admin());', t, t);
    EXECUTE format('CREATE POLICY %I_admin_read   ON public.%I FOR SELECT TO authenticated USING (public.is_admin());', t, t);
    EXECUTE format('CREATE POLICY %I_admin_ins    ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin());', t, t);
    EXECUTE format('CREATE POLICY %I_admin_upd    ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());', t, t);
    EXECUTE format('CREATE POLICY %I_admin_del    ON public.%I FOR DELETE TO authenticated USING (public.is_admin());', t, t);
  END LOOP;
END $$;

-- admin_users: admin can manage; a user can always see their own row
DROP POLICY IF EXISTS admin_users_admin_all ON admin_users;
DROP POLICY IF EXISTS admin_users_own_read  ON admin_users;
CREATE POLICY admin_users_admin_all ON admin_users FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_users_own_read ON admin_users FOR SELECT
  TO authenticated USING (user_id = auth.uid());

-- =====================================================================
--  4. STORAGE BUCKETS
--     profile-images · project-images · resume  — all publicly viewable
--     (visitors must be able to download the resume)
--     uploads/updates/deletes restricted to the admin only
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('profile-images', 'profile-images', true),
  ('project-images', 'project-images', true),
  ('resume',         'resume',         true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS portfolio_storage_read   ON storage.objects;
DROP POLICY IF EXISTS portfolio_storage_insert ON storage.objects;
DROP POLICY IF EXISTS portfolio_storage_update ON storage.objects;
DROP POLICY IF EXISTS portfolio_storage_delete ON storage.objects;

CREATE POLICY portfolio_storage_read ON storage.objects FOR SELECT
  USING (bucket_id IN ('profile-images','project-images','resume'));

CREATE POLICY portfolio_storage_insert ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND bucket_id IN ('profile-images','project-images','resume'));

CREATE POLICY portfolio_storage_update ON storage.objects FOR UPDATE
  TO authenticated
  USING (public.is_admin() AND bucket_id IN ('profile-images','project-images','resume'));

CREATE POLICY portfolio_storage_delete ON storage.objects FOR DELETE
  TO authenticated
  USING (public.is_admin() AND bucket_id IN ('profile-images','project-images','resume'));

-- =====================================================================
--  5. ⚠️ REGISTER YOUR ADMIN ACCOUNT  ← RUN THIS LAST
--     Replace the email with the exact address you sign in with.
-- =====================================================================
-- INSERT INTO admin_users (user_id, email)
-- SELECT id, email FROM auth.users
-- WHERE email = 'your-login-email@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- =====================================================================
--  VERIFY
-- =====================================================================
-- SELECT * FROM admin_users;
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT id FROM storage.buckets WHERE id IN ('profile-images','project-images','resume');
