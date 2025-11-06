"""Flask application for Velocity Banking API."""
import logging
import sys
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

# Add src to path for imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from config import settings
from models.base_flask import db, init_db

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def create_app():
    """Create and configure Flask application."""
    app = Flask(__name__)

    # Configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.database_url.replace(
        "sqlite+aiosqlite", "sqlite"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = settings.secret_key

    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=settings.allowed_origins)

    # Import all models first (required for SQLAlchemy relationships)
    from models.user_flask import User
    from models.mortgage_flask import Mortgage
    from models.heloc_flask import Heloc
    from models.payment_flask import Payment

    # Initialize database
    with app.app_context():
        init_db()

    # Register blueprints
    from controllers.mortgage_controller_flask import mortgage_bp
    from controllers.optimization_controller import optimization_bp
    from controllers.user_controller_flask import user_bp
    from controllers.heloc_controller_flask import heloc_bp
    from controllers.payment_controller_flask import payment_bp
    from controllers.calculation_controller_flask import calculation_bp
    from controllers.investment_controller_flask import investment_bp

    app.register_blueprint(mortgage_bp, url_prefix="/api/mortgages")
    app.register_blueprint(optimization_bp, url_prefix="/api/optimize")
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(heloc_bp, url_prefix="/api/helocs")
    app.register_blueprint(payment_bp, url_prefix="/api/payments")
    app.register_blueprint(calculation_bp, url_prefix="/api/calculate")
    app.register_blueprint(investment_bp, url_prefix="/api/investment")

    # Health check endpoint for Kubernetes
    @app.route("/api/health")
    def health_check():
        try:
            # Test database connectivity
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            db.session.commit()
            
            return jsonify({
                "status": "healthy",
                "database": "connected",
                "version": "2.0.0"
            }), 200
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return jsonify({
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }), 500

    # Simple health check endpoint
    @app.route("/health")
    def simple_health_check():
        return jsonify({"status": "ok"})

    # Root endpoint
    @app.route("/")
    def root():
        return jsonify(
            {
                "message": "Velocity Banking API (Flask)",
                "version": "2.0.0",
                "features": ["Scientific Optimization", "Flask Framework"],
            }
        )

    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad request", "message": str(error)}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found", "message": str(error)}), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal error: {str(error)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    app.run(host=settings.host, port=settings.port, debug=settings.debug)
