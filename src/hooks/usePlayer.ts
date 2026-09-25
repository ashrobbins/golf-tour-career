import { useEffect, useState } from "react";
import { ensureWorldInitialized } from "../systems/init";
import type { PlayerProfile } from "../types";

export function usePlayer() {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureWorldInitialized()
      .then((p) => {
        if (!cancelled) setPlayer(p);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { player, loading, error };
}
