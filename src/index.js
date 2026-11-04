#!/usr/bin/env node

/**
 * Touchline Wire MCP Server
 * Model Context Protocol (MCP) server providing real-time Premier League tactical intelligence,
 * verified starting XIs, in-game match reports, injury telemetry, and standings.
 * 
 * Data Source: https://touchlinewire.com
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = "https://touchlinewire.com/api/v1";

const server = new McpServer({
  name: "touchlinewire-mcp",
  version: "1.2.1"
});

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

// Helper for fetching from Touchline Wire API
async function fetchTouchline(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "TouchlineWire-MCP/1.2.1",
        "Accept": "application/json"
      }
    });
    if (!res.ok) {
      throw new Error(`API returned HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    throw new Error(`Failed to fetch from ${url}: ${err.message}`);
  }
}

// 1. Premier League Table & Standings
server.tool(
  "get_premier_league_table",
  "Retrieve the official 20-club Premier League standings including points, matches played, goal difference, goals scored/conceded, and 5-match form guide.",
  READ_ONLY_ANNOTATIONS,
  async () => {
    const data = await fetchTouchline("/table");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// 2. Club Predicted Tactical Lineup
server.tool(
  "get_predicted_lineup",
  "Get the verified predicted tactical Starting 11, formation, starting player names and positions, bench options, and AI Tactical Confidence rating for a Premier League club ahead of kickoff.",
  {
    club: z.string().describe("Club name or slug (e.g. 'arsenal', 'liverpool', 'chelsea', 'man-city', 'spurs', 'aston-villa')")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ club }) => {
    const cleanClub = club.toLowerCase().trim().replace(/\s+/g, "-");
    const data = await fetchTouchline(`/lineups/${encodeURIComponent(cleanClub)}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// 3. All 20 Premier League Lineups
server.tool(
  "get_all_lineups",
  "Retrieve the complete slate of all 20 Premier League predicted formations, starting XIs, and tactical confidence scores for the current gameweek.",
  READ_ONLY_ANNOTATIONS,
  async () => {
    const data = await fetchTouchline("/lineups");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// 4. Squad Injuries & Availability Telemetry
server.tool(
  "get_injuries",
  "Retrieve live Premier League injury telemetry, medical room updates, chance of playing percentages, and press conference manager quotes. Can optionally be filtered by club.",
  {
    club: z.string().optional().describe("Optional club name or slug to filter injuries (e.g. 'arsenal', 'chelsea')")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ club }) => {
    const endpoint = club
      ? `/injuries?club=${encodeURIComponent(club.toLowerCase().trim())}`
      : "/injuries";
    const data = await fetchTouchline(endpoint);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// 5. Matchday Fixtures & Schedule
server.tool(
  "get_fixtures",
  "List Premier League matchday calendar fixtures with local kickoff ISO dates, gameweek numbers, and home/away pairings. Can filter by gameweek number and/or club.",
  {
    gameweek: z.number().int().optional().describe("Optional specific gameweek number (e.g. 7, 8)"),
    club: z.string().optional().describe("Optional club name to filter fixtures (e.g. 'liverpool')")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ gameweek, club }) => {
    const params = new URLSearchParams();
    if (gameweek !== undefined) params.set("gameweek", gameweek.toString());
    if (club) params.set("club", club.toLowerCase().trim());
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await fetchTouchline(`/fixtures${query}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// 6. Premier League Clubs Directory
server.tool(
  "get_clubs",
  "List all 20 Premier League clubs with official managers, stadium names, capacities, primary club colors, and designated set-piece specialists (corners, free kicks, penalties).",
  READ_ONLY_ANNOTATIONS,
  async () => {
    const data = await fetchTouchline("/clubs");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// 7. Tactical Match Reports & In-Game Events
server.tool(
  "get_match_report",
  "Retrieve comprehensive tactical match reports with official starting lineups, chronological event timelines (goals, cards, substitutions), xG, possession, and Touchline Wire lineup forecast accuracy.",
  {
    fixture_id: z.number().int().optional().describe("Official match fixture ID (e.g. 1557417)"),
    club: z.string().optional().describe("Club name or slug to get the latest match for (e.g. 'arsenal', 'chelsea')"),
    latest: z.boolean().optional().describe("Set to true to get the latest match across the entire Premier League")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ fixture_id, club, latest }) => {
    let endpoint = "/matches/latest";
    if (fixture_id !== undefined) {
      endpoint = `/matches/${fixture_id}`;
    } else if (club) {
      const cleanClub = club.toLowerCase().trim().replace(/\s+/g, "-");
      endpoint = `/matches/${encodeURIComponent(cleanClub)}/latest`;
    }
    const data = await fetchTouchline(endpoint);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// 8. Set-Piece Takers (Penalties, Free-Kicks, Corners)
server.tool(
  "get_set_piece_takers",
  "Retrieve the authoritative hierarchy of set-piece specialists for Premier League clubs: primary and backup penalty takers, direct free-kick takers, and corner specialists ordered by manager priority.",
  {
    club: z.string().optional().describe("Optional Premier League club name or slug (e.g. 'arsenal', 'chelsea', 'liverpool'). If omitted, returns all 20 clubs.")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ club }) => {
    let endpoint = "/set-pieces";
    if (club) {
      const cleanClub = club.toLowerCase().trim().replace(/\s+/g, "-");
      endpoint = `/set-pieces/${encodeURIComponent(cleanClub)}`;
    }
    const data = await fetchTouchline(endpoint);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// 9. Fixture Difficulty Rankings (FDR Schedule)
server.tool(
  "get_fixture_difficulty",
  "Retrieve upcoming Fixture Difficulty Ratings (FDR) ranking Premier League clubs by easiest to toughest schedule over upcoming matches (3 to 10 fixtures) with home/away difficulty tags (1=easiest, 5=hardest).",
  {
    window: z.number().int().min(1).max(10).optional().describe("Number of upcoming matches to analyze (default: 5)"),
    sort: z.enum(["easiest", "hardest"]).optional().describe("Sort ordering of ranked clubs (default: 'easiest')"),
    club: z.string().optional().describe("Filter schedule difficulty to a single club (e.g. 'arsenal')")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ window = 5, sort = "easiest", club }) => {
    let endpoint = `/schedule/difficulty?window=${window}&sort=${sort}`;
    if (club) {
      const cleanClub = club.toLowerCase().trim().replace(/\s+/g, "-");
      endpoint = `/schedule/difficulty/${encodeURIComponent(cleanClub)}?window=${window}`;
    }
    const data = await fetchTouchline(endpoint);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// 10. Tactical Match Preview & Formations Clash
server.tool(
  "get_match_preview",
  "Retrieve pre-match tactical dossiers for upcoming fixtures: predicted formation clash (e.g. 4-3-3 vs 5-4-1), manager tactical records, expected starter matchups, medical availability, and 5-game form guide.",
  {
    home_club: z.string().describe("Home club name or slug (e.g. 'arsenal', 'liverpool', 'man-city')"),
    away_club: z.string().describe("Away club name or slug (e.g. 'chelsea', 'spurs', 'aston-villa')")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ home_club, away_club }) => {
    const cleanHome = home_club.toLowerCase().trim().replace(/\s+/g, "-");
    const cleanAway = away_club.toLowerCase().trim().replace(/\s+/g, "-");
    const endpoint = `/matches/${encodeURIComponent(cleanHome)}-vs-${encodeURIComponent(cleanAway)}/preview`;
    const data = await fetchTouchline(endpoint);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }
);

// 11. FPL Gameweek Scout Briefing (Captains, Differentials, Budget Value & Bandwagon Traps)
server.tool(
  "get_fpl_gameweek_briefing",
  "Retrieve the live 2026/27 Fantasy Premier League (FPL) Gameweek Scout Briefing: top captaincy picks, RoboKlopp expected minutes (Start %), sub-10% differentials, <=£6.5m budget enablers, Gameweek transfer momentum, and injury/4-yellow-card bandwagon trap warnings.",
  {
    gameweek: z.number().int().min(1).max(38).optional().describe("Optional Gameweek number (1-38). Defaults to the active upcoming Gameweek.")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ gameweek }) => {
    const query = gameweek !== undefined ? `?gameweek=${gameweek}` : "";
    const data = await fetchTouchline(`/fpl/overview${query}`);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
);

// 12. Filtered FPL Picks (Differentials, Value, Captains, Expected Minutes)
server.tool(
  "get_fpl_picks",
  "Filter 2026/27 FPL player recommendations by mode ('differentials', 'value', 'captains', 'xmins'), club slug, position ('GK', 'DEF', 'MID', 'FWD'), max price (£m), and max ownership (%).",
  {
    mode: z.enum(["differentials", "value", "captains", "xmins"]).optional().describe("Scout mode (default: 'differentials')"),
    club: z.string().optional().describe("Optional club slug or short code (e.g. 'arsenal', 'liverpool', 'man-city')"),
    position: z.enum(["GK", "DEF", "MID", "FWD"]).optional().describe("Optional FPL position filter"),
    max_price: z.number().optional().describe("Optional maximum price in £m (e.g. 6.5)"),
    max_ownership: z.number().optional().describe("Optional maximum TSB % ownership (e.g. 10.0)")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ mode, club, position, max_price, max_ownership }) => {
    const params = new URLSearchParams();
    if (mode) params.set("mode", mode);
    if (club) params.set("club", club.toLowerCase().trim());
    if (position) params.set("position", position);
    if (max_price !== undefined) params.set("max_price", String(max_price));
    if (max_ownership !== undefined) params.set("max_ownership", String(max_ownership));
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await fetchTouchline(`/fpl/picks${query}`);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
);

// 13. Live FPL Transfer Trends & Bandwagon Trap Watch
server.tool(
  "get_fpl_transfer_trends",
  "Retrieve live 2026/27 FPL Gameweek transfer momentum: most transferred-in players, most transferred-out players, price risers/fallers, and Bandwagon Trap warnings for injured, doubtful, or 4-yellow-card tightrope assets.",
  {
    limit: z.number().int().min(1).max(50).optional().describe("Number of rows per category (default: 15)")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ limit }) => {
    const query = limit !== undefined ? `?limit=${limit}` : "";
    const data = await fetchTouchline(`/fpl/transfers${query}`);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
);

// 14. Audit 15-Man FPL Squad or Transfer Shortlist
server.tool(
  "audit_fpl_players",
  "Audit a list of FPL player names (e.g. a user's 15-man squad or transfer shortlist) for RoboKlopp expected minutes (Start %), next fixture FDR, injury/doubt flags, 4-yellow-card suspension tightrope risk, set-piece duties, and expected points (ep_next).",
  {
    players: z.array(z.string()).min(1).describe("List of player names to audit (e.g. ['Haaland', 'Saka', 'Palmer', 'Isak'])")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ players }) => {
    const payload = await fetchTouchline("/fpl/picks?mode=xmins&limit=650");
    const pool = Array.isArray(payload?.data) ? payload.data : [];
    const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const results = players.map((rawQuery) => {
      const q = norm(rawQuery);
      const match =
        pool.find((p) => norm(p.web_name) === q || norm(p.name) === q) ||
        pool.find((p) => norm(p.name).includes(q) || norm(p.web_name).includes(q));
      if (!match) {
        return { query: rawQuery, matched: false, note: "No 2026/27 Premier League player matched query." };
      }
      return { query: rawQuery, matched: true, ...match };
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              season: "2026/27",
              gameweek: payload?.meta?.gameweek ?? null,
              audited_count: results.length,
              results
            },
            null,
            2
          )
        }
      ]
    };
  }
);

// 15. PGMOL Select Group 1 Referee Dossiers
server.tool(
  "get_referees",
  "Retrieve 2026/27 PGMOL Select Group 1 Premier League referee statistical dossiers (yellow/red cards per match, fouls, penalty rate, strictness index, and club disciplinary bias).",
  {
    referee: z.string().optional().describe("Optional referee slug (e.g. 'michael-oliver', 'anthony-taylor')")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ referee }) => {
    const endpoint = referee
      ? `/referees/${encodeURIComponent(referee.toLowerCase().trim().replace(/\s+/g, "-"))}`
      : "/referees";
    const data = await fetchTouchline(endpoint);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
);

// 16. 2026/27 Premier League Transfer Rumours & Tier Credibility Wire
server.tool(
  "get_transfer_rumours",
  "Retrieve 2026/27 Premier League transfer rumours rated Tier 1-4 by source reliability, enriched with club positional depth needs and incumbent starter benchmarks.",
  {
    club: z.string().optional().describe("Optional club slug (e.g. 'arsenal', 'liverpool', 'spurs')")
  },
  READ_ONLY_ANNOTATIONS,
  async ({ club }) => {
    const query = club ? `?club=${encodeURIComponent(club.toLowerCase().trim())}` : "";
    const data = await fetchTouchline(`/rumours${query}`);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
);

// Built-in FPL MCP Prompts
server.prompt(
  "fpl_gameweek_briefing",
  "Generate a data-backed 2026/27 FPL Gameweek captaincy, differential, and transfer briefing.",
  {
    gameweek: z.string().optional().describe("Optional Gameweek number (1-38)")
  },
  async ({ gameweek }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Call get_fpl_gameweek_briefing${gameweek ? ` (gameweek=${gameweek})` : ""} and get_fpl_transfer_trends to produce a concise 2026/27 FPL briefing: top 3 captains, top 3 sub-10% differentials, top <=£6.5m budget enablers, and bandwagon traps to avoid.`
        }
      }
    ]
  })
);

server.prompt(
  "fpl_team_doctor",
  "Audit an FPL manager's squad for RoboKlopp expected minutes, injury doubts, 4-yellow-card tightropes, and optimal transfers.",
  {
    squad: z.string().describe("Comma-separated list of player names in the FPL squad")
  },
  async ({ squad }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Call audit_fpl_players for [${squad}] and get_fpl_transfer_trends, then diagnose expected minutes risks, injury doubts, 4-yellow-card tightropes, best captain/vice-captain, and top 2 transfer upgrades.`
        }
      }
    ]
  })
);

// Start server on standard I/O transport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((err) => {
  console.error("Fatal error in Touchline Wire MCP Server:", err);
  process.exit(1);
});
