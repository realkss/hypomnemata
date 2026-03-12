from __future__ import annotations

import html
import re
import unicodedata
from collections import OrderedDict
from dataclasses import dataclass
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SESSIONS_DIR = ROOT / "content" / "en" / "Chess" / "Training Sessions"
SITE_ROOT = "en/Chess/Training-Sessions"
RESULT_TOKENS = {"1-0", "0-1", "1/2-1/2", "*"}
MOVE_NUMBER_RE = re.compile(r"^\d+\.(?:\.\.)?$")
TOKEN_RE = re.compile(r"\{[^}]*\}|\(|\)|\$\d+|\d+\.(?:\.\.)?|1-0|0-1|1/2-1/2|\*|[^\s(){}]+", re.DOTALL)
DEFAULT_COMMENTS_TEXT = "No comments yet."


OPENING_NAMES: dict[str, str] = {
    "A13": "English Opening",
    "A56": "Benoni Defense",
    "A59": "Benko Gambit Accepted",
    "B10": "Caro-Kann Defense",
    "B11": "Caro-Kann Defense: Two Knights Attack",
    "B12": "Caro-Kann Defense: Advance Variation",
    "B13": "Caro-Kann Defense: Exchange Variation",
    "B14": "Caro-Kann Defense: Panov Attack",
    "B15": "Caro-Kann Defense: Gurgenidze System",
    "B18": "Caro-Kann Defense: Classical Variation",
    "B19": "Caro-Kann Defense: Classical Variation",
    "B20": "Sicilian Defense",
    "B21": "Sicilian Defense",
    "B23": "Sicilian Defense: Grand Prix Attack",
    "B43": "Sicilian Defense: Kan Variation",
    "B47": "Sicilian Defense: Taimanov Variation",
    "C02": "French Defense: Advance Variation",
    "C26": "Vienna Game",
    "C45": "Scotch Game",
    "C47": "Four Knights Game: Scotch Variation",
    "C55": "Italian Game",
    "C65": "Ruy Lopez: Berlin Defense",
    "D20": "Queen's Gambit Accepted",
    "D32": "Queen's Gambit Declined: Tarrasch Defense",
    "D78": "Neo-Grünfeld Defense",
    "D85": "Grünfeld Defense",
    "D87": "Grünfeld Defense: Exchange Variation",
    "E01": "Catalan Opening",
    "E16": "Queen's Indian Defense",
    "E81": "King's Indian Defense: Sämisch Variation",
}


@dataclass(frozen=True)
class MasterReference:
    citation: str
    filename: str
    pgn_text: str


@dataclass(frozen=True)
class GameData:
    role: str
    date_text: str
    result: str
    eco: str
    opening: str
    opening_tag: str
    master_refs: list[MasterReference]


@dataclass(frozen=True)
class SessionData:
    number: int
    folder_name: str
    slug: str
    session_date: date
    white: GameData
    black: GameData

    @property
    def url(self) -> str:
        return f"{SITE_ROOT}/{self.slug}/"

    @property
    def master_url(self) -> str:
        return f"{self.url}Master-Games/"

    @property
    def display_title(self) -> str:
        return f"Training Session #{self.number}"


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", normalized.lower())).strip("-")


def parse_session_number(folder_name: str) -> int:
    match = re.search(r"(\d+)$", folder_name)
    if match is None:
        raise ValueError(f"Could not parse session number from '{folder_name}'")
    return int(match.group(1))


def parse_headers(text: str) -> dict[str, str]:
    return {
        match.group(1): match.group(2)
        for match in re.finditer(r'^\[(\w+)\s+"([^"]*)"\]\s*$', text, re.MULTILINE)
    }


def strip_headers(text: str) -> str:
    text = text.lstrip("\ufeff")
    lines = [line for line in text.splitlines() if not line.startswith("[")]
    return "\n".join(lines).strip()


def tokenize_movetext(text: str) -> list[str]:
    return TOKEN_RE.findall(text)


def mainline_moves(text: str) -> list[str]:
    tokens = tokenize_movetext(strip_headers(text))
    moves: list[str] = []
    depth = 0

    for token in tokens:
        if token == "(":
            depth += 1
            continue
        if token == ")":
            depth = max(0, depth - 1)
            continue
        if depth > 0 or token.startswith("{") or token.startswith("$"):
            continue
        if MOVE_NUMBER_RE.match(token) or token in RESULT_TOKENS or token == "...":
            continue
        moves.append(token)

    return moves


def parse_pgn_date(raw: str) -> date:
    year, month, day = (int(part) for part in raw.split("."))
    return date(year, month, day)


def render_iso_date(value: date) -> str:
    return value.strftime("%Y-%m-%d")


def render_catalog_date(value: date) -> str:
    return value.strftime("%b %d, %Y")


def opening_name(eco: str) -> str:
    return OPENING_NAMES.get(eco, "Opening")


def has_prefix(moves: list[str], seq: list[str]) -> bool:
    return moves[: len(seq)] == seq


def infer_opening(moves: list[str], header_eco: str) -> tuple[str, str]:
    if has_prefix(moves, ["e4", "c6", "d4", "d5", "exd5", "cxd5", "c4"]):
        return ("Caro-Kann Defense: Panov Attack", "B14")

    if has_prefix(moves, ["e4", "c6", "d4", "d5", "exd5", "cxd5"]):
        return ("Caro-Kann Defense: Exchange Variation", "B13")

    if has_prefix(moves, ["e4", "c6", "d4", "d5", "e5", "h5"]):
        return ("Caro-Kann Defense: Advance Variation", "B12")

    if has_prefix(moves, ["e4", "c6", "d4", "d5", "e5", "Bf5"]):
        if "g4" in moves[:10]:
            return ("Caro-Kann Defense: Advance Variation", "B12")
        return ("Caro-Kann Defense: Advance Variation", "B12")

    if has_prefix(moves, ["e4", "c6", "d4", "d5", "Nc3", "g6"]):
        return ("Caro-Kann Defense: Gurgenidze System", "B15")

    if has_prefix(moves, ["e4", "c6", "Nc3", "d5", "Nf3", "Bg4"]):
        return ("Caro-Kann Defense: Two Knights Attack", "B11")

    if has_prefix(moves, ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6"]):
        if moves[10:12] == ["h4", "h6"]:
            return ("Caro-Kann Defense: Classical Variation", "B19")
        return ("Caro-Kann Defense: Classical Variation", "B18")

    if has_prefix(moves, ["e4", "c6", "Nf3", "d5"]):
        return ("Caro-Kann Defense", "B10")

    if has_prefix(moves, ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"]):
        return ("Ruy Lopez: Berlin Defense", "C65")

    if has_prefix(moves, ["e4", "e5", "Nc3", "Nc6"]):
        return ("Vienna Game", "C26")

    if has_prefix(moves, ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3"]):
        return ("Italian Game", "C55")

    if has_prefix(moves, ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4"]):
        return ("Scotch Game", "C45")

    if has_prefix(moves, ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "d4"]):
        return ("Four Knights Game: Scotch Variation", "C47")

    if has_prefix(moves, ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6", "Nc3", "Qc7"]):
        return ("Sicilian Defense: Taimanov Variation", "B47")

    if has_prefix(moves, ["e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "a6"]):
        return ("Sicilian Defense: Kan Variation", "B43")

    if moves[:3] == ["e4", "c5", "Nc3"] and "f4" in moves[:6]:
        return ("Sicilian Defense: Grand Prix Attack", "B23")

    if moves[:3] == ["e4", "c5", "Nc3"] and "Qxd4" in moves[:8]:
        return ("Sicilian Defense", "B20")

    if has_prefix(moves, ["d4", "Nf6", "Nf3", "d5", "g3", "g6"]):
        return ("Neo-Grünfeld Defense", "D78")

    if has_prefix(moves, ["d4", "Nf6", "c4", "c5", "d5", "b5"]):
        return ("Benko Gambit Accepted", "A59")

    if has_prefix(moves, ["d4", "Nf6", "c4", "c5", "dxc5"]):
        return ("Benoni Defense", "A56")

    if has_prefix(moves, ["d4", "Nf6", "c4", "e6", "Nf3", "b6"]):
        return ("Queen's Indian Defense", "E16")

    if has_prefix(moves, ["d4", "Nf6", "c4", "e6", "Nf3", "c5"]):
        return ("English Opening", "A13")

    if has_prefix(moves, ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5", "e4", "Nxc3"]):
        return ("Grünfeld Defense: Exchange Variation", "D87")

    if has_prefix(moves, ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5"]):
        return ("Grünfeld Defense", "D85")

    if has_prefix(moves, ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3"]):
        return ("King's Indian Defense: Sämisch Variation", "E81")

    if has_prefix(moves, ["d4", "d5", "Nf3", "e6", "c4", "c5"]):
        return ("Queen's Gambit Declined: Tarrasch Defense", "D32")

    if has_prefix(moves, ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "g3"]):
        return ("Catalan Opening", "E01")

    if has_prefix(moves, ["d4", "d5", "c4", "dxc4"]):
        return ("Queen's Gambit Accepted", "D20")

    if has_prefix(moves, ["e4", "e6", "d4", "d5", "e5"]):
        return ("French Defense: Advance Variation", "C02")

    if header_eco in OPENING_NAMES:
        return (OPENING_NAMES[header_eco], header_eco)

    return ("Opening", header_eco or "?")


def extract_citation(comment_text: str) -> str | None:
    normalized = " ".join(comment_text.split())
    match = re.search(r"(1-0|0-1|1/2-1/2)\s+\(\d+\)\s+.+", normalized)
    if match is None:
        return None

    candidate = match.group(0).strip()
    if re.search(r"\(\d{3,4}\)", candidate) is None:
        return None

    return candidate


def serialize_moves(moves: list[str]) -> str:
    parts: list[str] = []
    for index, san in enumerate(moves):
        move_number = index // 2 + 1
        if index % 2 == 0:
            parts.append(f"{move_number}. {san}")
        else:
            parts.append(san)
    return " ".join(parts)


def parse_citation_metadata(citation: str) -> dict[str, str]:
    pattern = re.compile(
        r"^(?P<result>1-0|0-1|1/2-1/2)\s+\((?P<ply>\d+)\)\s+"
        r"(?P<white>.+?)\s+\((?P<white_elo>\d{3,4})\)\s*-\s*"
        r"(?P<black>.+?)\s+\((?P<black_elo>\d{3,4})\)\s+"
        r"(?P<site>.+?)\s+(?P<year>\d{4})(?:\s+(?P<tail>.*))?$"
    )
    match = pattern.match(" ".join(citation.split()))
    if match is None:
        return {
            "result": "*",
            "white": "Referenced White",
            "black": "Referenced Black",
            "site": "?",
            "year": "????",
        }

    data = match.groupdict(default="")
    return {
        "result": data["result"],
        "white": data["white"].strip(),
        "black": data["black"].strip(),
        "white_elo": data["white_elo"].strip(),
        "black_elo": data["black_elo"].strip(),
        "site": data["site"].strip(),
        "year": data["year"].strip(),
        "tail": data["tail"].strip(),
    }


def build_reference_pgn(citation: str, moves: list[str], eco: str) -> str:
    metadata = parse_citation_metadata(citation)
    result = metadata.get("result", "*") or "*"
    headers = OrderedDict(
        [
            ("Event", "Referenced Master Line"),
            ("Site", metadata.get("site", "?") or "?"),
            ("Date", f"{metadata.get('year', '????')}.??.??"),
            ("Round", "?"),
            ("White", metadata.get("white", "Referenced White") or "Referenced White"),
            ("Black", metadata.get("black", "Referenced Black") or "Referenced Black"),
            ("Result", result),
            ("ECO", eco or "?"),
            ("Annotator", citation),
        ]
    )

    white_elo = metadata.get("white_elo", "")
    black_elo = metadata.get("black_elo", "")
    if white_elo:
        headers["WhiteElo"] = white_elo
    if black_elo:
        headers["BlackElo"] = black_elo

    header_block = "\n".join(f'[{key} "{value}"]' for key, value in headers.items())
    movetext = f"{serialize_moves(moves)} {result}".strip()
    return f"{header_block}\n\n{movetext}\n"


def collect_reference_lines(tokens: list[str], start_index: int, prefix_moves: list[str], refs: list[tuple[str, list[str]]]) -> int:
    current_moves = prefix_moves.copy()
    last_prefix_before = prefix_moves.copy()
    index = start_index

    while index < len(tokens):
        token = tokens[index]

        if token == ")":
            return index + 1

        if token == "(":
            index = collect_reference_lines(tokens, index + 1, last_prefix_before, refs)
            continue

        if token.startswith("{") and token.endswith("}"):
            citation = extract_citation(token[1:-1])
            if citation is not None:
                refs.append((citation, current_moves.copy()))
            index += 1
            continue

        if token in RESULT_TOKENS or token.startswith("$") or MOVE_NUMBER_RE.match(token) or token == "...":
            index += 1
            continue

        last_prefix_before = current_moves.copy()
        current_moves.append(token)
        index += 1

    return index


def extract_master_refs(text: str, role: str, eco: str) -> list[MasterReference]:
    tokens = tokenize_movetext(strip_headers(text))
    refs: list[tuple[str, list[str]]] = []
    collect_reference_lines(tokens, 0, [], refs)

    results: list[MasterReference] = []
    seen: set[str] = set()
    for citation, moves in refs:
        if citation in seen or not moves:
            continue
        seen.add(citation)
        index = len(results) + 1
        filename = f"{role.lower()}-reference-{index:02d}.pgn"
        results.append(
            MasterReference(
                citation=citation,
                filename=filename,
                pgn_text=build_reference_pgn(citation, moves, eco),
            )
        )

    return results


def load_game(game_path: Path, role: str) -> GameData:
    text = game_path.read_text(encoding="utf-8-sig")
    headers = parse_headers(text)
    raw_date = headers.get("Date", "1900.01.01")
    header_eco = headers.get("ECO", "")
    moves = mainline_moves(text)
    opening, eco = infer_opening(moves, header_eco)
    return GameData(
        role=role,
        date_text=raw_date,
        result=headers.get("Result", "*"),
        eco=eco,
        opening=opening,
        opening_tag=slugify(opening),
        master_refs=extract_master_refs(text, role, eco),
    )


def collect_sessions() -> list[SessionData]:
    sessions: list[SessionData] = []

    for session_dir in SESSIONS_DIR.iterdir():
        if not session_dir.is_dir() or not session_dir.name.startswith("Training Session "):
            continue

        white = load_game(session_dir / "white.pgn", "White")
        black = load_game(session_dir / "black.pgn", "Black")
        session_date = max(parse_pgn_date(white.date_text), parse_pgn_date(black.date_text))

        sessions.append(
            SessionData(
                number=parse_session_number(session_dir.name),
                folder_name=session_dir.name,
                slug=session_dir.name.replace(" ", "-"),
                session_date=session_date,
                white=white,
                black=black,
            )
        )

    return sorted(sessions, key=lambda session: session.number)


def render_frontmatter(
    session: SessionData,
    extra_tags: list[str] | None = None,
    title: str | None = None,
) -> str:
    tags = list(
        OrderedDict.fromkeys(
            [
                "training-session",
                session.white.opening_tag,
                session.black.opening_tag,
                *(extra_tags or []),
            ]
        )
    )
    tag_block = "\n".join(f"  - {tag}" for tag in tags)
    return (
        "---\n"
        f'title: "{title or session.display_title}"\n'
        "lang: en\n"
        "sourceLanguage: en\n"
        "translationStatus: original\n"
        f"date: {render_iso_date(session.session_date)}\n"
        "hideFolderListing: true\n"
        "tags:\n"
        f"{tag_block}\n"
        "---"
    )


def render_nav_link(label: str, url: str | None) -> str:
    if url is None:
        return f'<span class="training-session-nav__text">{label}</span>'
    return f'<a class="training-session-nav__link" href="{url}">{label}</a>'


def render_session_nav(prev_url: str | None, all_url: str, master_url: str, next_url: str | None) -> str:
    return "\n".join(
        [
            '<nav class="training-session-nav" aria-label="Session navigation">',
            f"  {render_nav_link('Prev Session', prev_url)}",
            f"  {render_nav_link('All Sessions', all_url)}",
            f"  {render_nav_link('Master Games', master_url)}",
            f"  {render_nav_link('Next Session', next_url)}",
            "</nav>",
        ]
    )


def load_legacy_comments_text(session_dir: Path) -> str | None:
    comments_path = session_dir / "comments.txt"
    if not comments_path.exists():
        return None

    content = comments_path.read_text(encoding="utf-8").strip()
    if not content or content == DEFAULT_COMMENTS_TEXT:
        return None
    return content


def load_board_comments_text(session_dir: Path, filename: str, seed_text: str | None = None) -> str:
    comments_path = session_dir / filename
    if not comments_path.exists():
        initial_text = seed_text or DEFAULT_COMMENTS_TEXT
        comments_path.write_text(initial_text + "\n", encoding="utf-8")

    content = comments_path.read_text(encoding="utf-8").strip()
    return content or DEFAULT_COMMENTS_TEXT


def render_comments_section(summary_label: str, comments_text: str) -> str:
    paragraphs = [block.strip() for block in re.split(r"\n\s*\n", comments_text.strip()) if block.strip()]
    if not paragraphs:
        paragraphs = [DEFAULT_COMMENTS_TEXT]

    body = "\n".join(
        f'  <p class="training-session-comments__paragraph">{html.escape(paragraph).replace(chr(10), "<br />")}</p>'
        for paragraph in paragraphs
    )
    return "\n".join(
        [
            '<details class="training-session-comments training-session-comments--board">',
            f'  <summary class="training-session-comments__summary">{html.escape(summary_label)}</summary>',
            '  <p class="training-session-comments__owner">Only Jwipo can add or revise these notes through the site repository.</p>',
            body,
            '</details>',
        ]
    )


def render_session_body(
    session: SessionData,
    prev_url: str | None,
    next_url: str | None,
    white_comments_text: str,
    black_comments_text: str,
) -> str:
    session_date = render_iso_date(session.session_date)
    return "\n".join(
        [
            render_frontmatter(session),
            "",
            '<ul class="training-session-meta">',
            f"  <li>Session date: {session_date}</li>",
            f"  <li>White game: {session.white.date_text} ({session.white.result})</li>",
            f"  <li>Black game: {session.black.date_text} ({session.black.result})</li>",
            "</ul>",
            "",
            f"The cited model games from the annotations are collected on the [Master Games]({session.master_url}) subpage.",
            "",
            "## White Game",
            "",
            f'<p class="training-session-opening-note"><strong>Opening</strong><span>{html.escape(session.white.opening)}</span><em>{html.escape(session.white.eco)}</em></p>',
            "",
            '<div class="chess-training-board" data-label="White Game" data-orientation="white" data-pgn-src="./white.pgn"></div>',
            "",
            render_comments_section("Comments", white_comments_text),
            "",
            "## Black Game",
            "",
            f'<p class="training-session-opening-note"><strong>Opening</strong><span>{html.escape(session.black.opening)}</span><em>{html.escape(session.black.eco)}</em></p>',
            "",
            '<div class="chess-training-board" data-label="Black Game" data-orientation="black" data-pgn-src="./black.pgn"></div>',
            "",
            render_comments_section("Comments", black_comments_text),
            "",
            render_session_nav(prev_url, f"{SITE_ROOT}/", session.master_url, next_url),
        ]
    )


def render_master_entries(title_prefix: str, orientation: str, references: list[MasterReference]) -> str:
    if not references:
        return '<p class="training-session-note">No cited master examples were found in these annotations.</p>'

    blocks: list[str] = []
    for index, reference in enumerate(references, start=1):
        blocks.extend(
            [
                '<section class="training-master-entry">',
                f'  <p class="training-master-caption"><strong>{title_prefix} reference {index}</strong><span>{html.escape(reference.citation)}</span></p>',
                f'  <div class="chess-training-board" data-label="{title_prefix} Reference {index}" data-orientation="{orientation}" data-pgn-src="./{reference.filename}"></div>',
                "</section>",
            ]
        )
    return "\n".join(blocks)


def render_master_page(session: SessionData, prev_url: str | None, next_url: str | None) -> str:
    return "\n".join(
        [
            render_frontmatter(
                session,
                extra_tags=["master-games"],
                title=f"Master Games for {session.display_title}",
            ),
            "",
            "These boards replay the cited master-game lines embedded in the session annotations.",
            "",
            "## White Game References",
            "",
            render_master_entries("White", "white", session.white.master_refs),
            "",
            "## Black Game References",
            "",
            render_master_entries("Black", "black", session.black.master_refs),
            "",
            render_session_nav(prev_url, f"{SITE_ROOT}/", session.url, next_url).replace("Master Games", "Session Boards"),
        ]
    )


def render_catalog(sessions: list[SessionData]) -> str:
    rows: list[str] = []

    for session in reversed(sessions):
        rows.extend(
            [
                f'  <a class="training-session-row" href="{session.url}">',
                f'    <span class="training-session-row__date">{render_catalog_date(session.session_date)}</span>',
                f'    <span class="training-session-row__title">{session.display_title}</span>',
                '    <span class="training-session-row__summary">',
                f'      <span class="training-session-row__chip">White: {html.escape(session.white.opening)}</span>',
                f'      <span class="training-session-row__chip">Black: {html.escape(session.black.opening)}</span>',
                "    </span>",
                "  </a>",
            ]
        )

    return "\n".join(
        [
            "---",
            "title: Training Sessions",
            "lang: en",
            "sourceLanguage: en",
            "translationStatus: original",
            "hideFolderListing: true",
            "---",
            "",
            "These sessions pair one White game and one Black game from the archive so each page can be reviewed as a balanced training set.",
            "",
            "The archive below now surfaces the opening pair for each session and links onward to the cited master-game references.",
            "",
            '<div class="training-session-catalog">',
            *rows,
            "</div>",
        ]
    )


def write_master_reference_files(master_dir: Path, references: list[MasterReference]) -> None:
    for pgn_path in master_dir.glob("*.pgn"):
        pgn_path.unlink()

    for reference in references:
        (master_dir / reference.filename).write_text(reference.pgn_text, encoding="utf-8")


def main() -> None:
    sessions = collect_sessions()
    if not sessions:
        raise SystemExit("No training sessions found.")

    session_by_number = {session.number: session for session in sessions}

    for session in sessions:
        prev_session = session_by_number.get(session.number - 1)
        next_session = session_by_number.get(session.number + 1)

        session_dir = SESSIONS_DIR / session.folder_name
        legacy_comments_text = load_legacy_comments_text(session_dir)
        white_comments_text = load_board_comments_text(session_dir, "white-comments.txt", legacy_comments_text)
        black_comments_text = load_board_comments_text(session_dir, "black-comments.txt", legacy_comments_text)
        session_index = session_dir / "index.md"
        session_index.write_text(
            render_session_body(
                session,
                prev_session.url if prev_session else None,
                next_session.url if next_session else None,
                white_comments_text,
                black_comments_text,
            )
            + "\n",
            encoding="utf-8",
        )

        master_dir = session_dir / "Master Games"
        master_dir.mkdir(exist_ok=True)
        write_master_reference_files(master_dir, [*session.white.master_refs, *session.black.master_refs])
        (master_dir / "index.md").write_text(
            render_master_page(
                session,
                prev_session.master_url if prev_session else None,
                next_session.master_url if next_session else None,
            )
            + "\n",
            encoding="utf-8",
        )

    (SESSIONS_DIR / "index.md").write_text(render_catalog(sessions) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
