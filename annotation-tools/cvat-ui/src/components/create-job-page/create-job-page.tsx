// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import './styles.scss';

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import Text from 'antd/lib/typography/Text';
import Spin from 'antd/lib/spin';
import notification from 'antd/lib/notification';
import { Task } from 'reducers';
import { useIsMounted } from 'utils/hooks';
import { getCore } from 'cvat-core-wrapper';
import JobForm from './job-form';

const core = getCore();

function CreateJobPage(): JSX.Element {
    const [fetchingTask, setFetchingTask] = useState(true);
    const [taskInstance, setTaskInstance] = useState<Task | null>(null);
    const isMounted = useIsMounted();
    const { t } = useTranslation();

    const id = +useParams<{ id: string }>().id;
    useEffect((): void => {
        if (Number.isInteger(id)) {
            core.tasks.get({ id })
                .then(([task]: Task[]) => {
                    if (isMounted() && task) {
                        setTaskInstance(task);
                    }
                }).catch((error: Error) => {
                    if (isMounted()) {
                        notification.error({
                            message: 'Could not fetch requested task from the server',
                            description: error.toString(),
                        });
                    }
                }).finally(() => {
                    if (isMounted()) {
                        setFetchingTask(false);
                    }
                });
        } else {
            notification.error({
                message: 'Could not receive the requested task from the server',
                description: `Requested task id "${id}" is not valid`,
            });
            setFetchingTask(false);
        }
    }, []);
    return (
        <div className='cvat-create-job-page'>
            <Text className='cvat-title'>{t('create-job-page_create-job-page_tsx.Addanewjob', 'Add a new job')}</Text>
            {
                fetchingTask ? (
                    <div className='cvat-create-job-loding'>
                        <Spin size='large' className='cvat-spinner' />
                    </div>
                ) : (
                    <JobForm task={taskInstance} />
                )
            }
        </div>
    );
}

export default React.memo(CreateJobPage);
