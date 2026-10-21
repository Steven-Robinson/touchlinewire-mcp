# Touchline Wire MCP Server ⚽

> **Model Context Protocol (MCP)** server providing real-time Premier League tactical intelligence, verified predicted starting XIs, in-game match reports, injury telemetry, and live standings to AI assistants.

Powered by [Touchline Wire](https://touchlinewire.com). Zero API keys required.

---

## 🌟 Available Tools

| Tool Name | Description | Key Arguments |
| :--- | :--- | :--- |
| `get_premier_league_table` | Official 20-club Premier League standings, points, goal difference, and 5-match form guide. | None |
| `get_predicted_lineup` | Verified predicted Starting 11, formation, bench, and AI Tactical Confidence rating for a club. | `club` (e.g. `"arsenal"`, `"liverpool"`) |
| `get_all_lineups` | Complete slate of all 20 predicted Starting 11s and tactical formations for the upcoming gameweek. | None |
| `get_injuries` | Live Premier League injury wire, medical recovery status, chance of playing %, and press conference quotes. | `club` (optional) |
| `get_fixtures` | Upcoming Premier League matchday calendar with local kickoff ISO dates and home/away pairings. | `gameweek` (optional), `club` (optional) |
| `get_clubs` | Complete directory of all 20 clubs: managers, stadiums, primary colors, and stadium capacities. | None |
| `get_match_report` | In-depth tactical match reports: official lineups, chronological match event timeline, xG, and possession stats. | `fixture_id` (optional), `club` (optional), `latest` (optional) |
| `get_set_piece_takers` | Hierarchy of set-piece specialists: primary/backup penalties, direct free-kicks, and corners. | `club` (optional) |
| `get_fixture_difficulty` | Upcoming Fixture Difficulty Ratings (FDR) ranking all 20 clubs easiest to hardest (next 3–10 matches). | `window` (default 5), `sort` (`easiest`/`hardest`), `club` (optional) |
| `get_match_preview` | Pre-match tactical preview: predicted formations clash (e.g. 4-3-3 vs 5-4-1), manager H2H, and form guide. | `home_club`, `away_club` |

---

## 🚀 Quickstart

### 1. Claude Desktop Setup

Add to your `claude_desktop_config.json`:

* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "touchlinewire": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/touchlinewire-mcp/src/index.js"]
    }
  }
}
```

### 2. Cursor Setup

Go to **Cursor Settings** $\to$ **Features** $\to$ **MCP Servers** $\to$ **Add New MCP Server**:
* **Name**: `touchlinewire`
* **Type**: `command`
* **Command**: `node /ABSOLUTE/PATH/TO/touchlinewire-mcp/src/index.js`

---

## 💡 Example Prompts to Ask Your AI

Once connected, ask Claude, Cursor, or any MCP client:
* *"Who is predicted to start for Arsenal in their next Premier League match?"*
* *"Give me the tactical match report for Liverpool's last game with xG and the event timeline."*
* *"Which players are currently flagged or injured for Chelsea?"*
* *"Show me the current Premier League top 4 and relegation zone with goal differences."*

---

## 📄 License & Attribution

Data provided live by [Touchline Wire](https://touchlinewire.com).
Licensed under MIT. Free for personal, commercial, research, and agentic workflows with attribution.
