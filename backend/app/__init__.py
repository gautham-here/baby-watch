from flask import Flask
from .config import Config
from .extensions import jwt, cors, socketio
from .state_store import RoomStore
from .mqtt_client import BabyWatchMQTT
from .api import register_blueprints
from .sockets import register_socket_handlers

store = RoomStore()
mqtt_service = None  # set in create_app

def create_app():
    global mqtt_service

    app = Flask(__name__)
    app.config.from_object(Config)

    # extensions
    jwt.init_app(app)
    cors.init_app(app, origins=app.config["CORS_ORIGINS"], supports_credentials=False)

    socketio.init_app(app, cors_allowed_origins=app.config["CORS_ORIGINS"])

    # mqtt
    mqtt_service = BabyWatchMQTT(app, store)
    mqtt_service.start()

    # blueprints + sockets
    register_blueprints(app, store, mqtt_service)
    register_socket_handlers(store)

    @app.get("/api/health")
    def health():
        return {"ok": True}

    return app
