-- SQL zum Anlegen der echten Bestenliste-Tabelle in Supabase:
-- Führe dieses Skript im Supabase SQL-Editor deines Projekts aus:

CREATE TABLE IF NOT EXISTS public.leaderboard (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    depth INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index für ultraschnelle Sortierung nach Tiefe
CREATE INDEX IF NOT EXISTS idx_leaderboard_depth ON public.leaderboard (depth DESC);

-- Row Level Security (RLS) aktivieren
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Öffentliches Lesen erlauben (jeder Spieler kann die Bestenliste einsehen)
CREATE POLICY "Allow public read access" 
ON public.leaderboard 
FOR SELECT 
USING (true);

-- Öffentliches Schreiben / Aktualisieren erlauben (anonymer Spielstand)
CREATE POLICY "Allow public insert" 
ON public.leaderboard 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update" 
ON public.leaderboard 
FOR UPDATE 
USING (true);
