import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://60.10.135.150:23723/websocket/"  # 替换为你的 WebSocket 服务地址和端口
    async with websockets.connect(uri) as websocket:
        # 发送测试消息
        test_message = {
            "type": "register",
            "user_id": "test123"
        }

        await websocket.send(json.dumps(test_message))

        # 接收注册确认消息
        response = await websocket.recv()
        print(f"Registration Response: {response}")

        # 持续接收消息
        while True:
            try:
                response = await websocket.recv()
                print(f"Received: {response}")
            except websockets.exceptions.ConnectionClosed:
                print("Connection closed")
                break

# 运行 WebSocket 客户端
asyncio.get_event_loop().run_until_complete(test_websocket())
