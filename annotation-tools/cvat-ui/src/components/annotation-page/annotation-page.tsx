// Copyright (C) 2021-2022 Intel Corporation
// Copyright (C) 2023-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect } from 'react';
import { useHistory } from 'react-router';
import Layout from 'antd/lib/layout';
import Result from 'antd/lib/result';
import Spin from 'antd/lib/spin';
import notification from 'antd/lib/notification';
import Button from 'antd/lib/button';
import PageHeader from 'antd/lib/page-header';

import './styles.scss';
import AttributeAnnotationWorkspace
    from 'components/annotation-page/attribute-annotation-workspace/attribute-annotation-workspace';
import SingleShapeWorkspace from 'components/annotation-page/single-shape-workspace/single-shape-workspace';
import ReviewAnnotationsWorkspace from 'components/annotation-page/review-workspace/review-workspace';
import StandardWorkspaceComponent from 'components/annotation-page/standard-workspace/standard-workspace';
import StandardWorkspace3DComponent from 'components/annotation-page/standard3D-workspace/standard3D-workspace';
import TagAnnotationWorkspace from 'components/annotation-page/tag-annotation-workspace/tag-annotation-workspace';
import FiltersModalComponent from 'components/annotation-page/top-bar/filters-modal';
import StatisticsModalComponent from 'components/annotation-page/top-bar/statistics-modal';
import AnnotationTopBarContainer from 'containers/annotation-page/top-bar/top-bar';
import AudioWorkspaceComponent from 'components/annotation-page/standard-workspace/audio-workspace';
import TextWorkspaceComponent from 'components/annotation-page/standard-workspace/text-workspace';
import TopBarComponent from 'components/task-page/top-bar';
import { CombinedState, Workspace } from 'reducers';
import { usePrevious } from 'utils/hooks';
import { readLatestFrame } from 'utils/remember-latest-frame';
import { useTranslation } from 'react-i18next';
import JobItem from '../job-item/job-item';
import useUpdateTask from '../task-page/useUpdateTask';
import { useDispatch } from 'react-redux';

interface Props {
    job: any | null | undefined;
    fetching: boolean;
    frameNumber: number;
    userId: number;
    workspace: Workspace;

    getJob(): void;

    saveLogs(): void;

    closeJob(): void;

    changeFrame(frame: number): void;

    wsConnect(frame: number): void;
}

export default function AnnotationPageComponent(props: Props): JSX.Element {
    const {
        ws, userId, job, fetching, workspace, frameNumber, getJob, closeJob, saveLogs, changeFrame, wsConnect,
    } = props;

    const { loading, taskInstance, onJobUpdate } = useUpdateTask();

    const prevJob = usePrevious(job);
    const prevFetching = usePrevious(fetching);
    const { t } = useTranslation();
    const history = useHistory();
    useEffect(() => {
        saveLogs();
        const root = window.document.getElementById('root');
        if (root) {
            root.style.minHeight = '720px';
        }

        return () => {
            saveLogs();
            if (root) {
                root.style.minHeight = '';
            }

            if (!history.location.pathname.includes('/jobs')) {
                closeJob();
            }
        };
    }, []);

    useEffect(() => {
        if (job === null && !fetching) {
            getJob();
        }
    }, [job, fetching]);

    useEffect(() => {
        if (prevFetching && !fetching && !prevJob && job) {
            const latestFrame = readLatestFrame(job.id);

            if (typeof latestFrame === 'number' &&
                latestFrame !== frameNumber &&
                latestFrame >= job.startFrame &&
                latestFrame <= job.stopFrame
            ) {
                const notificationKey = `cvat-notification-continue-job-${job.id}`;
                notification.info({
                    key: notificationKey,
                    message: `${t('annotation-page_annotation-page_tsx.notice1')} ${latestFrame}`,
                    description: (
                        <span>
                            {t('annotation-page_annotation-page_tsx.Press', 'Press')}
                            <Button
                                className='cvat-notification-continue-job-button'
                                type='link'
                                onClick={() => {
                                    changeFrame(latestFrame);
                                    notification.close(notificationKey);
                                }}
                            >
                                {t('annotation-page_annotation-page_tsx.here', 'here')}
                            </Button>
                            {t('annotation-page_annotation-page_tsx.ifyouwouldliketocont', 'if you would like to continue')}
                        </span>
                    ),
                    placement: 'topRight',
                    className: 'cvat-notification-continue-job',
                });
            }

            if (!job.labels.length) {
                notification.warning({
                    message: 'No labels',
                    description: (
                        <span>
                            {`${job.projectId ? 'Project' : 'Task'} ${
                                job.projectId || job.taskId
                            } does not contain any label. `}
                            <a href={`/${job.projectId ? 'projects' : 'tasks'}/${job.projectId || job.taskId}/`}>
                                {t('annotation-page_annotation-page_tsx.Add', 'Add')}
                            </a>
                            {t('annotation-page_annotation-page_tsx.thefirstoneforeditin', ' the first one for editing annotation.')}
                        </span>
                    ),
                    placement: 'topRight',
                    className: 'cvat-notification-no-labels',
                });
            }
        }
    }, [job, fetching, prevJob, prevFetching]);

    if (job === null) {
        return <Spin size='large' className='cvat-spinner' />;
    }

    if (typeof job === 'undefined') {
        return (
            <Result
                className='cvat-not-found'
                status='404'
                title='Sorry, but this job was not found'
                subTitle='Please, be sure information you tried to get exist and you have access'
            />
        );
    }
    const {
        labels, taskType, taskId, otherTypeData,
    } = job;

    if (['text'].includes(taskType)) {
        console.log('taskType', taskType);
    }
    return (
        <Layout className='cvat-annotation-page'>
            {/*todo add more job info.*/}
            {/*<JobItem job={job} task={taskInstance} onJobUpdate={onJobUpdate} />*/}

            {workspace !== Workspace.TEXT && workspace !== Workspace.AUDIO && (
                <Layout.Header className='cvat-annotation-header'>
                    <AnnotationTopBarContainer />
                </Layout.Header>
            )}
            <Layout.Content className='h-full mt-4'>
                {workspace === Workspace.TEXT && <TextWorkspaceComponent otherTypeData={otherTypeData} labels={labels} id={taskId} />}
                {workspace === Workspace.AUDIO && <AudioWorkspaceComponent job={job} labels={labels} userId={userId} ws={ws}  />}
                {workspace === Workspace.STANDARD3D && <StandardWorkspace3DComponent />}
                {workspace === Workspace.STANDARD && <StandardWorkspaceComponent />}
                {workspace === Workspace.SINGLE_SHAPE && <SingleShapeWorkspace />}
                {workspace === Workspace.ATTRIBUTES && <AttributeAnnotationWorkspace />}
                {workspace === Workspace.TAGS && <TagAnnotationWorkspace />}
                {workspace === Workspace.REVIEW && <ReviewAnnotationsWorkspace />}
            </Layout.Content>
            <FiltersModalComponent />
            <StatisticsModalComponent />
        </Layout>
    );
}
