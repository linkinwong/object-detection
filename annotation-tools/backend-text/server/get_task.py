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

logger = logging.getLogger(__name__)


class GetTask(BaseReqHandler):
    def __init__(self, application, request, **kwargs):
        super().__init__(application, request, **kwargs)
        self.data_dir = application.settings["settings"]["data_dir"]

    def _get_task(self, text_suffix_list, tmp_texts_key="all", review=False):
        if tmp_texts_key not in self.application.settings:
            text_dir = self.data_dir
            if tmp_texts_key != 'all':
                text_dir = os.path.join(self.data_dir, tmp_texts_key)
            self.application.settings[tmp_texts_key] = list_files(text_dir, text_suffix_list)

        if not self.application.settings[tmp_texts_key]:
            del self.application.settings[tmp_texts_key]
            return None

        file_path = self.application.settings[tmp_texts_key]
        return file_path or None

    def get(self):
        review = self.get_argument('review', default="false")
        wav_name = self.get_argument('wav_name', default=[".txt", '.html'])
        task_id = self.get_argument("id", default="all")

        wav_path = self._get_task(wav_name, tmp_texts_key=task_id, review=(review == "true"))
        resp = {'task': []}
        if not wav_path:
            # 没有wav了
            resp["ret"] = "no_tasks"
        else:
            resp["ret"] = "ok"
            for path in wav_path:
                annotations = []
                wav_json_path = path + ".json"
                if os.path.exists(wav_json_path) and os.path.getsize(wav_json_path) > 0:
                    with open(wav_json_path, 'r', encoding="utf-8") as f:
                        task_ret = json.load(f)
                        annotations.append(task_ret)

                rel_wav_path = get_relative_path(self.data_dir, path)
                url = os.path.join("/data", rel_wav_path)
                resp["task"].append({
                    "feedback": "none",
                    "visualization": "waveform",
                    "proximityTag": [],
                    "url": url,
                    "tutorialVideoURL": "",
                    "alwaysShowTags": True,
                    "annotations": annotations,
                    'filename': os.path.basename(path)
                })
        self.write(json.dumps(resp, ensure_ascii=False))


