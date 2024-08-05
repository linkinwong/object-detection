import os
import json
import logging
from server.base import BaseReqHandler

logger = logging.getLogger(__name__)


class ExportAnnotations(BaseReqHandler):
    def __init__(self, application, request, *args, **kwargs):
        super().__init__(application, request, *args, **kwargs)
        self.wav_dir = application.settings["settings"]["wav_dir"]

    @staticmethod
    def _annotations(path, key, annotations):
        for root, dirs, files in os.walk(path):
            for file in files:
                if os.path.splitext(file)[1] != '.json':
                    continue
                file_path = os.path.join(root, file)
                with open(file_path, encoding="utf-8") as f:
                    annotations[key] = json.load(f)

    def get(self):
        annotations = {}
        task_dict = self.json_args
        for task_id, task_name in task_dict.items():
            key = f'{task_id}_{task_name}'
            annotations.update({key: {}})
            task_path = os.path.join(self.wav_dir, task_id)
            self._annotations(task_path, key, annotations)
        self.write(json.dumps(annotations, ensure_ascii=False))
