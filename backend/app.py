"""
Ignorance Protocol Engine — Flask Application Factory
=====================================================
Run with:
    python app.py

Or for production:
    gunicorn -w 1 -b 0.0.0.0:5000 app:create_app()
"""

from __future__ import annotations

import logging
import sys

from flask import Flask
from flask_cors import CORS

import config
from model.loader import model_loader
from routes.query import query_bp


def configure_logging() -> None:
    """Set up structured logging to stdout + optional file."""
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]

    try:
        handlers.append(logging.FileHandler(config.LOG_FILE, encoding="utf-8"))
    except OSError:
        pass  # Non-fatal if log file can't be created

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=handlers,
    )


def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS(app, origins=config.CORS_ORIGINS, supports_credentials=True)

    # ── Load model (blocking — intentional for startup correctness) ───────────
    model_loader.load(model_name=config.MODEL_NAME, device=config.DEVICE)
    app.config["MODEL_LOADER"] = model_loader

    # ── Register blueprints ───────────────────────────────────────────────────
    app.register_blueprint(query_bp)

    return app


if __name__ == "__main__":
    configure_logging()
    logger = logging.getLogger(__name__)

    logger.info("=" * 60)
    logger.info("  🛡️  Ignorance Protocol Engine  —  Backend starting")
    logger.info(f"  Model  : {config.MODEL_NAME}")
    logger.info(f"  Device : {config.DEVICE}")
    logger.info(f"  Gamma  : {config.GAMMA}")
    logger.info(f"  Port   : {config.FLASK_PORT}")
    logger.info("=" * 60)

    app = create_app()
    app.run(
        host=config.FLASK_HOST,
        port=config.FLASK_PORT,
        debug=config.FLASK_DEBUG,
        use_reloader=False,   # Reloader breaks singleton model loader
    )
