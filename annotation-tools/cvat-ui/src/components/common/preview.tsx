// Copyright (C) 2022-2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { PictureOutlined, VideoCameraOutlined, FileTextOutlined, CustomerServiceOutlined, DeploymentUnitOutlined } from '@ant-design/icons';
import Spin from 'antd/lib/spin';
import { getJobPreviewAsync } from 'actions/jobs-actions';
import { getTaskPreviewAsync } from 'actions/tasks-actions';
import { getProjectsPreviewAsync } from 'actions/projects-actions';
import { getCloudStoragePreviewAsync } from 'actions/cloud-storage-actions';
import {
    CombinedState, Job, Task, Project, CloudStorage,
} from 'reducers';
import MLModel from 'cvat-core/src/ml-model';
import { getModelPreviewAsync } from 'actions/models-actions';

interface Props {
    job?: Job | undefined;
    task?: Task | undefined;
    project?: Project | undefined;
    cloudStorage?: CloudStorage | undefined;
    model?: MLModel | undefined;
    onClick?: (event: React.MouseEvent) => void;
    loadingClassName?: string;
    emptyPreviewClassName?: string;
    previewWrapperClassName?: string;
    previewClassName?: string;
}

const mediaType = {
    video: VideoCameraOutlined,
    text: FileTextOutlined,
    audio: CustomerServiceOutlined,
    image: PictureOutlined,
    model: DeploymentUnitOutlined,
};

export default function Preview(props: Props): JSX.Element {
    const dispatch = useDispatch();

    const {
        job,
        task,
        project,
        cloudStorage,
        model,
        onClick,
        loadingClassName,
        emptyPreviewClassName,
        previewWrapperClassName,
        previewClassName,
    } = props;

    const preview = useSelector((state: CombinedState) => {
        if (job !== undefined) {
            return state.jobs.previews[job.id];
        } if (project !== undefined) {
            return state.projects.previews[project.id];
        } if (task !== undefined) {
            return state.tasks.previews[task.id];
        } if (cloudStorage !== undefined) {
            return state.cloudStorages.previews[cloudStorage.id];
        } if (model !== undefined) {
            return state.models.previews[model.id];
        }
        return '';
    });

    useEffect(() => {
        if (preview === undefined) {
            if (job !== undefined) {
                dispatch(getJobPreviewAsync(job));
            } else if (project !== undefined) {
                dispatch(getProjectsPreviewAsync(project));
            } else if (task !== undefined) {
                dispatch(getTaskPreviewAsync(task));
            } else if (cloudStorage !== undefined) {
                dispatch(getCloudStoragePreviewAsync(cloudStorage));
            } else if (model !== undefined) {
                dispatch(getModelPreviewAsync(model));
            }
        }
    }, [preview]);

    if (!preview || (preview && preview.fetching)) {
        return (
            <div className={loadingClassName || ''} aria-hidden>
                <Spin size='default' />
            </div>
        );
    }


    const item = task || job || project || { type: 'model' };
    const type = item.taskType || item.type;
    const Icon = mediaType[type] || PictureOutlined;
    return (
        <div className={previewWrapperClassName || ''} aria-hidden style={{ cursor: 'pointer' }}>
            {
                preview.preview ?
                    <img
                        className={`${previewClassName || ''} w-32`}
                        src={preview.preview}
                        onClick={onClick}
                        alt='Preview image'
                    />
                    :
                    <Icon className='w-32 !text-6xl' />
            }
        </div>
    );
}
