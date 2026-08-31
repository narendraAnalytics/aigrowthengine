"""Dump the OpenAPI schema to stdout (or a file).

    uv run python -m app.export_openapi > openapi.json

Consumed by `npm run types:generate` at the repo root, which runs
openapi-typescript to regenerate packages/types/api.ts.
"""

from __future__ import annotations

import json
import sys

from app.main import app


def main() -> None:
    schema = app.openapi()
    text = json.dumps(schema, indent=2, sort_keys=True)
    if len(sys.argv) > 1:
        with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text + "\n")
    else:
        sys.stdout.write(text + "\n")


if __name__ == "__main__":
    main()
