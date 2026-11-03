# Touchline Wire FPL & Premier League MCP Server ⚽

[![Steven-Robinson/touchlinewire-mcp MCP server](https://glama.ai/mcp/servers/Steven-Robinson/touchlinewire-mcp/badges/score.svg)](https://glama.ai/mcp/servers/Steven-Robinson/touchlinewire-mcp)

> **Zero-authentication Model Context Protocol (MCP) server** providing live **2026/27 Fantasy Premier League (FPL)** expected minutes (`Start %`), Gameweek captaincy picks, `<10%` differentials, `≤£6.5m` budget value enablers, live transfer momentum & bandwagon traps, plus **RoboKlopp predicted Starting XIs**, medical injury wires, PGMOL referee dossiers, match reports, and standings.

Powered by [Touchline Wire](https://touchlinewire.com/fpl) ([Ouroborean Software Ltd](https://ouroborean.co.uk/)). **Zero API keys or sign-ups required.** Available as both a **zero-install Remote HTTP endpoint (`https://touchlinewire.com/mcp`)** and a **local `stdio` npm package (`npx -y touchlinewire-mcp`)**.

📖 **Documentation & Quickstart Guide**: [steven-robinson.github.io/touchlinewire-mcp](https://steven-robinson.github.io/touchlinewire-mcp/) | [Interactive REST API & OpenAPI 3.0 Docs](https://touchlinewire.com/docs)

---

## ⚡ Quickstart

### Option 1: Zero-Install Remote HTTP MCP (`https://touchlinewire.com/mcp`)

Connect directly over Streamable HTTP (`MCP 2025-03-26`) with zero local runtime:

```bash
# Claude Code CLI
claude mcp add --transport http touchlinewire https://touchlinewire.com/mcp
```

Or in `.cursor/mcp.json` / `vscode` / `mcp.json`:
```json
{
  "mcpServers": {
    "touchlinewire": {
      "url": "https://touchlinewire.com/mcp"
    }
  }
}
```

### Option 2: Local `stdio` Package (`npx -y touchlinewire-mcp`)

Add to `claude_desktop_config.json`, Cursor, Gemini CLI, or Antigravity:

```json
{
  "mcpServers": {
    "touchlinewire": {
      "command": "npx",
      "args": ["-y", "touchlinewire-mcp"]
    }
  }
}
```

---

## 🌟 Available Tools (16)

| Tool Name | Description | Key Arguments |
| :--- | :--- | :--- |
| `get_fpl_gameweek_briefing` | Complete 2026/27 FPL Gameweek Scout Briefing: captains, RoboKlopp `Start %`, sub-10% differentials, `≤£6.5m` value & bandwagon traps. | `gameweek` (optional `1-38`) |
| `get_fpl_picks` | Filter 2026/27 FPL player picks by scout mode, club, position, max price (`£m`), and max ownership (`%`). | `mode` (`differentials`/`value`/`captains`/`xmins`), `club`, `position`, `max_price`, `max_ownership` |
| `get_fpl_transfer_trends` | Live Gameweek transfers in/out, price risers/fallers, and Bandwagon Trap alerts (injuries, doubts, `4 YC` tightrope). | `limit` (optional) |
| `audit_fpl_players` | Audit a 15-man FPL squad or transfer shortlist for RoboKlopp `Start %`, `ep_next`, fixture FDR, set-piece duty, and suspension risk. | `players` (`string[]`) |
| `get_predicted_lineup` | Verified RoboKlopp predicted Starting 11, formation, bench, and AI Tactical Confidence rating for a club. | `club` (e.g. `"arsenal"`, `"liverpool"`) |
| `get_all_lineups` | Complete slate of all 20 predicted Starting 11s and tactical formations for the upcoming Gameweek. | None |
| `get_injuries` | Live Premier League injury wire, medical recovery status, chance of playing %, and press conference quotes. | `club` (optional) |
| `get_set_piece_takers` | Hierarchy of set-piece specialists: primary/backup penalties, direct free-kicks, and corners across all 20 clubs. | `club` (optional) |
| `get_fixture_difficulty` | Upcoming Fixture Difficulty Ratings (FDR 1–5) ranking all 20 clubs easiest to hardest (next 3–10 matches). | `window` (default `5`), `sort` (`easiest`/`hardest`), `club` (optional) |
| `get_premier_league_table` | Official 2026/27 20-club Premier League standings, points, goal difference, and 5-match form guide. | None |
| `get_fixtures` | Upcoming Premier League matchday calendar with kickoff ISO dates and home/away pairings. | `gameweek` (optional), `club` (optional) |
| `get_clubs` | Complete directory of all 20 clubs: 2026/27 managers, stadiums, primary colors, and capacities. | None |
| `get_match_preview` | Pre-match tactical preview: predicted formation clash, manager H2H, and form guide. | `home_club`, `away_club` |
| `get_match_report` | Post-match tactical reports: confirmed lineups, chronological event timeline, xG, and possession stats. | `fixture_id` (optional), `club` (optional), `latest` (optional) |
| `get_referees` | PGMOL Select Group 1 referee statistical dossiers: yellow/red cards/match, fouls, penalty rate, and club bias. | `referee` (optional) |
| `get_transfer_rumours` | Tier 1–4 rated Premier League transfer rumours with club positional depth needs. | `club` (optional) |

---

## 💡 Example FPL & Tactical Prompts

* *"Audit my FPL squad [Haaland, Saka, Palmer, Isak, Gabriel, Raya] for expected minutes, 4-yellow-card tightropes, and best GW10 captain."*
* *"Give me the top 5 nailed FPL differentials under 10% ownership and under £6.5m with set-piece duties."*
* *"Which most-transferred-in FPL players this Gameweek are injury or suspension bandwagon traps?"*
* *"Who is predicted to start for Arsenal and Liverpool this weekend, and who is on penalties?"*

---

## 📄 License & Attribution

Data provided live by [Touchline Wire](https://touchlinewire.com).
Licensed under MIT. Free for personal, commercial, research, and agentic workflows with attribution.
