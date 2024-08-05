#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2018/9/4 6:16 PM
# @Author  : vell
# @Email   : vellhe@tencent.com
import json
import logging
import os

from server.base import BaseReqHandler
from server.file_utils import list_files, get_relative_path, find_child_path_by_re
from settings import TIMEOUT, AUDIO_TO_TEXT_URL

logger = logging.getLogger(__name__)
import requests


class AudioToText(BaseReqHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request, **kwargs)
        self.data_dir = application.settings["settings"]["data_dir"]

    annotations = []
    def get(self):
        resp = {"ret": "ok", "msg": ""}
        try:
            data = self.get_argument("data")
            if not data:
                # throw error


            headers = {
                'Content-Type': 'application/octet-stream',
            }
        except Exception as e:
            logger.error(e)
            resp["ret"] = "error"
            resp["msg"] = e.__str__()

        response = requests.post(AUDIO_TO_TEXT_URL, data=data, headers=headers, timeout=TIMEOUT)
        content = response.json()
        return content




