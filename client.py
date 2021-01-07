import socketio
import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(name)s %(levelname)s:%(message)s')
logger = logging.getLogger(__name__)

def execute_client(addr: str):
    sio = socketio.Client()
    @sio.event
    def ping(data):
        logger.debug("Ping Received")
        sio.emit("pong")

    sio.connect(addr)
    sio.wait()

execute_client("http://127.0.0.1:42474")
