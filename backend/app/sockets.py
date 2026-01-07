from flask_socketio import emit
from .extensions import socketio

def register_socket_handlers(store):
    @socketio.on("connect")
    def on_connect():
        emit("initial_state", store.get_rooms_sorted())

    @socketio.on("request_rooms")
    def on_request_rooms():
        emit("initial_state", store.get_rooms_sorted())
