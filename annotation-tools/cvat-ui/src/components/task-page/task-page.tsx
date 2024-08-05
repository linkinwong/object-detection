// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022-2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import Result from 'antd/lib/result';
import notification from 'antd/lib/notification';
import CVATLoadingSpinner from 'components/common/loading-spinner';

import { getInferenceStatusAsync } from 'actions/models-actions';
import { getCore, Task, Job } from 'cvat-core-wrapper';
import JobListComponent from 'components/task-page/job-list';
import ModelRunnerModal from 'components/model-runner-modal/model-runner-dialog';
import MoveTaskModal from 'components/move-task-modal/move-task-modal';
import { CombinedState } from 'reducers';
import DetailsComponent from './details';
import LoadingSkeleton from '../common/skeleton';
import useUpdateTask from './useUpdateTask';
import { getTasksAsync } from '../../actions/tasks-actions';

const core = getCore();

function TaskPageComponent(): JSX.Element {
    const history = useHistory();
    const id = +useParams<{ id: string }>().id;
    const dispatch = useDispatch();
    const { loading: fetchingTask, taskInstance, setTaskInstance, onJobUpdate } = useUpdateTask();
    const [updatingTask, setUpdatingTask] = useState(false);
    const mounted = useRef(false);

    const deletes = useSelector((state: CombinedState) => state.tasks.activities.deletes);

    useEffect(() => {
        mounted.current = !0;
        dispatch(getInferenceStatusAsync());
    }, [id]);

    useEffect(() => {
        if (taskInstance && id in deletes && deletes[id]) {
            history.push('/tasks');
        }
    }, [deletes, taskInstance]);

    if (fetchingTask) {
        return <LoadingSkeleton image={false} rows={4} times={2} title />;
    }

    if (!taskInstance) {
        return (
            <Result
                className='cvat-not-found'
                status='404'
                title='There was something wrong during getting the task'
                subTitle='Please, be sure, that information you tried to get exist and you are eligible to access it'
            />
        );
    }

    const onUpdateTask = (task: Task): Promise<void> => (
        new Promise((resolve, reject) => {
            setUpdatingTask(true);
            task.save().then((updatedTask: Task) => {
                if (mounted.current) {
                    setTaskInstance(updatedTask);
                }
                resolve();

                dispatch(getTasksAsync({}));

            }).catch((error: Error) => {
                notification.error({
                    message: 'Could not update the task',
                    className: 'cvat-notification-notice-update-task-failed',
                    description: error.toString(),
                });
                reject();
            }).finally(() => {
                if (mounted.current) {
                    setUpdatingTask(false);
                }
            });
        })
    );

    return (
        <div className='bg-white w-full h-full relative'>
            { updatingTask ? <CVATLoadingSpinner size='large' /> : null }
            <div className='w-full h-full flex flex-col gap-4 cvat-task-details-wrapper p-5'>
                <DetailsComponent history={history} task={taskInstance} onUpdateTask={onUpdateTask} />
                <JobListComponent task={taskInstance} onUpdateJob={onJobUpdate} />
            </div>
            <ModelRunnerModal />
            <MoveTaskModal onUpdateTask={onUpdateTask} />
        </div>
    );
}

export default React.memo(TaskPageComponent);
