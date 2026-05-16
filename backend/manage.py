#!/usr/bin/env python
from __future__ import annotations

import os
import sys
from pathlib import Path


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent
    sys.path.insert(0, str(base_dir.parent))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.django_project.settings")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
