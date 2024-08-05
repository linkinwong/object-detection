# Copyright (C) 2023 CVAT.ai Corporation
#
# SPDX-License-Identifier: MIT

import json
import base64
from PIL import Image
import io
from model_handler import ModelHandler

def init_context(context):
    context.logger.info("Init context...  0%")
    model = ModelHandler()
    context.user_data.model = model
    context.logger.info("Init context...100%")

def handler(context, event):
    context.logger.info("call handler")
    content_type = event.headers.get('Content-Type', '')
#    data = event.body
 #   buf = io.BytesIO(base64.b64decode(data["image"]))
    if 'multipart/form-data' in content_type:
        context.logger.info("Init multipart11...100%")

    elif content_type == 'application/octet-stream':
        context.logger.info("stream 333...100%")
    #     # 处理二进制流
        buf = io.BytesIO(event.body)
    else:
        return context.Response(body=json.dumps({"error": "Unsupported Media Type"}),
                                 content_type='application/json',
                                 status_code=415)

    image = Image.open(buf)
    image = image.convert("RGB")  #  to make sure image comes in RGB
   # image = cv2.cvtColor(np.asarray(image),cv2.COLOR_RGB2BGR)
   # features = context.user_data.model.handle(image,types_n)
   # image = Image.open(buf)
   # image = image.convert("RGB")  #  to make sure image comes in RGB
    features = context.user_data.model.handle(image)

    return context.Response(body=json.dumps({
            'blob': base64.b64encode((features.cpu().numpy() if features.is_cuda else features.numpy())).decode(),
        }),
        headers={},
        content_type='application/json',
        status_code=200
    )
