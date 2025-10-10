"""User controller for Flask."""
import uuid
from flask import Blueprint, jsonify, request

from models.base_flask import db
from models.user_flask import User

user_bp = Blueprint("users", __name__)


@user_bp.route("", methods=["POST"])
@user_bp.route("/", methods=["POST"])
def create_or_get_user():
    """Create a new user or get existing user by email."""
    try:
        data = request.get_json()

        # Validate required fields
        if not data or "email" not in data:
            return jsonify({"error": "Email is required"}), 400

        email = data["email"]
        name = data.get("name", "")

        # Check if user already exists
        user = User.query.filter_by(email=email).first()

        if user:
            # Return existing user
            return jsonify(user.to_dict()), 200

        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name=name,
            username=data.get("username"),
            password_hash=data.get("password_hash"),
        )

        db.session.add(user)
        db.session.commit()

        return jsonify(user.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@user_bp.route("/<user_id>", methods=["GET"])
def get_user(user_id):
    """Get a user by ID."""
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user.to_dict()), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@user_bp.route("/signup", methods=["POST"])
def signup():
    """Register a new user."""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["email", "password", "name"]
        for field in required_fields:
            if not data or field not in data:
                return jsonify({"error": f"{field} is required"}), 400

        email = data["email"]

        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User already exists"}), 409

        # Create new user (password should be hashed in production)
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name=data["name"],
            username=data.get("username", email.split("@")[0]),
            password_hash=data["password"],  # TODO: Hash password with bcrypt
        )

        db.session.add(user)
        db.session.commit()

        # Don't return password hash
        user_dict = user.to_dict()
        return jsonify(user_dict), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@user_bp.route("/login", methods=["POST"])
def login():
    """Login a user."""
    try:
        data = request.get_json()

        # Validate required fields
        if not data or "email" not in data or "password" not in data:
            return jsonify({"error": "Email and password are required"}), 400

        email = data["email"]
        password = data["password"]

        # Find user
        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        # TODO: Verify password hash with bcrypt
        # For now, simple comparison (NOT SECURE - for development only)
        if user.password_hash != password:
            return jsonify({"error": "Invalid credentials"}), 401

        # Return user data (in production, return JWT token)
        user_dict = user.to_dict()
        return jsonify(user_dict), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
