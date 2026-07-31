-- =============================================================================
-- CineSync v1.0 — Initial Database Schema Migration
-- Source: docs/05-Database/Database-Schema.md
-- Run in: Supabase Dashboard → SQL Editor (or via Supabase CLI)
-- =============================================================================

-- ── 0. Required Extensions ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. Custom Enum Types ──────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role        AS ENUM ('host', 'cohost', 'guest');
  CREATE TYPE room_privacy     AS ENUM ('public', 'unlisted', 'password');
  CREATE TYPE permission_mode  AS ENUM ('open', 'host_only');
  CREATE TYPE media_source_type AS ENUM ('youtube', 'mp4', 'hls', 'local');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Profiles Table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(24) NOT NULL CHECK (char_length(display_name) >= 2),
    avatar_url  TEXT,
    is_guest    BOOLEAN DEFAULT false NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── 3. Rooms Table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            VARCHAR(12) UNIQUE NOT NULL CHECK (char_length(slug) >= 6),
    name            VARCHAR(50) NOT NULL CHECK (char_length(name) >= 3),
    host_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    privacy         room_privacy DEFAULT 'unlisted' NOT NULL,
    password_hash   TEXT,
    permission_mode permission_mode DEFAULT 'host_only' NOT NULL,
    current_media   JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active       BOOLEAN DEFAULT true NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── 4. Room Members Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.room_members (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id      UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role         user_role DEFAULT 'guest' NOT NULL,
    is_ready     BOOLEAN DEFAULT false NOT NULL,
    joined_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(room_id, user_id)
);

-- ── 5. Chat Messages Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id    UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content    TEXT NOT NULL CHECK (char_length(content) <= 1000),
    is_pinned  BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── 6. Room Playlists Table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.room_playlists (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id     UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    added_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title       VARCHAR(150) NOT NULL,
    url         TEXT NOT NULL,
    source_type media_source_type NOT NULL,
    position    INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ── 7. Saved Rooms Table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_rooms (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    room_id    UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, room_id)
);

-- ── 8. Performance Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rooms_slug
    ON public.rooms(slug);

CREATE INDEX IF NOT EXISTS idx_rooms_host_id
    ON public.rooms(host_id);

CREATE INDEX IF NOT EXISTS idx_room_members_room_id
    ON public.room_members(room_id);

CREATE INDEX IF NOT EXISTS idx_room_members_user_id
    ON public.room_members(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id_created
    ON public.chat_messages(room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_room_playlists_room_position
    ON public.room_playlists(room_id, position ASC);

-- ── 9. Row-Level Security ─────────────────────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_rooms   ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by anyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by anyone"
    ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Rooms
DROP POLICY IF EXISTS "Rooms viewable by anyone" ON public.rooms;
CREATE POLICY "Rooms viewable by anyone"
    ON public.rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
CREATE POLICY "Authenticated users can create rooms"
    ON public.rooms FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update own rooms" ON public.rooms;
CREATE POLICY "Hosts can update own rooms"
    ON public.rooms FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete own rooms" ON public.rooms;
CREATE POLICY "Hosts can delete own rooms"
    ON public.rooms FOR DELETE USING (auth.uid() = host_id);

-- Room Members
DROP POLICY IF EXISTS "Members can view room_members" ON public.room_members;
CREATE POLICY "Members can view room_members"
    ON public.room_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;
CREATE POLICY "Users can join rooms"
    ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own membership" ON public.room_members;
CREATE POLICY "Users can update own membership"
    ON public.room_members FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;
CREATE POLICY "Users can leave rooms"
    ON public.room_members FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages
DROP POLICY IF EXISTS "Members can view room messages" ON public.chat_messages;
CREATE POLICY "Members can view room messages"
    ON public.chat_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Members can send messages" ON public.chat_messages;
CREATE POLICY "Members can send messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND EXISTS (
            SELECT 1 FROM public.room_members
            WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
        )
    );

-- Saved Rooms
DROP POLICY IF EXISTS "Users can view own saved rooms" ON public.saved_rooms;
CREATE POLICY "Users can view own saved rooms"
    ON public.saved_rooms FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save rooms" ON public.saved_rooms;
CREATE POLICY "Users can save rooms"
    ON public.saved_rooms FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave rooms" ON public.saved_rooms;
CREATE POLICY "Users can unsave rooms"
    ON public.saved_rooms FOR DELETE USING (auth.uid() = user_id);

-- ── 10. Realtime Publication ──────────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── 11. Auto-Create Profile Trigger ──────────────────────────────────────────
-- Automatically creates a profile row when a new user signs up via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, is_guest)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 12. Updated_at Auto-Update ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_rooms_updated_at ON public.rooms;
CREATE TRIGGER set_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
