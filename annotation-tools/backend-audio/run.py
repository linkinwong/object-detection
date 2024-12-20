#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2018/9/4 4:43 PM
# @Author  : vell
# @Email   : vellhe@tencent.com
import argparse
import codecs
import json
import logging.config
import logging.handlers
import os

import tornado.gen
import tornado.ioloop
import tornado.web
from tornado.web import Application

from server.base import CORSStaticFileHandler
from server.get_task import GetTask
from server.post_ret import PostRet
from server.upload_files import UploadFiles
from server.export_annotations import ExportAnnotations

current_dir = os.path.abspath('.')
log_dir = os.path.join(current_dir, 'log_conf.json')


def load_log_config(path):
    os.makedirs('logs', exist_ok=True)
    log_file = os.path.join(current_dir, 'logs', 'audio-annotator.log')
    config = {
        'version': 1,
        'disable_existing_loggers': True,
        'formatters': {
            'verbose': {
                'format': "[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s",
                'datefmt': "%Y-%m-%d %H:%M:%S"
            },
            'simple': {
                'format': '%(levelname)s %(message)s'
            },
        },
        'handlers': {
            'null': {
                'level': 'DEBUG',
                'class': 'logging.NullHandler',
            },
            'console': {
                'level': 'DEBUG',
                'class': 'logging.StreamHandler',
                'formatter': 'verbose'
            },
            'file': {
                'level': 'DEBUG',
                'class': 'logging.handlers.TimedRotatingFileHandler',
                # 当达到10MB时分割日志
                # 'maxBytes': 1024 * 1024 * 100,
                # 最多保留50份文件
                'when': 'midnight',
                'backupCount': 50,
                # If delay is true,
                # then file opening is deferred until the first call to emit().
                'delay': True,
                'filename': log_file,
                'formatter': 'verbose'
            }
        },
        'loggers': {
            '': {
                'handlers': ['file', 'console'],
                'level': 'INFO',
                'propagate': True,
            },
        }
    }
    if path and os.path.exists(path):
        with codecs.open(path, "r", encoding="utf-8") as f:
            config = json.loads(f.read())

    logging.config.dictConfig(config)


def run(host='0.0.0.0', port=9591, debug=True, wav_dir=os.path.join(os.path.dirname(__file__), "data")):
    settings = {
        "wav_dir": wav_dir
    }

    _app = Application([
        (r'/audio/post_ret', PostRet),
        (r'/audio/get_task', GetTask),
        (r'/audio/upload_files/(\w+)/(\d+)', UploadFiles),
        (r'/audio/export_annotations', ExportAnnotations),
        (r"/audio/data/(.*.[wav|mp3])", CORSStaticFileHandler, {"path": settings["wav_dir"]}),
    ],
        # 项目配置信息
        # 网页模板
        template_path=os.path.join(os.path.dirname(__file__), "html/templates"),
        # 静态文件
        static_path=os.path.join(os.path.dirname(__file__), "html/static"),
        settings=settings,
        debug=debug)

    _app.listen(port, address=host)
    tornado.ioloop.IOLoop.current().start()


def main():
    parser = argparse.ArgumentParser(description=__name__)
    parser.add_argument("--host", default="0.0.0.0",
                        help='host, 0.0.0.0 代表外网可以访问')
    parser.add_argument("-n", "--nucliourl",default="0.0.0.0",
                        help='nucliourl AI主机ip')
    parser.add_argument('-p', "--port", default=9591, type=int,
                        help='port')
    parser.add_argument("-d", "--debug", default=False, type=bool,
                        help='debug')
    parser.add_argument("-l", "--log_config_file", default=log_dir,
                        help='log config file, json')
    parser.add_argument("--wav_dir", "-w", default=os.path.join(os.path.dirname(__file__), 'data'),
                        help='待标注的wav文件夹')
    args = parser.parse_args()
    print(args)

    os.makedirs(args.wav_dir, exist_ok=True)
    load_log_config(args.log_config_file)
    logger = logging.getLogger("root")
    # 将host设置为0.0.0.0，则外网用户也可以访问到这个服务
    logger.info("%s,%d,%s", args.host, args.port, args.debug)

    run(host=args.host, port=args.port, debug=args.debug, wav_dir=args.wav_dir)


if __name__ == "__main__":
    main()
