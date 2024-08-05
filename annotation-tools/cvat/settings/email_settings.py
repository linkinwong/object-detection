# Copyright (C) 2020-2022 Intel Corporation
# Copyright (C) 2022 CVAT.ai Corporation
#
# SPDX-License-Identifier: MIT

from cvat.settings.production import *


# https://github.com/pennersr/django-allauth
ACCOUNT_AUTHENTICATION_METHOD = 'username_email'
ACCOUNT_CONFIRM_EMAIL_ON_GET = True
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = 'mandatory'

EMAIL_HOST = 'smtp.163.com'  # 例如 smtp.gmail.com
EMAIL_PORT = 25  # 或者你使用的端口号
EMAIL_HOST_USER = 'nunchakus666@163.com'  # 你的邮箱
EMAIL_HOST_PASSWORD = 'OZLZNZGKSOFZPMRS'  # 你的授权码
# EMAIL_USE_TLS = True  # 使用TLS安全连接
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER  # 默认发件人邮箱

# Email backend settings for Django
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
