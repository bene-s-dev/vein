-- Add is_game_over column to leaderboard
ALTER TABLE public.leaderboard 
ADD COLUMN IF NOT EXISTS is_game_over BOOLEAN NOT NULL DEFAULT false;
