#!/usr/bin/env python3
"""Read the portable capability index or selected catalog entries without changing files."""

import argparse
import json
from pathlib import Path
import sys


REFERENCES = Path(__file__).resolve().parents[1] / "references"


def query(references: Path, *, search: str | None = None, ids: list[str] | None = None,
          limit: int = 8) -> dict:
    filename = "catalog.json" if ids else "index.json"
    data = json.loads((references / filename).read_text())
    if ids:
        entries = {item["id"]: item for item in data["capabilities"]}
        missing = [identifier for identifier in ids if identifier not in entries]
        if missing:
            raise ValueError("Unknown capability IDs: " + ", ".join(missing))
        matches = [entries[identifier] for identifier in dict.fromkeys(ids)]
    else:
        terms = (search or "").casefold().split()
        if not terms:
            raise ValueError("Search needs at least one non-whitespace term")
        matches = [item for item in data["capabilities"]
                   if all(term in json.dumps(item, ensure_ascii=False).casefold() for term in terms)]
    return {"source": data["source"], "matched": len(matches),
            "capabilities": matches if ids else matches[:limit]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--search", help="Match all whitespace-separated terms in index entries")
    selection.add_argument("--id", action="append", dest="ids", help="Read an exact full entry; repeat for a combination")
    parser.add_argument("--limit", type=int, default=8, help="Maximum search results (default: 8)")
    args = parser.parse_args()
    if args.limit < 1:
        parser.error("--limit must be positive")
    try:
        result = query(REFERENCES, search=args.search, ids=args.ids, limit=args.limit)
    except (OSError, ValueError, KeyError) as error:
        print(f"Capability lookup failed: {error}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
