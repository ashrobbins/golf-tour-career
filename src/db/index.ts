import { openDB, type IDBPDatabase } from "idb";
import type { AIGolfer, PlayerProfile, TournamentHistoryEntry } from "../types";
import type { CareerDB } from "./schema";
import { DB_NAME, DB_VERSION } from "./schema";

let dbPromise: Promise<IDBPDatabase<CareerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<CareerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CareerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("player")) {
          db.createObjectStore("player");
        }
        if (!db.objectStoreNames.contains("aiGolfers")) {
          const store = db.createObjectStore("aiGolfers", { keyPath: "id" });
          store.createIndex("by-rank", "rank");
        }
        if (!db.objectStoreNames.contains("tournamentHistory")) {
          const store = db.createObjectStore("tournamentHistory", { keyPath: "tournamentId" });
          store.createIndex("by-season", "season");
        }
      },
    });
  }
  return dbPromise;
}

// ---- Player ----

export async function getPlayer(): Promise<PlayerProfile | undefined> {
  const db = await getDB();
  return db.get("player", "player");
}

export async function savePlayer(player: PlayerProfile): Promise<void> {
  const db = await getDB();
  await db.put("player", player, "player");
}

// ---- AI golfers ----

export async function saveAIGolfers(golfers: AIGolfer[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("aiGolfers", "readwrite");
  await Promise.all(golfers.map((g) => tx.store.put(g)));
  await tx.done;
}

export async function getAIGolfer(id: string): Promise<AIGolfer | undefined> {
  const db = await getDB();
  return db.get("aiGolfers", id);
}

export async function countAIGolfers(): Promise<number> {
  const db = await getDB();
  return db.count("aiGolfers");
}

/** Rank-window query used by field selection (§15/§16) — uses the by-rank index
 *  instead of loading all 999 golfers into memory. */
export async function getAIGolfersInRankRange(minRank: number, maxRank: number): Promise<AIGolfer[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(minRank, maxRank);
  return db.getAllFromIndex("aiGolfers", "by-rank", range);
}

export async function updateAIGolferRank(id: string, newRank: number): Promise<void> {
  const db = await getDB();
  const golfer = await db.get("aiGolfers", id);
  if (!golfer) return;
  golfer.rank = newRank;
  await db.put("aiGolfers", golfer);
}

// ---- Tournament history (player only — AI golfers keep aggregate stats, not per-tournament rows) ----

export async function addTournamentHistory(entry: TournamentHistoryEntry): Promise<void> {
  const db = await getDB();
  await db.put("tournamentHistory", entry);
}

export async function getTournamentHistoryForSeason(season: number): Promise<TournamentHistoryEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex("tournamentHistory", "by-season", season);
}

export async function getAllTournamentHistory(): Promise<TournamentHistoryEntry[]> {
  const db = await getDB();
  return db.getAll("tournamentHistory");
}

export async function clearTournamentHistory(): Promise<void> {
  const db = await getDB();
  await db.clear("tournamentHistory");
}
