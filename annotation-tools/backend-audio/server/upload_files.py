import os
import json
import shutil
import logging

from server.base import BaseReqHandler

logger = logging.getLogger(__name__)


class UploadFiles(BaseReqHandler):
    def __init__(self, application, request, *args, **kwargs):
        super().__init__(application, request, *args, **kwargs)
        self.wav_dir = application.settings["settings"]["wav_dir"]

    @staticmethod
    def _save_file(file_data, dir_path):
        filename = file_data['filename']
        file_content = file_data['body']
        file_path = os.path.join(dir_path, filename)
        with open(file_path, 'wb') as f:
            f.write(file_content)

    def post(self, *args):
        resp = {"ret": "ok", "msg": ""}
        upload_type, upload_id = args
        if not all([upload_type, upload_id]):
            resp['ret'] = 'error'
            resp['msg'] = f'upload_type: {upload_type}, upload_id: {upload_id}'
        else:
            try:
                dir_path = os.path.join(self.wav_dir, upload_id)
                if os.path.exists(dir_path):
                    shutil.rmtree(dir_path)
                os.makedirs(dir_path)
                for file_data_list in self.request.files.values():
                    for file_data in file_data_list:
                        self._save_file(file_data, dir_path)
                resp["msg"] = "文件上传成功"
            except Exception as e:
                logger.error(e)
                resp["ret"] = "error"
                resp["msg"] = e.__str__()

        self.write(json.dumps(resp))

    def options(self, *args, **kwargs):
        resp = {"ret": "ok", "msg": ""}

        self.set_status(204)
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods", "GET, HEAD, POST, DELETE, PATCH, PUT, OPTIONS")
        self.set_header("Access-Control-Allow-Headers", "Content-Type")
        self.write(json.dumps(resp))
