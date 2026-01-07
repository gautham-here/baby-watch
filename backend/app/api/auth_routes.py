from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt

from ..demo_users import USERS

bp = Blueprint("auth", __name__)

@bp.post("/login")
def login():
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")

    user = USERS.get(username)
    if not user or user["password"] != password:
        return jsonify({"msg": "Invalid credentials"}), 401

    token = create_access_token(
        identity=username,
        additional_claims={"role": user["role"], "name": user["name"]}
    )
    return jsonify({"access_token": token, "role": user["role"], "name": user["name"]})

@bp.get("/me")
@jwt_required()
def me():
    claims = get_jwt()
    return jsonify({"role": claims.get("role"), "name": claims.get("name")})
