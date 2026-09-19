import { createClient } from '@supabase/supabase-js';

// Supabase Konfiguration aus Vite Environment Variables
// (VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in .env)
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn('[Leaderboard] Supabase Initialisierung fehlgeschlagen:', e);
  }
}

// Fallback lokaler Highscore-Speicher (wenn keine Supabase ENV hinterlegt ist)
const LOCAL_KEY = 'vein_leaderboard_local';

function getLocalLeaderboard() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    { name: 'Klaus Bohrmann', depth: 1250, level: 15, title: 'Quanten-Pionier', date: '2026-09-10' },
    { name: 'Elena Berg', depth: 840, level: 11, title: 'Tiefenbohrerin', date: '2026-09-12' },
    { name: 'Marcus Stein', depth: 460, level: 8, title: 'Granit-Meister', date: '2026-09-14' },
    { name: 'Benedikt', depth: 320, level: 6, title: 'Chef-Entwickler', date: '2026-09-15' },
    { name: 'Rookie_01', depth: 95, level: 3, title: 'Schiefer-Neuling', date: '2026-09-16' }
  ];
}

function saveLocalLeaderboard(list) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch (e) {}
}

export const LeaderboardService = {
  isSupabaseConfigured() {
    return !!(supabase && SUPABASE_URL && !SUPABASE_URL.includes('your-project') && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('your-anon-key'));
  },

  /**
   * Lädt die echten Top-Einträge der Bestenliste ausschließlich aus Supabase
   * @param {number} limit 
   * @returns {Promise<Array<{name: string, depth: number, level: number, created_at?: string}>>}
   */
  async fetchTopScores(limit = 10) {
    if (!this.isSupabaseConfigured()) {
      return null; // Zeigt in der UI an, dass Supabase noch konfiguriert werden muss
    }

    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('name, depth, level, created_at')
        .order('depth', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('[Leaderboard] Fehler beim Abrufen aus Supabase:', error.message);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('[Leaderboard] Supabase Verbindungsfehler:', err);
      return [];
    }
  },

  /**
   * Übermittelt ein echtes Spielergebnis an Supabase
   */
  async submitScore(name, depth, level = 1) {
    if (!this.isSupabaseConfigured()) return false;

    const cleanName = (name || 'Fahrer').trim().slice(0, 24);
    const cleanDepth = Math.max(0, Math.round(depth));
    const cleanLevel = Math.max(1, Math.round(level));

    if (cleanDepth <= 0) return false;

    try {
      const { error } = await supabase
        .from('leaderboard')
        .upsert({
          name: cleanName,
          depth: cleanDepth,
          level: cleanLevel,
          updated_at: new Date().toISOString()
        }, { onConflict: 'name' });

      if (error) {
        // Fallback falls Constraint anders benannt ist
        await supabase.from('leaderboard').insert([{
          name: cleanName,
          depth: cleanDepth,
          level: cleanLevel
        }]);
      }
      return true;
    } catch (err) {
      console.warn('[Leaderboard] Fehler beim Senden an Supabase:', err);
      return false;
    }
  },

  /**
   * Setzt den Game-Over-Status eines Spielers in Supabase.
   * @param {string} name
   * @param {boolean} isGameOver
   * @param {number} depth
   * @param {number} level
   */
  async setGameOver(name, isGameOver = true, depth = 0, level = 1) {
    if (!this.isSupabaseConfigured()) return false;
    const cleanName = (name || 'Fahrer').trim().slice(0, 24);
    const cleanDepth = Math.max(0, Math.round(depth));
    const cleanLevel = Math.max(1, Math.round(level));

    try {
      // 1. Erst via Update versuchen (sicherer bei fehlendem Unique Constraint)
      const { data, error: updateError } = await supabase
        .from('leaderboard')
        .update({
          is_game_over: !!isGameOver,
          depth: cleanDepth,
          level: cleanLevel,
          updated_at: new Date().toISOString()
        })
        .eq('name', cleanName)
        .select();

      if (!updateError && data && data.length > 0) {
        return true;
      }

      // 2. Falls kein Eintrag existierte oder Update fehlschlug, via Upsert versuchen
      const { error } = await supabase
        .from('leaderboard')
        .upsert({
          name: cleanName,
          depth: cleanDepth,
          level: cleanLevel,
          is_game_over: !!isGameOver,
          updated_at: new Date().toISOString()
        }, { onConflict: 'name' });

      if (error) {
        console.warn('[Leaderboard] Fehler beim Setzen des Game-Over Status:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Leaderboard] Fehler bei setGameOver:', err);
      return false;
    }
  },

  /**
   * Prüft den Game-Over-Status in Supabase.
   * Wenn der Entwickler in der Datenbank is_game_over auf false geändert hat,
   * liefert diese Methode false zurück und der Spieler wird gerettet!
   * @param {string} name
   * @returns {Promise<boolean|null>}
   */
  async checkGameOver(name) {
    if (!this.isSupabaseConfigured()) return null;
    const cleanName = (name || 'Fahrer').trim().slice(0, 24);

    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('is_game_over')
        .eq('name', cleanName)
        .maybeSingle();

      if (error) {
        console.warn('[Leaderboard] Fehler beim Abrufen des Game-Over Status:', error.message);
        return null;
      }
      if (!data) return null;
      return !!data.is_game_over;
    } catch (err) {
      console.warn('[Leaderboard] Fehler bei checkGameOver:', err);
      return null;
    }
  }
};
