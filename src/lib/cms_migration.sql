-- =====================================================================
--  CMS MIGRATION — connect the EXISTING public content to Supabase
--  Run ONCE in: Supabase Dashboard → SQL Editor → New query → Run
--  Requires: src/lib/supabase.sql has already been run.
--
--  Content source: src/data/portfolioData.ts — 3 projects · 20 skills ·
--  3 achievements · 8 journey steps.
--
--  No duplicates, ever:
--    • rows that ALREADY exist (e.g. imported by hand, slug empty) are ADOPTED
--      by natural key — their content (images, order, edits) is kept
--    • only items with no row at all are inserted; UNIQUE(slug) + ON CONFLICT
--    • runs only while profiles.cms_migrated = false → re-running later never
--      resurrects deleted items or overwrites edits
--    • one transaction: if verification fails nothing is committed
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. MINIMUM SCHEMA ADDITIONS (existing columns/tables/RLS untouched)
-- ---------------------------------------------------------------------
ALTER TABLE public.projects     ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.skills       ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.journey      ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_key     ON public.projects (slug);
CREATE UNIQUE INDEX IF NOT EXISTS skills_slug_key       ON public.skills (slug);
CREATE UNIQUE INDEX IF NOT EXISTS achievements_slug_key ON public.achievements (slug);
CREATE UNIQUE INDEX IF NOT EXISTS journey_slug_key      ON public.journey (slug);
ALTER TABLE public.projects     ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS organisation_is_placeholder BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS date_is_placeholder         BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS link_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS cms_migrated BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- 2. EXISTING CONTENT — adopt what is already there, add what is missing
-- ---------------------------------------------------------------------
-- adopt existing projects rows (created before this migration) instead of inserting copies
UPDATE public.projects t SET slug = v.slug
FROM (VALUES
  ('ai-waste-management', 'AI Waste Management System'),
  ('ai-resume-analyzer', 'AI Resume Analyzer'),
  ('iot-smart-scale', 'IoT Smart Scale')
) AS v(slug, title)
WHERE t.id = (SELECT x.id FROM public.projects x WHERE x.slug IS NULL AND lower(x.title) = lower(v.title) ORDER BY x.created_at, x.id LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.projects y WHERE y.slug = v.slug)
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'single' AND cms_migrated);

-- insert only items that have no row yet
INSERT INTO public.projects (slug, title, kicker, summary, image_url, image_alt, tags, tech, github_url, live_url, problem, solution, features, stack, contribution, future, featured, published, sort_order)
SELECT v.* FROM (VALUES
  ('ai-waste-management', 'AI Waste Management System', 'Intelligence at the bin', 'An intelligent waste management solution combining AI and IoT for waste classification, monitoring and management.', 'images/proj-waste.jpg', 'Microcontroller board with a camera module mounted on an aluminium bracket on a dark workbench', ARRAY['AI', 'IOT', 'WEB']::text[], ARRAY['AI', 'IoT', 'ESP32', 'Computer Vision', 'Web Dashboard']::text[], 'https://github.com/hari-0824', '', 'Waste segregation at the source is inconsistent, so collected material is contaminated and recycling rates drop. Manual sorting is slow, unhealthy and hard to scale across a city.', 'A camera classifies waste at the point of disposal while an ESP32 reports bin fill-level and classification counts to a web dashboard, giving operators one live view of every node.', ARRAY['Image-based waste classification using a computer-vision model', 'ESP32 node reporting fill-level sensor readings over Wi-Fi', 'Live web dashboard for bin status and classification history', 'Threshold alerts when a bin approaches capacity', 'Per-node history for route planning and reporting']::text[], ARRAY['AI', 'IoT', 'ESP32', 'Computer Vision', 'Web Dashboard']::text[], 'Designed the classification flow, wrote the ESP32 firmware for sensor capture and transmission, and built the dashboard that renders the incoming data.', ARRAY['Retrain the classifier on locally collected, region-specific waste imagery', 'Add offline buffering so nodes survive network loss', 'Deploy route optimisation over the fill-level data', 'Move the inference pipeline onto the edge device itself']::text[], false, true, 0),
  ('ai-resume-analyzer', 'AI Resume Analyzer', 'Structured signal from prose', 'An AI-powered resume analysis system that evaluates resumes and extracts structured career information.', 'images/proj-resume.jpg', 'A printed sheet of paper on a dark desk raked by hard cool light, showing paper fibre texture', ARRAY['AI', 'WEB', 'JAVA']::text[], ARRAY['AI', 'Gemini API', 'Web Development', 'JSON']::text[], 'https://github.com/hari-0824', '', 'Resumes are unstructured prose. Reviewing them manually is repetitive and inconsistent, and useful signals — skills, timeline, gaps — are hard to compare across candidates.', 'A web application sends the resume text to an AI model with a strict schema and receives typed JSON back: skills, experience entries, education and suggested improvements, rendered in a readable report.', ARRAY['Paste-or-upload resume intake', 'Schema-constrained extraction into typed JSON', 'Skills, education and timeline broken out as separate fields', 'Role-match summary with highlighted gaps', 'Shareable report view of the analysis']::text[], ARRAY['AI', 'Gemini API', 'Web Development', 'JSON']::text[], 'Designed the extraction prompt and JSON contract, built the front-end report UI, and wrote the validation layer that rejects malformed model output before it reaches the screen.', ARRAY['PDF parsing server-side so uploads work end-to-end', 'Keyword gap analysis against a target job description', 'Version history so a candidate can compare resume revisions', 'Java/Spring Boot service layer to host the pipeline']::text[], false, true, 1),
  ('iot-smart-scale', 'IoT Smart Scale', 'Weight, transmitted', 'An ESP32-based smart weighing system using load cells and HX711 with real-time data transmission.', 'images/proj-scale.jpg', 'Macro photograph of an aluminium load cell bar bolted to a plate with thin wires on a dark bench', ARRAY['IOT', 'JAVA', 'WEB']::text[], ARRAY['ESP32', 'HX711', 'IoT', 'REST API']::text[], 'https://github.com/hari-0824', '', 'Ordinary scales display a number and lose it. There is no record, no remote reading and no way to trigger anything when a weight crosses a threshold.', 'A strain-gauge load cell read through an HX711 amplifier gives calibrated weight on an ESP32, which publishes readings to a REST endpoint so any client can consume them in real time.', ARRAY['Calibrated load-cell reading with tare support', 'HX711 24-bit sampling with running-average filtering', 'Wi-Fi transmission of readings to a REST API', 'Threshold events when a target weight is crossed', 'Client-agnostic endpoint — any dashboard can subscribe']::text[], ARRAY['ESP32', 'HX711', 'IoT', 'REST API']::text[], 'Wrote the firmware, performed the calibration and filtering work, and defined the REST contract the endpoint exposes.', ARRAY['Long-term storage and simple time-series charts', 'Battery/sleep modes for portable deployment', 'Multi-cell support for higher capacity platforms', 'OTA firmware updates over Wi-Fi']::text[], false, true, 2)
) AS v(slug, title, kicker, summary, image_url, image_alt, tags, tech, github_url, live_url, problem, solution, features, stack, contribution, future, featured, published, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'single' AND cms_migrated)
ON CONFLICT (slug) DO NOTHING;

-- adopt existing skills rows (created before this migration) instead of inserting copies
UPDATE public.skills t SET slug = v.slug
FROM (VALUES
  ('programming-java', 'Programming', 'Java'),
  ('programming-python', 'Programming', 'Python'),
  ('programming-javascript', 'Programming', 'JavaScript'),
  ('frontend-html', 'Frontend', 'HTML'),
  ('frontend-css', 'Frontend', 'CSS'),
  ('frontend-javascript', 'Frontend', 'JavaScript'),
  ('frontend-react', 'Frontend', 'React'),
  ('backend-java', 'Backend', 'Java'),
  ('backend-spring-boot', 'Backend', 'Spring Boot'),
  ('backend-rest-api', 'Backend', 'REST API'),
  ('database-mysql', 'Database', 'MySQL'),
  ('database-mongodb', 'Database', 'MongoDB'),
  ('tools-git', 'Tools', 'Git'),
  ('tools-github', 'Tools', 'GitHub'),
  ('tools-vs-code', 'Tools', 'VS Code'),
  ('tools-intellij-eclipse', 'Tools', 'IntelliJ / Eclipse'),
  ('ai-iot-ai-apis', 'AI & IoT', 'AI APIs'),
  ('ai-iot-computer-vision', 'AI & IoT', 'Computer Vision'),
  ('ai-iot-esp32', 'AI & IoT', 'ESP32'),
  ('ai-iot-sensors', 'AI & IoT', 'Sensors')
) AS v(slug, category, name)
WHERE t.id = (SELECT x.id FROM public.skills x WHERE x.slug IS NULL AND lower(x.category) = lower(v.category) AND lower(x.name) = lower(v.name) ORDER BY x.created_at, x.id LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.skills y WHERE y.slug = v.slug)
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'single' AND cms_migrated);

-- insert only items that have no row yet
INSERT INTO public.skills (slug, category, name, icon, "desc", level, published, sort_order)
SELECT v.* FROM (VALUES
  ('programming-java', 'Programming', 'Java', 'code', 'Core Java, OOP, collections & exception handling.', 85, true, 0),
  ('programming-python', 'Programming', 'Python', 'python', 'Scripting, automation and ML/experiment code.', 75, true, 1),
  ('programming-javascript', 'Programming', 'JavaScript', 'js', 'ES6+, DOM manipulation, async patterns.', 78, true, 2),
  ('frontend-html', 'Frontend', 'HTML', 'markup', 'Semantic, accessible document structure.', 90, true, 3),
  ('frontend-css', 'Frontend', 'CSS', 'style', 'Flexbox, grid, responsive layout systems.', 82, true, 4),
  ('frontend-javascript', 'Frontend', 'JavaScript', 'js', 'Interactive UI behaviour and state.', 78, true, 5),
  ('frontend-react', 'Frontend', 'React', 'react', 'Components, hooks, props and state flow.', 76, true, 6),
  ('backend-java', 'Backend', 'Java', 'code', 'Service layer logic and domain modelling.', 85, true, 7),
  ('backend-spring-boot', 'Backend', 'Spring Boot', 'spring', 'Auto-configuration, JPA, layered architecture.', 74, true, 8),
  ('backend-rest-api', 'Backend', 'REST API', 'api', 'Resource design, status codes, JSON contracts.', 77, true, 9),
  ('database-mysql', 'Database', 'MySQL', 'sql', 'Schema design, joins, normalisation.', 80, true, 10),
  ('database-mongodb', 'Database', 'MongoDB', 'mongo', 'Document modelling and NoSQL queries.', 68, true, 11),
  ('tools-git', 'Tools', 'Git', 'git', 'Branching, commits, pull requests.', 82, true, 12),
  ('tools-github', 'Tools', 'GitHub', 'git', 'Repos, issues, hosted collaboration.', 82, true, 13),
  ('tools-vs-code', 'Tools', 'VS Code', 'ide', 'Daily editor for front-end work.', 90, true, 14),
  ('tools-intellij-eclipse', 'Tools', 'IntelliJ / Eclipse', 'ide', 'Java and Spring Boot development.', 84, true, 15),
  ('ai-iot-ai-apis', 'AI & IoT', 'AI APIs', 'ai', 'Gemini / LLM APIs for structured extraction.', 72, true, 16),
  ('ai-iot-computer-vision', 'AI & IoT', 'Computer Vision', 'vision', 'Image classification for real-world inputs.', 66, true, 17),
  ('ai-iot-esp32', 'AI & IoT', 'ESP32', 'chip', 'Wi-Fi microcontroller firmware & networking.', 74, true, 18),
  ('ai-iot-sensors', 'AI & IoT', 'Sensors', 'sensor', 'Load cells, HX711, environmental inputs.', 70, true, 19)
) AS v(slug, category, name, icon, "desc", level, published, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'single' AND cms_migrated)
ON CONFLICT (slug) DO NOTHING;

-- adopt existing achievements rows (created before this migration) instead of inserting copies
UPDATE public.achievements t SET slug = v.slug,
    organisation_is_placeholder = (t.organisation = v.org AND v.oph),
    date_is_placeholder         = (t.date = v.date AND v.dph)
FROM (VALUES
  ('hackathon', 'Hackathon Achievement — 1st Prize', 'Smart City / IoT Hackathon', false, 'Date to be added', true),
  ('certifications', 'Certifications', 'Issuing organisation to be added', true, 'Dates to be added', true),
  ('workshops', 'Workshops & Technical Programs', 'Host institution to be added', true, 'Dates to be added', true)
) AS v(slug, title, org, oph, date, dph)
WHERE t.id = (SELECT x.id FROM public.achievements x WHERE x.slug IS NULL AND lower(x.title) = lower(v.title) ORDER BY x.created_at, x.id LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.achievements y WHERE y.slug = v.slug)
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'single' AND cms_migrated);

-- insert only items that have no row yet
INSERT INTO public.achievements (slug, kind, title, organisation, organisation_is_placeholder, date, date_is_placeholder, description, tags, link_url, published, sort_order)
SELECT v.* FROM (VALUES
  ('hackathon', 'award', 'Hackathon Achievement — 1st Prize', 'Smart City / IoT Hackathon', false, 'Date to be added', true, 'First prize for an IoT-driven smart-city submission. Award recognised the working prototype and the approach to the problem statement.', ARRAY['IoT', 'Prototype', 'Team']::text[], '', true, 0),
  ('certifications', 'certification', 'Certifications', 'Issuing organisation to be added', true, 'Dates to be added', true, 'Course certifications completed and in progress. Replace each entry with the issuing body, credential ID and date once available.', ARRAY['Python', 'AI', 'Web Development', 'Other certifications']::text[], '', true, 1),
  ('workshops', 'workshop', 'Workshops & Technical Programs', 'Host institution to be added', true, 'Dates to be added', true, 'Technical workshops and development programs attended during the degree. Add the workshop name, host and date for each.', ARRAY['Workshops', 'Development Programs']::text[], '', true, 2)
) AS v(slug, kind, title, organisation, organisation_is_placeholder, date, date_is_placeholder, description, tags, link_url, published, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'single' AND cms_migrated)
ON CONFLICT (slug) DO NOTHING;

-- adopt existing journey rows (created before this migration) instead of inserting copies
UPDATE public.journey t SET slug = v.slug
FROM (VALUES
  ('2024-programming-foundations', '2024', 'Programming Foundations'),
  ('2025-python-web-development', '2025', 'Python + Web Development'),
  ('2025-java-development', '2025', 'Java Development'),
  ('2026-advanced-java-collections', '2026', 'Advanced Java + Collections'),
  ('2026-react-full-stack-development', '2026', 'React + Full Stack Development'),
  ('2026-ai-iot-projects', '2026', 'AI + IoT Projects'),
  ('2027-spring-boot-rest-apis', '2027', 'Spring Boot + REST APIs'),
  ('2028-full-stack-developer', '2028', 'Full Stack Developer')
) AS v(slug, year, title)
WHERE t.id = (SELECT x.id FROM public.journey x WHERE x.slug IS NULL AND x.year = v.year AND lower(x.title) = lower(v.title) ORDER BY x.created_at, x.id LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.journey y WHERE y.slug = v.slug)
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'single' AND cms_migrated);

-- insert only items that have no row yet
INSERT INTO public.journey (slug, year, title, note, state, published, sort_order)
SELECT v.* FROM (VALUES
  ('2024-programming-foundations', '2024', 'Programming Foundations', 'First structured steps into programming logic and problem solving.', 'done', true, 0),
  ('2025-python-web-development', '2025', 'Python + Web Development', 'Python alongside HTML, CSS and JavaScript for the browser.', 'done', true, 1),
  ('2025-java-development', '2025', 'Java Development', 'Object-oriented Java became the primary language.', 'done', true, 2),
  ('2026-advanced-java-collections', '2026', 'Advanced Java + Collections', 'Collections framework, generics and deeper language mechanics.', 'now', true, 3),
  ('2026-react-full-stack-development', '2026', 'React + Full Stack Development', 'Component-driven front ends wired to real back-end services.', 'now', true, 4),
  ('2026-ai-iot-projects', '2026', 'AI + IoT Projects', 'Computer vision, AI APIs and ESP32 sensor systems.', 'now', true, 5),
  ('2027-spring-boot-rest-apis', '2027', 'Spring Boot + REST APIs', 'Production-style services, JPA and API design.', 'next', true, 6),
  ('2028-full-stack-developer', '2028', 'Full Stack Developer', 'Graduation target and career objective.', 'next', true, 7)
) AS v(slug, year, title, note, state, published, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'single' AND cms_migrated)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. VERIFY exactly one row per existing item, then flip the switch
-- ---------------------------------------------------------------------
DO $$
DECLARE
  bad TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = 'single' AND cms_migrated) THEN
    RAISE NOTICE 'CMS already migrated — nothing to do.';
    RETURN;
  END IF;

  SELECT string_agg(t || ':' || s, ', ') INTO bad FROM (
    SELECT 'projects' t, s FROM unnest(ARRAY['ai-waste-management', 'ai-resume-analyzer', 'iot-smart-scale']) s
      WHERE (SELECT count(*) FROM public.projects WHERE slug = s) <> 1
    UNION ALL
    SELECT 'skills', s FROM unnest(ARRAY['programming-java', 'programming-python', 'programming-javascript', 'frontend-html', 'frontend-css', 'frontend-javascript', 'frontend-react', 'backend-java', 'backend-spring-boot', 'backend-rest-api', 'database-mysql', 'database-mongodb', 'tools-git', 'tools-github', 'tools-vs-code', 'tools-intellij-eclipse', 'ai-iot-ai-apis', 'ai-iot-computer-vision', 'ai-iot-esp32', 'ai-iot-sensors']) s
      WHERE (SELECT count(*) FROM public.skills WHERE slug = s) <> 1
    UNION ALL
    SELECT 'achievements', s FROM unnest(ARRAY['hackathon', 'certifications', 'workshops']) s
      WHERE (SELECT count(*) FROM public.achievements WHERE slug = s) <> 1
    UNION ALL
    SELECT 'journey', s FROM unnest(ARRAY['2024-programming-foundations', '2025-python-web-development', '2025-java-development', '2026-advanced-java-collections', '2026-react-full-stack-development', '2026-ai-iot-projects', '2027-spring-boot-rest-apis', '2028-full-stack-developer']) s
      WHERE (SELECT count(*) FROM public.journey WHERE slug = s) <> 1
  ) x;

  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'CMS migration verification failed (missing or duplicate): %', bad;
  END IF;

  UPDATE public.profiles SET cms_migrated = true WHERE id = 'single';
  RAISE NOTICE 'CMS migration verified: % projects, % skills, % achievements, % journey steps.',
    3, 20, 3, 8;
END $$;

COMMIT;

-- ---------------------------------------------------------------------
-- 4. REPORT (read-only). "other_rows" = rows that match no built-in item
--    (e.g. projects you added yourself) — kept, never deleted.
-- ---------------------------------------------------------------------
SELECT 'projects' AS section, count(*) AS rows, count(slug) AS matched_rows, count(*) - count(slug) AS other_rows FROM public.projects
UNION ALL SELECT 'skills',       count(*), count(slug), count(*) - count(slug) FROM public.skills
UNION ALL SELECT 'achievements', count(*), count(slug), count(*) - count(slug) FROM public.achievements
UNION ALL SELECT 'journey',      count(*), count(slug), count(*) - count(slug) FROM public.journey
UNION ALL SELECT 'cms_migrated', (SELECT cms_migrated::int FROM public.profiles WHERE id = 'single'), NULL, NULL;
