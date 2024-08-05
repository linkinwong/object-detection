import requests
from settings import TIMEOUT, AUDIO_TO_TEXT_URL
from server.base import BaseReqHandler
import os
import json
import shutil
import logging

logger = logging.getLogger(__name__)

def audio_to_text(path):
    headers = {
        'Content-Type': 'application/octet-stream',
    }
    with open(path, 'rb') as fp:
        response = requests.post(AUDIO_TO_TEXT_URL, data=fp, headers=headers, timeout=TIMEOUT)
        content = response.json()
        return content

class AudioToTextHandler(BaseReqHandler):
    def __init__(self, application, request, *args, **kwargs):
        super().__init__(application, request, *args, **kwargs)
        self.data_dir = application.settings["settings"]["data_dir"]

    @staticmethod
    def _save_file(file_data, dir_path):
        filename = file_data['filename']
        file_content = file_data['body']
        file_path = os.path.join(dir_path, filename)
        with open(file_path, 'wb') as f:
            f.write(file_content)
        _, filetype = os.path.splitext(file_path)
        if filetype in ['.mp3', '.wav']:
            content = audio_to_text(file_path)
            content = [row[-1] for row in content]
            content = ','.join(content)
            with open(f'{file_path}.txt', 'w') as f:
                f.write(content)

    def post(self, *args):
        resp = {"ret": "ok", "msg": ""}
        upload_type, upload_id = args
        if not all([upload_type, upload_id]):
            resp['ret'] = 'error'
            resp['msg'] = f'upload_type: {upload_type}, upload_id: {upload_id}'
        else:
            try:
                dir_path = os.path.join(self.data_dir, upload_id)
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