import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GreenScene } from "../components/GreenScene";
import { HoleScene } from "../components/HoleScene";
import { ScoreBadge } from "../components/ScoreBadge";
import { SegmentedBar } from "../components/SegmentedBar";
import { usePlayer } from "../hooks/usePlayer";
import { rewardLabelForShotType } from "../systems/probability";
import {
  buildLiveStandings,
  buildStageSequence,
  canPlausiblyReachGreen,
  computeHoleScoreFromStages,
  holeCommentary,
  resolvePuttStage,
  resolveShotStage,
  resultHeadline,
  simulatedHoleScore,
  situationForStage,
  yardageForHole,
  type PreparedTournament,
  type ShotChoice,
  type StageDef,
  type StageOutcome,
  type StageResolution,
} from "../systems/tournament";
import { ordinal } from "../utils/format";
import { majorTheme } from "../styles/majorTheme";

interface HoleOutcome {
  holeNumber: number;
  par: number;
  scoreToPar: number;
  isPlayed: boolean;
  hadRecovery: boolean;
}

interface PendingStage {
  stage: StageDef;
  shotType: ShotChoice;
  resolution: StageResolution;
  finalScore: number | null; // set only once the putt stage resolves
}

const HOLE_COMMENTARY_MS = 1750;

const scoreLabels: Record<number, string> = {
  [-2]: "EAGLE",
  [-1]: "BIRDIE",
  0: "PAR",
  1: "BOGEY",
  2: "DOUBLE BOGEY",
  3: "TRIPLE BOGEY",
};

function scoreLabel(score: number): string {
  return scoreLabels[score] ?? (score < -2 ? "EAGLE+" : `+${score}`);
}

function scoreText(score: number): string {
  if (score === 0) return "E";
  return score > 0 ? `+${score}` : `${score}`;
}

/** How the putt options should talk about their outcome — "for birdie" only
 *  makes sense if birdie is actually still on the table; after a missed
 *  green and a recovery shot, the honest best case is par. */
function puttOutcomePhrase(hypotheticalScore: number): string {
  if (hypotheticalScore <= -1) return `for ${scoreLabel(hypotheticalScore).toLowerCase()}`;
  if (hypotheticalScore === 0) return "to save par";
  return `to salvage a ${scoreLabel(hypotheticalScore).toLowerCase()}`;
}

export default function GameplayDecision() {
  const navigate = useNavigate();
  const location = useLocation();
  const { player } = usePlayer();

  const prepared = (location.state as { prepared?: PreparedTournament } | null)?.prepared ?? null;

  // The round walks through every hole (1..18) in order, not just the 5
  // played ones — currentHoleNumber is the single source of truth for
  // where we are, and each hole number is either "played" (full decision
  // flow) or simulated (one quick check, shown as commentary same as a
  // played hole's result would be).
  const [currentHoleNumber, setCurrentHoleNumber] = useState(1);
  const [stageIndex, setStageIndex] = useState(0);
  const [stageOutcomes, setStageOutcomes] = useState<StageOutcome[]>([]);
  const [pending, setPending] = useState<PendingStage | null>(null);
  const [allHoleOutcomes, setAllHoleOutcomes] = useState<HoleOutcome[]>([]);
  const [commentaryFor, setCommentaryFor] = useState<HoleOutcome | null>(null);

  function dismissCommentary() {
    setCommentaryFor(null);
    setCurrentHoleNumber((n) => n + 1);
  }

  useEffect(() => {
    if (!commentaryFor) return;
    const timer = setTimeout(dismissCommentary, HOLE_COMMENTARY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentaryFor]);

  const totalHoles = prepared?.course.holes.length ?? 0;
  const isRoundComplete = !!prepared && currentHoleNumber > totalHoles;
  const isCurrentHolePlayed = !!prepared && prepared.playedHoleNumbers.includes(currentHoleNumber);

  // Simulated (non-played) holes resolve themselves the moment we land on
  // them — no decision to make, just show what happened and move on.
  useEffect(() => {
    if (!prepared || !player || commentaryFor) return;
    if (currentHoleNumber > totalHoles) return;
    if (prepared.playedHoleNumbers.includes(currentHoleNumber)) return;
    if (allHoleOutcomes.some((o) => o.holeNumber === currentHoleNumber)) return;

    const hole = prepared.course.holes[currentHoleNumber - 1];
    const scoreToPar = simulatedHoleScore(prepared.tournament.id, currentHoleNumber, hole, player.attributes, "player");
    const outcome: HoleOutcome = { holeNumber: currentHoleNumber, par: hole.par, scoreToPar, isPlayed: false, hadRecovery: false };
    setAllHoleOutcomes((prev) => [...prev, outcome]);
    setCommentaryFor(outcome);
  }, [currentHoleNumber, prepared, player, commentaryFor, allHoleOutcomes, totalHoles]);

  // Running total across every hole resolved so far (played or simulated) —
  // needed here, before the early returns, since the live position estimate
  // below depends on it.
  const scoreSoFar = allHoleOutcomes.reduce((sum, o) => sum + o.scoreToPar, 0);

  // A real computed position, not a rank-based guess — the AI field's
  // scores here are simulated through the exact same holes the player has
  // resolved so far, using the same per-hole seeds the final leaderboard
  // will extend from. At holesElapsed=0 everyone's tied at even par, which
  // is exactly right — nobody's ahead of anyone before a shot is struck.
  const holesElapsed = allHoleOutcomes.length;
  const projectedPosition = useMemo(() => {
    if (!player || !prepared) return null;
    const standings = buildLiveStandings(
      prepared.tournament.id,
      prepared.course,
      prepared.field,
      { rank: player.rank, scoreToPar: scoreSoFar },
      holesElapsed,
    );
    return standings.find((s) => s.isPlayer)?.position ?? null;
  }, [player, prepared, scoreSoFar, holesElapsed]);

  useEffect(() => {
    if (!isRoundComplete || !prepared || !player) return;
    const playedHoles = allHoleOutcomes
      .filter((o) => o.isPlayed)
      .map((o) => ({ holeNumber: o.holeNumber, par: o.par, scoreToPar: o.scoreToPar }));
    const simulatedHolesCount = allHoleOutcomes.length - playedHoles.length;
    navigate("/leaderboard", {
      replace: true,
      state: {
        leaderboard: {
          prepared,
          playerRank: player.rank,
          playerScoreToPar: scoreSoFar,
          playedHoles,
          simulatedHolesCount,
        },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRoundComplete]);

  if (!prepared) {
    return (
      <div className="pa-screen">
        <div className="pa-content pa-section">
          <p style={{ fontFamily: "var(--pa-font-body)", color: "var(--pa-ink)" }}>No tournament in progress.</p>
          <button className="pa-cta" style={{ marginTop: 12 }} onClick={() => navigate("/course-preview")}>
            BACK TO PREVIEW
          </button>
        </div>
      </div>
    );
  }

  if (!player) return null;

  const { tournament, course, playedHoleNumbers, windMph, windDirection } = prepared;
  const isMajor = tournament.type === "major";
  const m = majorTheme;

  if (isRoundComplete) {
    // The navigate-to-results effect above fires on the same render this
    // flips true; nothing to show for the brief moment before it redirects.
    return null;
  }

  if (commentaryFor) {
    const strokes = commentaryFor.par + commentaryFor.scoreToPar;
    const scoreBadgeSize = 84;
    const bigFontSize = scoreBadgeSize * 0.4; // shared by the hole number and the running total, to match the score badge

    return (
      <div
        className="pa-screen"
        onClick={dismissCommentary}
        style={{ cursor: "pointer", ...(isMajor ? { background: m.screenBg, border: `4px solid ${m.screenBorder}` } : {}) }}
      >
        <header
          className="pa-header"
          style={{
            flexDirection: "column",
            alignItems: "stretch",
            gap: 4,
            ...(isMajor ? { background: m.headerBg, borderBottom: `3px solid ${m.gold}` } : {}),
          }}
        >
          <div className="pa-title" style={{ fontSize: 18, ...(isMajor ? { color: m.gold } : {}) }}>
            HOLE {commentaryFor.holeNumber} OF {totalHoles}
          </div>
          <div className="pa-subtitle" style={isMajor ? { color: m.muted } : undefined}>
            PAR {commentaryFor.par} · {projectedPosition ? `POS ${ordinal(projectedPosition)}` : "POS —"}
            {!commentaryFor.isPlayed && " · SIMULATED"}
          </div>
        </header>
        <div
          className="pa-content pa-section"
          style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 20, textAlign: "center" }}
        >
          <div className="pa-title" style={{ fontSize: bigFontSize, color: isMajor ? m.gold : "var(--pa-ink)" }}>
            HOLE {commentaryFor.holeNumber}
          </div>
          <ScoreBadge
            label={scoreLabel(commentaryFor.scoreToPar)}
            scoreToPar={commentaryFor.scoreToPar}
            size={scoreBadgeSize}
            parColor={isMajor ? m.cream : "var(--pa-ink)"}
          />
          <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 16 }}>
            {scoreLabel(commentaryFor.scoreToPar)} · {strokes} {strokes === 1 ? "STROKE" : "STROKES"}
          </div>
          <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.cream : "var(--pa-body-text)", fontSize: 20, lineHeight: 1.4 }}>
            {holeCommentary(tournament.id, commentaryFor.holeNumber, commentaryFor.scoreToPar, commentaryFor.hadRecovery)}
          </div>
          <div
            className="pa-panel"
            style={{
              textAlign: "center",
              margin: "0 auto",
              width: "70%",
              ...(isMajor ? { background: m.rowBg, border: `3px solid ${m.gold}` } : {}),
            }}
          >
            <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-muted-text)", fontSize: 15 }}>RUNNING TOTAL</div>
            <div className="pa-title" style={{ fontSize: bigFontSize, marginTop: 6, color: isMajor ? m.cream : "var(--pa-ink)" }}>
              {scoreText(scoreSoFar)}
            </div>
          </div>
          <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.mutedDark : "var(--pa-muted-text)", fontSize: 16 }}>TAP TO CONTINUE</div>
        </div>
      </div>
    );
  }

  if (!isCurrentHolePlayed) {
    // Waiting on the simulation effect above to resolve this hole and pop
    // the commentary screen — effectively instantaneous, no UI needed.
    return null;
  }

  const holeNumber = currentHoleNumber;
  const hole = course.holes[holeNumber - 1];
  const yardage = yardageForHole(tournament.id, hole);
  // The sequence grows as the hole is played — a missed green inserts a
  // recovery stage before the putt, so this isn't knowable up front.
  const stages = buildStageSequence(hole.par as 3 | 4 | 5, stageOutcomes);
  const stage = stages[stageIndex];

  // Progress through the hole (and the round) both feed pressure — the
  // closer to a decision that matters, the tighter it gets (§27).
  const playedHoleIndex = playedHoleNumbers.indexOf(holeNumber);
  const pressure = (playedHoleIndex + (stageIndex + 1) / stages.length) / playedHoleNumbers.length;

  const situation = situationForStage(yardage, stage, stageOutcomes);

  // Approach shots, a par 3's tee shot, and recovery shots are all "trying
  // to reach the green from here" attempts — a #1000 golfer's attributes
  // should cap how far that's realistic, not just how well-worded the
  // option is (§28: difficulty should come from the real situation).
  const isGreenReachStage = stage.type === "approach" || stage.type === "recovery" || (stage.type === "tee" && hole.par === 3);
  const reachable =
    !isGreenReachStage || situation.distanceYards === null
      ? true
      : canPlausiblyReachGreen(situation.distanceYards, player.attributes.accuracy, player.attributes.power);

  let displayStage: StageDef =
    isGreenReachStage && !reachable
      ? {
          ...stage,
          safeLabel: "TAKE YOUR MEDICINE",
          safeDescription: "You're not reaching this green from here — just get back into position.",
        }
      : stage;

  if (stage.type === "putt") {
    // "Firm pace at the hole for birdie" is a lie once a missed green and a
    // recovery shot are already on the card — the honest best case by then
    // is par, so say that instead of always promising a birdie.
    const attackScore = computeHoleScoreFromStages(stageOutcomes, { type: "putt", shotType: "attack", success: true });
    const safeScore = computeHoleScoreFromStages(stageOutcomes, { type: "putt", shotType: "safe", success: true });
    displayStage = {
      ...displayStage,
      attackDescription: `Firm pace at the hole ${puttOutcomePhrase(attackScore)}.`,
      safeDescription: `Die it near the cup — reliable two-putt ${puttOutcomePhrase(safeScore)}.`,
    };
  }

  const previewFor = (shotType: ShotChoice): StageResolution =>
    stage.type === "putt"
      ? resolvePuttStage({
          tournamentId: tournament.id,
          holeNumber,
          distanceFeet: situation.distanceFeet!,
          shotType,
          attributes: player.attributes,
          pressure,
        })
      : resolveShotStage({
          tournamentId: tournament.id,
          holeNumber,
          stageIndex,
          hole,
          shotType,
          attributes: player.attributes,
          windMph,
          pressure,
          greenReachAttempt: isGreenReachStage && situation.distanceYards !== null ? { distanceYards: situation.distanceYards } : undefined,
        });

  const safePreview = previewFor("safe");
  const attackPreview = previewFor("attack");

  function choose(shotType: ShotChoice) {
    const resolution = shotType === "safe" ? safePreview : attackPreview;
    let finalScore: number | null = null;
    if (stage.type === "putt") {
      const puttOutcome: StageOutcome = { type: "putt", shotType, success: resolution.success };
      finalScore = computeHoleScoreFromStages(stageOutcomes, puttOutcome);
    }
    setPending({ stage, shotType, resolution, finalScore });
  }

  function confirmAndAdvance() {
    if (!pending) return;
    const outcome: StageOutcome = { type: pending.stage.type, shotType: pending.shotType, success: pending.resolution.success };

    if (pending.stage.type !== "putt") {
      setStageOutcomes((prev) => [...prev, outcome]);
      setStageIndex((i) => i + 1);
      setPending(null);
      return;
    }

    const record: HoleOutcome = {
      holeNumber,
      par: hole.par,
      scoreToPar: pending.finalScore!,
      isPlayed: true,
      hadRecovery: stageOutcomes.some((o) => o.type === "recovery"),
    };
    setAllHoleOutcomes((prev) => [...prev, record]);
    setStageOutcomes([]);
    setStageIndex(0);
    setPending(null);
    setCommentaryFor(record); // currentHoleNumber only advances once this is dismissed
  }

  return (
    <div className="pa-screen" style={isMajor ? { background: m.screenBg, border: `4px solid ${m.screenBorder}` } : undefined}>
      <header
        className="pa-header"
        style={{
          flexDirection: "column",
          alignItems: "stretch",
          gap: 6,
          ...(isMajor ? { background: m.headerBg, borderBottom: `3px solid ${m.gold}` } : {}),
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="pa-title" style={isMajor ? { color: m.gold } : undefined}>HOLE {holeNumber}</div>
          <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "#8fd694", fontSize: 20 }}>
            PAR {hole.par} · {yardage} YDS
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.cream : "var(--pa-parchment)", fontSize: 20 }}>
            {projectedPosition ? `POS ${ordinal(projectedPosition)}` : "POS —"} · {scoreText(scoreSoFar)}
          </div>
          <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.underPar : "var(--pa-blue)", fontSize: 20 }}>
            WIND {windDirection} {windMph}
          </div>
        </div>
      </header>

      {stage.type === "putt" ? (
        <GreenScene distanceFeet={situation.distanceFeet!} />
      ) : (
        <HoleScene lie={situation.lie} distanceYards={situation.distanceYards!} courseType={course.courseType} />
      )}

      <div className="pa-content pa-section" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="pa-section-label" style={{ marginBottom: 0, ...(isMajor ? { color: m.gold } : {}) }}>
            {pending ? "RESULT" : stage.title}
          </div>
          <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.mutedDark : "var(--pa-muted-text)", fontSize: 15 }}>
            SHOT {stageIndex + 1}
          </div>
        </div>

        {!pending && (
          <>
            <button
              className="pa-option-card"
              onClick={() => choose("safe")}
              style={
                isMajor
                  ? ({
                      background: m.panelBg,
                      border: `4px solid ${m.safeGreen}`,
                      ["--pa-shadow-offset" as string]: "6px",
                      ["--pa-shadow-color" as string]: m.headerBg,
                    } as CSSProperties)
                  : undefined
              }
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="pa-title" style={{ fontSize: 15, color: isMajor ? m.cream : "var(--pa-ink)" }}>{displayStage.safeLabel}</div>
                <div
                  className="pa-chip pa-chip-safe"
                  style={isMajor ? { background: m.safeGreen, color: m.ink } : undefined}
                >
                  {safePreview.difficultyLabel}
                </div>
              </div>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-body-text)", fontSize: 17 }}>
                {displayStage.safeDescription}
              </div>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.mutedDark : "var(--pa-muted-text)", fontSize: 15 }}>
                Reward: {rewardLabelForShotType("safe")}
              </div>
            </button>

            <button
              className="pa-option-card pa-option-risky"
              onClick={() => choose("attack")}
              style={
                isMajor
                  ? ({
                      background: m.panelBg,
                      border: `4px solid ${m.riskyPink}`,
                      ["--pa-shadow-offset" as string]: "6px",
                      ["--pa-shadow-color" as string]: m.headerBg,
                    } as CSSProperties)
                  : undefined
              }
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="pa-title" style={{ fontSize: 15, color: isMajor ? m.cream : "var(--pa-ink)" }}>{displayStage.attackLabel}</div>
                <div
                  className="pa-chip pa-chip-risky"
                  style={isMajor ? { background: m.riskyPink, color: m.ink } : undefined}
                >
                  {attackPreview.difficultyLabel}
                </div>
              </div>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.muted : "var(--pa-body-text)", fontSize: 17 }}>
                {displayStage.attackDescription}
              </div>
              <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.mutedDark : "var(--pa-muted-text)", fontSize: 15 }}>
                Reward: {rewardLabelForShotType("attack")}
              </div>
            </button>
          </>
        )}

        {pending && (
          <div
            className="pa-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              paddingBottom: 16,
              ...(isMajor ? { background: m.rowBg, border: `3px solid ${m.gold}` } : {}),
            }}
          >
            <div className="pa-title" style={{ fontSize: 16, color: isMajor ? m.cream : "var(--pa-ink)", lineHeight: 1.4 }}>
              {resultHeadline(tournament.id, holeNumber, stageIndex, pending.stage.type, pending.shotType, pending.resolution.success)}
            </div>
            {pending.finalScore !== null && (
              <div style={{ fontFamily: "var(--pa-font-body)", fontSize: 20, color: isMajor ? m.muted : "var(--pa-muted-text)" }}>
                {scoreLabel(pending.finalScore)}
              </div>
            )}
            <button
              className="pa-cta"
              style={{
                width: "80%",
                margin: "6px auto 6px auto",
                padding: "12px",
                fontSize: 13,
                ...(isMajor
                  ? {
                      background: m.gold,
                      border: `4px solid ${m.gold}`,
                      color: m.ink,
                      ["--pa-shadow-offset" as string]: "6px",
                      ["--pa-shadow-color" as string]: m.ctaShadow,
                    }
                  : {}),
              }}
              onClick={confirmAndAdvance}
            >
              {pending.stage.type !== "putt" ? "NEXT SHOT" : "NEXT HOLE"}
            </button>
          </div>
        )}

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Composure only matters once pressure is actually in play (and it
              already factors into every shot's odds via the pressure penalty) —
              what the player picks here is Accuracy/Power for ball-striking, or
              Putting/Composure specifically for the putt. */}
          {(stage.type === "putt"
            ? (["putting", "composure"] as const)
            : (["accuracy", "power"] as const)
          ).map((attr) => (
            <div key={attr} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.cream : "var(--pa-ink)", fontSize: 16, textTransform: "uppercase" }}>
                  {attr}
                </div>
                <div style={{ fontFamily: "var(--pa-font-body)", color: isMajor ? m.cream : "var(--pa-ink)", fontSize: 16 }}>
                  {player.attributes[attr]} / 10
                </div>
              </div>
              <SegmentedBar value={player.attributes[attr]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
