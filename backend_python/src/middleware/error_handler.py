"""Error handling utilities for Flask."""
import logging
from functools import wraps
from flask import jsonify
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


def handle_errors(f):
    """Decorator to handle common errors in Flask routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            logger.warning(f"Validation error in {f.__name__}: {str(e)}")
            return jsonify({"error": "Validation error", "message": str(e)}), 400
        except SQLAlchemyError as e:
            logger.error(f"Database error in {f.__name__}: {str(e)}")
            return jsonify({"error": "Database error occurred"}), 500
        except Exception as e:
            logger.error(f"Unhandled error in {f.__name__}: {str(e)}", exc_info=True)
            return jsonify({"error": "Internal server error"}), 500

    return decorated_function
