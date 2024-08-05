#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2018/9/4 5:16 PM
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
        self.wav_dir = application.settings["settings"]["wav_dir"]
        print(application.settings)

    def _get_task(self, audio_suffix_list, tmp_audios_key="all", review=False):
        if tmp_audios_key not in self.application.settings:
            audio_dir = self.wav_dir
            if tmp_audios_key != 'all':
                audio_dir = os.path.join(self.wav_dir, tmp_audios_key)
            self.application.settings[tmp_audios_key] = list_files(audio_dir, audio_suffix_list)

        if not self.application.settings[tmp_audios_key]:
            del self.application.settings[tmp_audios_key]
            return None

        file_path = self.application.settings[tmp_audios_key]
        return file_path or None

    def get(self):
        review = self.get_argument('review', default="true")
        audio_suffix_default = ['.mp3', '.wav']
        audio_suffix = self.get_argument('audio_suffix', default=audio_suffix_default)
        task_id = self.get_argument("id", default="all")

        wav_path = self._get_task(audio_suffix, tmp_audios_key=task_id, review=(review == "true"))
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
                    with open(wav_json_path, encoding="utf-8") as f:
                        task_ret = json.load(f)
                        annotations = task_ret["annotations"]

                rel_wav_path = get_relative_path(self.wav_dir, path)
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
        # resp["task"] = resp["task"][0]
        self.write(json.dumps(resp))
