#!/usr/bin/env python3
"""
Pelada – StatsBomb open-data ingest
Loads Women's World Cup 2023 (competition_id=72, season_id=107)
  + FIFA World Cup 2022 men's (competition_id=43, season_id=106) into Supabase.

Prerequisites:
  pip install statsbombpy supabase --break-system-packages

Run AFTER executing ingest/schema.sql in the Supabase SQL Editor.
"""

import json, math, os, warnings
from pathlib import Path
from urllib.request import urlopen
import pandas as pd
from statsbombpy import sb
from supabase import create_client, Client

warnings.filterwarnings("ignore")

# ── Credentials — read from .env.local or environment variables ───────────────
def _load_env():
    env_file = Path(__file__).parent.parent / ".env.local"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

_load_env()

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
SUPABASE_KEY = os.environ["VITE_SUPABASE_KEY"]

client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Competition IDs ───────────────────────────────────────────────────────────
WWC_COMP, WWC_SEASON = 72, 107   # Women's World Cup 2023
M22_COMP, M22_SEASON = 43, 106   # Men's World Cup 2022

SB360_URL = "https://raw.githubusercontent.com/statsbomb/open-data/master/data/three-sixty/{}.json"

BATCH = 500

KEEP_TYPES = {
    "Pass", "Shot", "Carry", "Pressure", "Dribble",
    "Ball Recovery", "Clearance", "Block", "Interception",
    "Foul Committed", "Foul Won", "Substitution",
    "Tactical Shift", "Starting XI", "Goal Keeper",
    "Miscontrol", "Duel",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe(v):
    if v is None:
        return None
    try:
        if isinstance(v, float) and math.isnan(v):
            return None
    except Exception:
        pass
    if pd.isnull(v) if not isinstance(v, (list, dict)) else False:
        return None
    return v

def _str(v):
    s = _safe(v)
    return str(s) if s is not None else ""

def _int(v):
    s = _safe(v)
    try:
        return int(s) if s is not None else 0
    except Exception:
        return 0

def _float(v):
    s = _safe(v)
    try:
        return float(s) if s is not None else None
    except Exception:
        return None

def _bool(v):
    return bool(v) if v is not None and not (isinstance(v, float) and math.isnan(v)) else False

def _int_opt(v):
    """Like _int but returns None instead of 0 for missing values (for nullable FK columns)."""
    s = _safe(v)
    if s is None:
        return None
    try:
        return int(float(s))
    except Exception:
        return None

def _lx(loc):
    try:
        arr = loc if isinstance(loc, list) else json.loads(str(loc))
        return float(arr[0]) if arr else None
    except Exception:
        return None

def _ly(loc):
    try:
        arr = loc if isinstance(loc, list) else json.loads(str(loc))
        return float(arr[1]) if arr and len(arr) > 1 else None
    except Exception:
        return None

def _lz(loc):
    try:
        arr = loc if isinstance(loc, list) else json.loads(str(loc))
        return float(arr[2]) if arr and len(arr) > 2 else None
    except Exception:
        return None

def _batched(table: str, rows: list, size: int = BATCH):
    total = len(rows)
    for i in range(0, total, size):
        chunk = rows[i : i + size]
        client.table(table).upsert(chunk).execute()
        pct = min(i + size, total)
        print(f"    {table}: {pct}/{total}")


# ── WWC 2023: Matches ─────────────────────────────────────────────────────────

def ingest_wwc_matches(df) -> list[int]:
    rows = []
    for _, m in df.iterrows():
        rows.append({
            "match_id":          int(m["match_id"]),
            "match_date":        str(m["match_date"]),
            "kick_off":          str(m.get("kick_off", "00:00:00") or "00:00:00")[:8],
            "home_team":         _str(m["home_team"]),
            "away_team":         _str(m["away_team"]),
            "home_score":        _int(m.get("home_score", 0)),
            "away_score":        _int(m.get("away_score", 0)),
            "competition_stage": _str(m.get("competition_stage")),
            "match_week":        _int(m.get("match_week", 0)),
            "stadium":           _str(m.get("stadium")),
            "stadium_country":   _str(m.get("stadium_country_name")),
            "home_group":        _str(m.get("home_team_group")),
            "away_group":        _str(m.get("away_team_group")),
            "home_manager":      _str(m.get("home_manager_name")),
            "away_manager":      _str(m.get("away_manager_name")),
            "has_360":           _str(m.get("match_status_360")) == "available",
        })
    _batched("wwc2023_matches", rows)
    return [r["match_id"] for r in rows]


# ── WWC 2023: Lineups ─────────────────────────────────────────────────────────

def ingest_wwc_lineups(match_id: int):
    try:
        lineups = sb.lineups(match_id=match_id)
    except Exception as e:
        print(f"    lineups error: {e}")
        return
    rows = []
    for team_name, lu in lineups.items():
        for _, p in lu.iterrows():
            positions = p.get("positions") or []
            pos = positions[0].get("position", "") if positions else ""
            pos_id = positions[0].get("position_id", 0) if positions else 0
            country_raw = p.get("country", {})
            country = country_raw.get("name", "") if isinstance(country_raw, dict) else ""
            # starter if first position has no 'from' (played from kickoff)
            is_starter = True
            if positions and positions[0].get("from") is not None:
                is_starter = False
            rows.append({
                "match_id":       match_id,
                "team":           team_name,
                "player_id":      _int(p.get("player_id")),
                "player_name":    _str(p["player_name"]),
                "player_nickname":_str(p.get("player_nickname")),
                "jersey_number":  _int(p.get("jersey_number")),
                "position":       str(pos),
                "position_id":    _int(pos_id),
                "country":        country,
                "is_starter":     is_starter,
            })
    if rows:
        client.table("wwc2023_lineups").upsert(rows).execute()


# ── WWC 2023: Events ──────────────────────────────────────────────────────────

def ingest_wwc_events(match_id: int) -> pd.DataFrame:
    try:
        events = sb.events(match_id=match_id, split=False, flatten_attrs=True)
    except Exception as e:
        print(f"    events error: {e}")
        return pd.DataFrame()
    events = events[events["type"].isin(KEEP_TYPES)].copy()
    rows = []
    for _, e in events.iterrows():
        loc  = e.get("location")
        ploc = e.get("pass_end_location")
        sloc = e.get("shot_end_location")
        cloc = e.get("carry_end_location")
        pass_outcome_raw = _safe(e.get("pass_outcome"))
        # In StatsBomb, None outcome on a Pass = successful
        pass_complete = (pass_outcome_raw is None or pass_outcome_raw == "")
        # key pass = directly assisted a shot
        kp = e.get("pass_shot_assist")
        rows.append({
            "event_id":        str(e["id"]),
            "match_id":        match_id,
            "idx":             _int(e.get("index")),
            "period":          _int(e.get("period")),
            "minute":          _int(e.get("minute")),
            "second":          _int(e.get("second")),
            "type":            _str(e.get("type")),
            "team":            _str(e.get("team")),
            "player":          _str(e.get("player")),
            "player_id":       _int_opt(e.get("player_id")),
            "position":        _str(e.get("position")),
            "x":               _lx(loc),
            "y":               _ly(loc),
            "under_pressure":  _bool(e.get("under_pressure")),
            "possession_team": _str(e.get("possession_team")),
            "play_pattern":    _str(e.get("play_pattern")),
            # Shot
            "shot_xg":         _float(e.get("shot_statsbomb_xg")),
            "shot_outcome":    _str(e.get("shot_outcome")),
            "shot_technique":  _str(e.get("shot_technique")),
            "shot_body_part":  _str(e.get("shot_body_part")),
            "shot_end_x":      _lx(sloc),
            "shot_end_y":      _ly(sloc),
            "shot_end_z":      _lz(sloc),
            # Pass
            "pass_length":     _float(e.get("pass_length")),
            "pass_angle":      _float(e.get("pass_angle")),
            "pass_outcome":    _str(e.get("pass_outcome")),
            "pass_recipient":  _str(e.get("pass_recipient")),
            "pass_end_x":      _lx(ploc),
            "pass_end_y":      _ly(ploc),
            "pass_height":     _str(e.get("pass_height")),
            "pass_switch":     _bool(e.get("pass_switch")),
            "pass_cross":      _bool(e.get("pass_cross")),
            "pass_through_ball":_bool(e.get("pass_through_ball")),
            "pass_shot_assist": _bool(kp),
            "pass_key_pass":   pass_complete and _bool(kp),
            # Carry
            "carry_end_x":     _lx(cloc),
            "carry_end_y":     _ly(cloc),
            # Dribble
            "dribble_outcome": _str(e.get("dribble_outcome")),
            # Misc
            "counterpress":    _bool(e.get("counterpress")),
            "duration":        _float(e.get("duration")),
        })
    _batched("wwc2023_events", rows)
    return events


# ── WWC 2023: 360 (shots only) ────────────────────────────────────────────────

def ingest_wwc_360(match_id: int, events: pd.DataFrame):
    if events.empty:
        return
    try:
        with urlopen(SB360_URL.format(match_id)) as r:
            frames = json.loads(r.read())
    except Exception:
        return
    frame_map = {f["event_uuid"]: f for f in frames}
    shots = events[events["type"] == "Shot"]
    rows = []
    for _, s in shots.iterrows():
        eid = str(s["id"])
        if eid not in frame_map:
            continue
        f = frame_map[eid]
        rows.append({
            "event_id":    eid,
            "match_id":    match_id,
            "visible_area": json.dumps(f.get("visible_area", [])),
            "freeze_frame": json.dumps(f.get("freeze_frame", [])),
        })
    if rows:
        client.table("wwc2023_threesixty").upsert(rows).execute()


# ── WWC 2023: Player stats (per match) ───────────────────────────────────────

def ingest_wwc_player_stats(match_id: int, events: pd.DataFrame):
    if events.empty:
        return
    stats: dict[str, dict] = {}

    def _get(player, team, pid):
        if player not in stats:
            stats[player] = {
                "match_id": match_id, "player_name": player,
                "player_id": pid, "team": team,
                "passes": 0, "passes_complete": 0,
                "shots": 0, "shots_on_target": 0, "goals": 0, "xg": 0.0,
                "assists": 0, "key_passes": 0,
                "pressures": 0, "carries": 0,
                "dribbles": 0, "dribbles_complete": 0,
                "blocks": 0, "interceptions": 0, "clearances": 0,
                "fouls_committed": 0, "fouls_won": 0,
                "yellow_cards": 0, "red_cards": 0,
                "minutes_played": 90.0,
            }
        return stats[player]

    for _, e in events.iterrows():
        player = _str(e.get("player"))
        team   = _str(e.get("team"))
        pid    = _int_opt(e.get("player_id"))
        etype  = _str(e.get("type"))
        if not player:
            continue
        s = _get(player, team, pid)
        if pid and not s["player_id"]:
            s["player_id"] = pid

        if etype == "Pass":
            s["passes"] += 1
            outcome = _safe(e.get("pass_outcome"))
            if outcome is None or str(outcome) in ("", "nan"):
                s["passes_complete"] += 1
            if _bool(e.get("pass_shot_assist")):
                s["assists"] += 1
            if _bool(e.get("pass_shot_assist")):
                s["key_passes"] += 1
        elif etype == "Shot":
            s["shots"] += 1
            xg = _float(e.get("shot_statsbomb_xg"))
            if xg: s["xg"] += xg
            outcome = _str(e.get("shot_outcome"))
            if outcome in ("Saved", "Goal", "Saved Off Target", "Saved to Post"):
                s["shots_on_target"] += 1
            if outcome == "Goal":
                s["goals"] += 1
        elif etype == "Carry":
            s["carries"] += 1
        elif etype == "Pressure":
            s["pressures"] += 1
        elif etype == "Dribble":
            s["dribbles"] += 1
            if _str(e.get("dribble_outcome")) == "Complete":
                s["dribbles_complete"] += 1
        elif etype == "Block":
            s["blocks"] += 1
        elif etype == "Interception":
            s["interceptions"] += 1
        elif etype == "Clearance":
            s["clearances"] += 1
        elif etype == "Foul Committed":
            s["fouls_committed"] += 1
            card = _str(e.get("foul_committed_card"))
            if "Yellow" in card: s["yellow_cards"] += 1
            if "Red" in card:    s["red_cards"] += 1
        elif etype == "Foul Won":
            s["fouls_won"] += 1

    rows = list(stats.values())
    if rows:
        _batched("wwc2023_player_stats", rows)


# ── Men's WC 2022 ─────────────────────────────────────────────────────────────

def ingest_m22_matches(df) -> list[int]:
    rows = []
    for _, m in df.iterrows():
        rows.append({
            "match_id":          int(m["match_id"]),
            "match_date":        str(m["match_date"]),
            "home_team":         _str(m["home_team"]),
            "away_team":         _str(m["away_team"]),
            "home_score":        _int(m.get("home_score", 0)),
            "away_score":        _int(m.get("away_score", 0)),
            "competition_stage": _str(m.get("competition_stage")),
            "match_week":        _int(m.get("match_week", 0)),
            "stadium":           _str(m.get("stadium")),
        })
    _batched("wc2022m_matches", rows)
    return [r["match_id"] for r in rows]


def ingest_m22_lineups(match_id: int):
    try:
        lineups = sb.lineups(match_id=match_id)
    except Exception:
        return
    rows = []
    for team_name, lu in lineups.items():
        for _, p in lu.iterrows():
            positions = p.get("positions") or []
            pos = positions[0].get("position", "") if positions else ""
            country_raw = p.get("country", {})
            country = country_raw.get("name", "") if isinstance(country_raw, dict) else ""
            rows.append({
                "match_id":        match_id,
                "team":            team_name,
                "player_id":       _int(p.get("player_id")),
                "player_name":     _str(p["player_name"]),
                "player_nickname": _str(p.get("player_nickname")),
                "jersey_number":   _int(p.get("jersey_number")),
                "position":        str(pos),
                "country":         country,
                "is_starter":      True,
            })
    if rows:
        client.table("wc2022m_lineups").upsert(rows).execute()


def ingest_m22_player_stats(df):
    """Tournament-aggregated player stats across all men's 2022 WC matches."""
    agg: dict[int, dict] = {}  # player_id → stats

    def _get(pid, name, nickname, team, pos):
        if pid not in agg:
            agg[pid] = {
                "player_id": pid, "player_name": name,
                "player_nickname": nickname,
                "team": team, "position": pos,
                "matches_played": 0, "minutes_played": 0.0,
                "goals": 0, "xg": 0.0, "assists": 0, "key_passes": 0,
                "passes": 0, "passes_complete": 0,
                "shots": 0, "shots_on_target": 0,
                "pressures": 0, "dribbles_complete": 0,
            }
        return agg[pid]

    for _, m in df.iterrows():
        mid = int(m["match_id"])
        print(f"    m22 events {mid}: {m['home_team']} vs {m['away_team']}")
        try:
            events = sb.events(match_id=mid, split=False, flatten_attrs=True)
        except Exception:
            continue
        events = events[events["type"].isin(KEEP_TYPES)]
        seen: set[int] = set()
        for _, e in events.iterrows():
            player = _str(e.get("player"))
            pid = _int_opt(e.get("player_id"))
            team = _str(e.get("team"))
            pos  = _str(e.get("position"))
            etype = _str(e.get("type"))
            if not player or not pid:
                continue

            # nickname from lineup data is not in events, leave blank
            s = _get(pid, player, "", team, pos)
            if pid not in seen:
                s["matches_played"] += 1
                s["minutes_played"] += 90.0
                seen.add(pid)

            if etype == "Pass":
                s["passes"] += 1
                outcome = _safe(e.get("pass_outcome"))
                if outcome is None or str(outcome) in ("", "nan"):
                    s["passes_complete"] += 1
                if _bool(e.get("pass_shot_assist")):
                    s["assists"] += 1
                    s["key_passes"] += 1
            elif etype == "Shot":
                s["shots"] += 1
                xg = _float(e.get("shot_statsbomb_xg"))
                if xg: s["xg"] += xg
                outcome = _str(e.get("shot_outcome"))
                if outcome in ("Saved", "Goal", "Saved Off Target", "Saved to Post"):
                    s["shots_on_target"] += 1
                if outcome == "Goal":
                    s["goals"] += 1
            elif etype == "Pressure":
                s["pressures"] += 1
            elif etype == "Dribble":
                if _str(e.get("dribble_outcome")) == "Complete":
                    s["dribbles_complete"] += 1

    rows = list(agg.values())
    _batched("wc2022m_player_stats", rows)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Pelada Ingest — WWC 2023 (women) + WC 2022 (men)")
    print("=" * 60)

    # ── Women's World Cup 2023 ────────────────────────────────
    print("\n[1/7] Fetching WWC 2023 matches...")
    wwc_df = sb.matches(competition_id=WWC_COMP, season_id=WWC_SEASON)
    wwc_df = wwc_df.sort_values("match_date").reset_index(drop=True)
    print(f"  {len(wwc_df)} matches")

    print("\n[2/7] Inserting WWC 2023 matches...")
    match_ids = ingest_wwc_matches(wwc_df)

    print(f"\n[3/7] Lineups + events + 360 + player stats ({len(match_ids)} matches)...")
    for i, mid in enumerate(match_ids):
        row = wwc_df[wwc_df["match_id"] == mid].iloc[0]
        print(f"  ({i+1}/{len(match_ids)}) {mid}: {row['home_team']} vs {row['away_team']}")
        ingest_wwc_lineups(mid)
        events = ingest_wwc_events(mid)
        ingest_wwc_360(mid, events)
        ingest_wwc_player_stats(mid, events)

    # ── Men's World Cup 2022 ──────────────────────────────────
    print("\n[4/7] Fetching Men's WC 2022 matches...")
    m22_df = sb.matches(competition_id=M22_COMP, season_id=M22_SEASON)
    m22_df = m22_df.sort_values("match_date").reset_index(drop=True)
    print(f"  {len(m22_df)} matches")

    print("\n[5/7] Inserting Men's WC 2022 matches...")
    ingest_m22_matches(m22_df)

    print(f"\n[6/7] Men's WC 2022 lineups ({len(m22_df)} matches)...")
    for i, (_, m) in enumerate(m22_df.iterrows()):
        mid = int(m["match_id"])
        print(f"  ({i+1}/{len(m22_df)}) {mid}: {m['home_team']} vs {m['away_team']}")
        ingest_m22_lineups(mid)

    print("\n[7/7] Men's WC 2022 tournament player stats (reads all events — slowest step)...")
    ingest_m22_player_stats(m22_df)

    print("\n✅  Ingest complete!")


if __name__ == "__main__":
    main()
