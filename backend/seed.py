import os
import sys

# Ensure the app package inside src can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "src")))

from app.core.seed_db import run_seeding

if __name__ == "__main__":
    run_seeding()
