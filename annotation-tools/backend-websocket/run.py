import asyncio
import websockets
import json
import threading

connected_clients = {}

async def websocket_handler(websocket, path):
    client_id = None
    try:
        async for message in websocket:
            data = json.loads(message)
            if data.get("type") == "register":
                client_id = data["user_id"]
                connected_clients[client_id] = websocket
                await websocket.send(json.dumps({"status": "registered", "user_id": client_id}))
            elif data.get("type") == "user_data":
                await handle_user_data(data)
            elif data.get("type") == "nuclio_data":
                await handle_nuclio_data(data)
            else:
                await websocket.send(json.dumps({"error": "Invalid message type"}))
    except websockets.exceptions.ConnectionClosed:
        print(f"Client {client_id} disconnected")
    finally:
        # 不移除客户端以保持长连接
        pass

async def handle_user_data(data):
    print(f"Received data from user: {data}")

async def broadcast_to_client(data, user_id):
    if user_id in connected_clients:
        websocket = connected_clients[user_id]
        try:
            await websocket.send(json.dumps(data))
        except websockets.exceptions.ConnectionClosed:
            del connected_clients[user_id]

async def handle_nuclio_data(data):
    user_id = data.get("user_id")
    if user_id:
        await broadcast_to_client(data, user_id)

def start_websocket_server():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    server = websockets.serve(websocket_handler, '0.0.0.0', 9593)
    loop.run_until_complete(server)
    loop.run_forever()

if __name__ == "__main__":
    threading.Thread(target=start_websocket_server).start()

