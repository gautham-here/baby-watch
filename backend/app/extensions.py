from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO

jwt = JWTManager()
socketio = SocketIO(async_mode="threading", cors_allowed_origins="*")  # threading works well with paho threads [web:40]
cors = CORS()
