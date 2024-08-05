// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { RouteComponentProps } from 'react-router';
import { withRouter } from 'react-router-dom';
import Text from 'antd/lib/typography/Text';
import { Row, Col } from 'antd/lib/grid';
import Button from 'antd/lib/button';
import { LoadingOutlined, MoreOutlined } from '@ant-design/icons';
import Dropdown from 'antd/lib/dropdown';
import Progress from 'antd/lib/progress';
import Badge from 'antd/lib/badge';
import moment from 'moment';
import { Task, RQStatus } from 'cvat-core-wrapper';
import ActionsMenuContainer from 'containers/actions-menu/actions-menu';
import Preview from 'components/common/preview';
import { ActiveInference, PluginComponent } from 'reducers';
import AutomaticAnnotationProgress from './automatic-annotation-progress';

export interface TaskItemProps {
    taskInstance: any;
    deleted: boolean;
    sidebar?: boolean;
    activeInference: ActiveInference | null;
    ribbonPlugins: PluginComponent[];
    cancelAutoAnnotation(): void;
    updateTaskInState(task: Task): void;
}

interface State {
    importingState: {
        state: RQStatus | null;
        message: string;
        progress: number;
    } | null;
}

class TaskItemComponent extends React.PureComponent<TaskItemProps & RouteComponentProps, State> {
    #isUnmounted: boolean;

    constructor(props: TaskItemProps & RouteComponentProps) {
        super(props);
        const { taskInstance } = props;
        this.#isUnmounted = false;
        this.state = {
            importingState: taskInstance.size > 0 ? null : {
                state: null,
                message: 'Request current progress',
                progress: 0,
            },
        };
    }

    public componentDidMount(): void {
        const { taskInstance, updateTaskInState } = this.props;
        const { importingState } = this.state;

        if (importingState !== null) {
            taskInstance.listenToCreate((state: RQStatus, progress: number, message: string) => {
                if (!this.#isUnmounted) {
                    this.setState({
                        importingState: {
                            message,
                            progress: Math.floor(progress * 100),
                            state,
                        },
                    });
                }
            }).then((createdTask: Task) => {
                if (!this.#isUnmounted) {
                    this.setState({ importingState: null });

                    setTimeout(() => {
                        if (!this.#isUnmounted) {
                            // check again, because the component may be unmounted to this moment
                            const { taskInstance: currentTaskInstance } = this.props;
                            if (currentTaskInstance.size !== createdTask.size) {
                                // update state only if it was not updated anywhere else
                                // for example in createTaskAsync
                                updateTaskInState(createdTask);
                            }
                        }
                    }, 1000);
                }
            });
        }
    }

    public componentWillUnmount(): void {
        this.#isUnmounted = true;
    }

    private renderPreview(): JSX.Element {
        const { taskInstance, sidebar } = this.props;
        return (
            <Preview
                task={taskInstance}
                loadingClassName='cvat-task-item-loading-preview'
                emptyPreviewClassName='cvat-task-item-empty-preview'
                previewWrapperClassName='w-32'
                previewClassName='cvat-task-item-preview h-full w-32 max-h-[120px] object-cover'
            />
        );
    }

    private renderDescription(): JSX.Element {
        // Task info
        moment.locale('zh-cn');
        const { taskInstance } = this.props;
        const { id } = taskInstance;
        const owner = taskInstance.owner ? taskInstance.owner.username : null;
        const updated = moment(taskInstance.updatedDate).fromNow();
        const created = moment(taskInstance.createdDate).format('YYYY MM DD');

        return (
            <div className="bold w-36 text-gray-600">{`#${id}: ${taskInstance.name}`}</div>
        );
    }

    private renderProgress(): JSX.Element {
        const {taskInstance, activeInference, cancelAutoAnnotation } = this.props;
        const { importingState } = this.state;

        if (importingState) {
            let textType: 'success' | 'danger' = 'success';
            if (!!importingState.state && [RQStatus.FAILED, RQStatus.UNKNOWN].includes(importingState.state)) {
                textType = 'danger';
            }

            return (
                <div className='flex w-full flex-col items-start gap-2'>
                    <span className='flex items-center flex-nowrap gap-2'>
                        <span className="whitespace-nowrap text-gray-400">{`\u2022 ${importingState.message || importingState.state}`}</span>
                        {!!importingState.state && [RQStatus.QUEUED, RQStatus.STARTED].includes(importingState.state) && <LoadingOutlined />}
                    </span>

                    <Progress
                        percent={importingState.progress}
                        strokeColor="#1890FF"
                        strokeWidth={5}
                        size="small"
                    />
                </div>
            );
        }
        // Count number of jobs and performed jobs
        const numOfJobs = taskInstance.progress.totalJobs;
        const numOfCompleted = taskInstance.progress.completedJobs;
        const numOfValidation = taskInstance.progress.validationJobs;
        const numOfAnnotation = taskInstance.progress.annotationJobs;

        // Progress appearance depends on number of jobs
        const jobsProgress = ((numOfCompleted + numOfValidation) * 100) / numOfJobs;

        return (
            <div className='flex items-start gap-1'>
                <div className='flex-1 flex flex-col items-start justify-between gap-1'>
                    <div className="flex items-center gap-2 text-gray-400">
                        {numOfCompleted > 0 && (
                            <span className="cvat-task-completed-progress">
                                {`\u2022 ${numOfCompleted} done `}
                            </span>
                        )}

                        {numOfValidation > 0 && (
                            <span className="cvat-task-validation-progress">
                                {`\u2022 ${numOfValidation} on review `}
                            </span>
                        )}

                        {numOfAnnotation > 0 && (
                            <span className="cvat-task-annotation-progress">
                                {`\u2022 ${numOfAnnotation} annotating `}
                            </span>
                        )}
                        <span>
                            {`\u2022 ${numOfJobs} total`}
                        </span>
                    </div>
                    <Progress
                        percent={jobsProgress}
                        success={{
                            percent: (numOfCompleted * 100) / numOfJobs,
                        }}
                        strokeColor="#1890FF"
                        showInfo={false}
                        strokeWidth={5}
                        size="small"
                    />
                </div>
                <AutomaticAnnotationProgress
                    activeInference={activeInference}
                    cancelAutoAnnotation={cancelAutoAnnotation}
                />
            </div>
        );
    }

    private renderNavigation(): JSX.Element {
        const { importingState } = this.state;
        const { taskInstance, history, sidebar } = this.props;
        if (sidebar) { // @ts-ignore
            return null;
        }

        const { id } = taskInstance;

        const onViewAnalytics = (): void => {
            history.push(`/tasks/${taskInstance.id}/analytics`);
        };

        return (
            <div className='flex flex-col justify-between'>
                <Dropdown
                    trigger={['click']}
                    destroyPopupOnHide
                    overlay={(
                        <ActionsMenuContainer
                            taskInstance={taskInstance}
                            onViewAnalytics={onViewAnalytics}
                        />
                    )}
                >
                    <div className='flex items-center gap-1'>
                        <Button type='link'>操作</Button>
                        {/*<MoreOutlined className='cvat-menu-icon' />*/}
                    </div>
                </Dropdown>
            </div>
        );
    }

    public render(): JSX.Element {
        const { deleted, sidebar, taskInstance, ribbonPlugins } = this.props;

        const style = {};
        const sideBarStyle = {
            padding: '16px',
            'border-radius': '8px',
            background: 'white',
            'box-shadow': '0 2px 4px 0 rgba(0,0,0,0.1)',
            justifyContent: 'space-between',
        }
        if (deleted) {
            (style as any).pointerEvents = 'none';
            (style as any).opacity = 0.5;
        }

        const ribbonItems = ribbonPlugins
            .filter((plugin) => plugin.data.shouldBeRendered(this.props, this.state))
            .map((plugin) => ({ component: plugin.component, weight: plugin.data.weight }));

        return (
            <Badge.Ribbon
                style={{ visibility: ribbonItems.length ? 'visible' : 'hidden' }}
                placement='start'
                text={(
                    <div>
                        {ribbonItems.sort((item1, item2) => item1.weight - item2.weight)
                            .map((item) => item.component).map((Component, index) => (
                                <Component key={index} targetProps={this.props} targetState={this.state} />
                            ))}
                    </div>
                )}
            >
                <div className='w-full flex items-center' style={{ ...style, ...(sidebar ? {} : sideBarStyle) }}>
                    <div className='flex items-center gap-4 h-32 relative cursor-pointer'
                         onClick={() => {
                             if (!sidebar) {
                                 this.props.history.push(`/tasks/${taskInstance.id}`);
                             }
                         }}
                    >
                        {this.renderPreview()}
                        <div className='h-full flex flex-col justify-around items-start'>
                            {this.renderDescription()}
                            {this.renderProgress()}
                        </div>
                    </div>
                    {this.renderNavigation()}
                </div>
            </Badge.Ribbon>
        );
    }
}

export default withRouter(TaskItemComponent);
