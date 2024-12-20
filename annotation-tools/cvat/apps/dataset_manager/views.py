# Copyright (C) 2019-2022 Intel Corporation
# Copyright (C) 2023 CVAT.ai Corporation
#
# SPDX-License-Identifier: MIT

import os
import os.path as osp
import tempfile
from datetime import timedelta

import django_rq
from datumaro.util.os_util import make_file_name
from datumaro.util import to_snake_case
from django.utils import timezone
from django.conf import settings

import cvat.apps.dataset_manager.task as task
import cvat.apps.dataset_manager.project as project
from cvat.apps.engine.log import ServerLogManager
from cvat.apps.engine.models import Project, Task, Job

from .formats.registry import EXPORT_FORMATS, IMPORT_FORMATS
from .util import current_function_name

slogger = ServerLogManager(__name__)

_MODULE_NAME = __package__ + '.' + osp.splitext(osp.basename(__file__))[0]
def log_exception(logger=None, exc_info=True):
    if logger is None:
        logger = slogger
    logger.exception("[%s @ %s]: exception occurred" % \
            (_MODULE_NAME, current_function_name(2)),
        exc_info=exc_info)


def get_export_cache_dir(db_instance):
    base_dir = osp.abspath(db_instance.get_dirname())

    if osp.isdir(base_dir):
        return osp.join(base_dir, 'export_cache')
    else:
        raise FileNotFoundError('{} dir {} does not exist'.format(db_instance.__class__.__name__, base_dir))

DEFAULT_CACHE_TTL = timedelta(hours=10)
TASK_CACHE_TTL = DEFAULT_CACHE_TTL
PROJECT_CACHE_TTL = DEFAULT_CACHE_TTL / 3
JOB_CACHE_TTL = DEFAULT_CACHE_TTL

def export(dst_format, project_id=None, task_id=None, job_id=None, server_url=None, save_images=False):
    try:
        if task_id is not None:
            logger = slogger.task[task_id]
            cache_ttl = TASK_CACHE_TTL
            export_fn = task.export_task
            db_instance = Task.objects.get(pk=task_id)
        elif project_id is not None:
            logger = slogger.project[project_id]
            cache_ttl = PROJECT_CACHE_TTL
            export_fn = project.export_project
            db_instance = Project.objects.get(pk=project_id)
        else:
            logger = slogger.job[job_id]
            cache_ttl = JOB_CACHE_TTL
            export_fn = task.export_job
            db_instance = Job.objects.get(pk=job_id)

        cache_dir = get_export_cache_dir(db_instance)

        exporter = EXPORT_FORMATS[dst_format]
        output_base = '%s_%s' % ('dataset' if save_images else 'annotations',
            make_file_name(to_snake_case(dst_format)))
        output_path = '%s.%s' % (output_base, exporter.EXT)
        output_path = osp.join(cache_dir, output_path)

        instance_time = timezone.localtime(db_instance.updated_date).timestamp()
        if isinstance(db_instance, Project):
            tasks_update = list(map(lambda db_task: timezone.localtime(
                db_task.updated_date).timestamp(), db_instance.tasks.all()))
            instance_time = max(tasks_update + [instance_time])
        if not (osp.exists(output_path) and \
                instance_time <= osp.getmtime(output_path)):
            os.makedirs(cache_dir, exist_ok=True)
            with tempfile.TemporaryDirectory(dir=cache_dir) as temp_dir:
                temp_file = osp.join(temp_dir, 'result')
                export_fn(db_instance.id, temp_file, dst_format,
                    server_url=server_url, save_images=save_images)
                os.replace(temp_file, output_path)

            archive_ctime = osp.getctime(output_path)
            scheduler = django_rq.get_scheduler(settings.CVAT_QUEUES.EXPORT_DATA.value)
            cleaning_job = scheduler.enqueue_in(time_delta=cache_ttl,
                func=clear_export_cache,
                file_path=output_path,
                file_ctime=archive_ctime,
                logger=logger)
            logger.info(
                "The {} '{}' is exported as '{}' at '{}' "
                "and available for downloading for the next {}. "
                "Export cache cleaning job is enqueued, id '{}'".format(
                    db_instance.__class__.__name__.lower(),
                    db_instance.name if isinstance(db_instance, (Project, Task)) else db_instance.id,
                    dst_format, output_path, cache_ttl,
                    cleaning_job.id
                ))

        return output_path
    except Exception:
        log_exception(logger)
        raise

def export_job_annotations(job_id, dst_format=None, server_url=None):
    return export(dst_format, job_id=job_id, server_url=server_url, save_images=False)

def export_job_as_dataset(job_id, dst_format=None, server_url=None):
    return export(dst_format, job_id=job_id, server_url=server_url, save_images=True)

def export_task_as_dataset(task_id, dst_format=None, server_url=None):
    return export(dst_format, task_id=task_id, server_url=server_url, save_images=True)

def export_task_annotations(task_id, dst_format=None, server_url=None):
    return export(dst_format, task_id=task_id, server_url=server_url, save_images=False)

def export_project_as_dataset(project_id, dst_format=None, server_url=None):
    return export(dst_format, project_id=project_id, server_url=server_url, save_images=True)

def export_project_annotations(project_id, dst_format=None, server_url=None):
    return export(dst_format, project_id=project_id, server_url=server_url, save_images=False)


def clear_export_cache(file_path, file_ctime, logger):
    try:
        if osp.exists(file_path) and osp.getctime(file_path) == file_ctime:
            os.remove(file_path)

            logger.info(
                "Export cache file '{}' successfully removed" \
                .format(file_path))
    except Exception:
        log_exception(logger)
        raise

def get_export_formats():
    return list(EXPORT_FORMATS.values())

def get_import_formats():
    return list(IMPORT_FORMATS.values())

def get_all_formats():
    return {
        'importers': get_import_formats(),
        'exporters': get_export_formats(),
    }
