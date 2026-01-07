from .auth_routes import bp as auth_bp
from .room_routes import bp as rooms_bp, register_room_routes

def register_blueprints(app, store, mqtt_service):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    register_room_routes(rooms_bp, store, mqtt_service)
    app.register_blueprint(rooms_bp, url_prefix="/api")
