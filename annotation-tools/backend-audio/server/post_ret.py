#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2018/9/4 4:15 PM
# @Author  : vell
# @Email   : vellhe@tencent.com
import json
import logging
import os

from server.base import BaseReqHandler
from server.file_utils import get_relative_path

logger = logging.getLogger(__name__)


class PostRet(BaseReqHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request, **kwargs)
        self.wav_dir = application.settings["settings"]["wav_dir"]

    @staticmethod
    def _save_annotation(file_data, dir_path, text_name):
        file_path = os.path.join(dir_path, f'{text_name}.json')
        with open(file_path, 'w') as f:
            f.write(file_data)

    def post(self):
        resp = {"ret": "ok", "msg": ""}
        try:
            filename = self.get_argument('filename')
            task_id = self.get_argument('id')
            dir_path = os.path.join(self.wav_dir, task_id)
            annotation_data = self.request.body.decode('utf8')
            # annotation_data = self.json_args
            self._save_annotation(annotation_data, dir_path, filename)
            resp["msg"] = "保存成功"
        except Exception as e:
            logger.error(e)
            resp["ret"] = "error"
            resp["msg"] = e.__str__()

        self.write(json.dumps(resp))
