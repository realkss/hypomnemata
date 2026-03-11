from __future__ import annotations

import html
import re
from collections import OrderedDict
from dataclasses import dataclass
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SESSIONS_DIR = ROOT / "content" / "en" / "Chess" / "Training Sessions"
SITE_ROOT = "https://realkss.github.io/hypomnemata/en/Chess/Training-Sessions"
RESULT_TOKENS = {"1-0", "0-1", "1/2-1/2", "*"}
MOVE_NUMBER_RE = re.compile(r"^\d+\.(?:\.\.)?$")
TOKEN_RE = re.compile(r"\{[^}]*\}|\(|\)|\$\d+|\d+\.(?:\.\.)?|1-0|0-1|1/2-1/2|\*|[^\s(){}]+", re.DOTALL)


OPENING_NAMES: dict[str, str] = {
    "A09": "Reti Opening",
    "A56": "Benoni Defense",
    "A59": "Benoni Defense",
    "B10": "Caro-Kann Defense",
    "B11": "Caro-Kann Defense",
    "B12": "Caro-Kann Defense: Advance Variation",
    "B13": "Caro-Kann Defense: Exchange Variation",
    "B15": "Caro-Kann Defense",
    "B18": "Caro-Kann Defense: Classical Variation",
    "B19": "Caro-Kann Defense: Classical Variation",
    "B21": "Sicilian Defense",
    "B23": "Closed Sicilian",
    "B43": "Sicilian Defense",
    "B47": "Sicilian Defense",
    "C02": "French Defense",
    "C26": "Vienna Game",
    "C45": "Scotch Game",
    "C47": "Four Knights Game",
    "C55": "Italian Game",
    "C78": "Ruy Lopez",
    "D02": "Queen's Pawn Game",
    "D30": "Queen's Gambit Declined",
    "D37": "Queen's Gambit Declined",
    "D78": "Gruenfeld Defense",
    "D85": "Gruenfeld Defense",
    "D87": "Gruenfeld Defense",
    "E01": "Catalan Opening",
    "E54": "Nimzo-Indian Defense",
    "E81": "King's Indian Defense",
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
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", value.lower())).strip("-")


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


def parse_pgn_date(raw: str) -> date:
    year, month, day = (int(part) for part in raw.split("."))
    return date(year, month, day)


def render_iso_date(value: date) -> str:
    return value.strftime("%Y-%m-%d")


def render_catalog_date(value: date) -> str:
    return value.strftime("%b %d, %Y")


def opening_name(eco: str) -> str:
    if eco in OPENING_NAMES:
        return OPENING_NAMES[eco]

    if eco.startswith("A"):
        return "Flank Opening"
    if eco.startswith("B"):
        return "Semi-Open Game"
    if eco.startswith("C"):
        return "Open Game"
    if eco.startswith("D"):
        return "Closed Game"
    if eco.startswith("E"):
        return "Indian Defense"

    return "Opening"


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
    eco = headers.get("ECO", "")
    opening = opening_name(eco)
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


def render_session_body(session: SessionData, prev_url: str | None, next_url: str | None) -> str:
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
            "## Black Game",
            "",
            f'<p class="training-session-opening-note"><strong>Opening</strong><span>{html.escape(session.black.opening)}</span><em>{html.escape(session.black.eco)}</em></p>',
            "",
            '<div class="chess-training-board" data-label="Black Game" data-orientation="black" data-pgn-src="./black.pgn"></div>',
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
    session_url = session.url
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
            render_session_nav(prev_url, f"{SITE_ROOT}/", session_url, next_url).replace("Master Games", "Session Boards"),
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
    for pgn_path in master_dir.glob('*.pgn'):
        pgn_path.unlink()

    for reference in references:
        (master_dir / reference.filename).write_text(reference.pgn_text, encoding='utf-8')


def main() -> None:
    sessions = collect_sessions()
    if not sessions:
        raise SystemExit("No training sessions found.")

    session_by_number = {session.number: session for session in sessions}

    for session in sessions:
        prev_session = session_by_number.get(session.number - 1)
        next_session = session_by_number.get(session.number + 1)

        session_dir = SESSIONS_DIR / session.folder_name
        session_index = session_dir / "index.md"
        session_index.write_text(
            render_session_body(
                session,
                prev_session.url if prev_session else None,
                next_session.url if next_session else None,
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
