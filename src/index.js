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
  version: "1.0.0"
});

// Helper for fetching from Touchline Wire API
async function fetchTouchline(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "TouchlineWire-MCP/1.0",
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
  {},
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
  {},
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
  {},
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

// Start server on standard I/O transport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((err) => {
  console.error("Fatal error in Touchline Wire MCP Server:", err);
  process.exit(1);
});
