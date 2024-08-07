import time
import json
import logging
from tornado.web import RequestHandler, StaticFileHandler


class BaseReqHandler(RequestHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request, **kwargs)
        self.start_time = None
        self.json_args = None

    def _log_request(self):
        consume_time = time.time() - self.start_time
        # 自定义日志格式和内容
        message = "%s %s %s %s %s %f" % (
            self.request.remote_ip,
            self.request.method,
            self.request.uri,
            self.get_status(),
            self.request.headers.get("Content-Length", "-"),
            consume_time
        )
        logging.info(message)

    def data_received(self, chunk):
        pass

    def set_default_headers(self):
        print("set_default_headers xxx")
        self.set_header("Access-Control-Allow-Origin", "*")  # 允许所有域进行跨域请求
        self.set_header("Access-Control-Allow-Headers", "*")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.set_header('Access-Control-Allow-Credentials', 'true')

    def options(self):
        # 这个方法用于响应预检请求（preflight request）
        # 预检请求是浏览器在发送实际请求前自动发送的，用于确认服务器支持的HTTP方法
        self.set_status(204)
        self.finish()

    def prepare(self):
        # self.set_header("Access-Control-Allow-Origin", "*")
        # self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        # self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.start_time = time.time()
        if 'Content-Type' in self.request.headers and self.request.headers['Content-Type'].startswith(
                'application/json') \
                and self.request.body:
            # print(self.request.body)
            self.json_args = json.loads(self.request.body.decode())
        super().prepare()

    def on_finish(self):
        self._log_request()
        super().on_finish()


class CORSStaticFileHandler(StaticFileHandler):
    def set_default_headers(self):
        super().set_default_headers()
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        # 注意：根据实际需求调整以上CORS设置

    def options(self, *args, **kwargs):
        # 对于OPTIONS请求，设置适当的CORS头并结束响应
        self.set_status(204)
        self.finish()
