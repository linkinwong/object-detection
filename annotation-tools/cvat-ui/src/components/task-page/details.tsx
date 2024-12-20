// Copyright (C) 2019-2022 Intel Corporation
// Copyright (C) 2022-2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import { Row, Col } from 'antd/lib/grid';
import Text from 'antd/lib/typography/Text';
import Title from 'antd/lib/typography/Title';
import moment from 'moment';

import { getCore, Task, User } from 'cvat-core-wrapper';
import AutomaticAnnotationProgress from 'components/tasks-page/automatic-annotation-progress';
import MdGuideControl from 'components/md-guide/md-guide-control';
import Preview from 'components/common/preview';
import { cancelInferenceAsync } from 'actions/models-actions';
import { CombinedState, ActiveInference } from 'reducers';
import UserSelector from './user-selector';
import BugTrackerEditor from './bug-tracker-editor';
import LabelsEditorComponent from '../labels-editor/labels-editor';
import ProjectSubsetField from '../create-task-page/project-subset-field';
import ActionsMenuContainer from '../../containers/actions-menu/actions-menu';
import Button from 'antd/lib/button';
import { MoreOutlined } from '@ant-design/icons';
import Dropdown from 'antd/lib/dropdown';
import i18next from 'i18next';

interface OwnProps {
    task: Task;
    history: any;
    onUpdateTask: (task: Task) => Promise<void>;
}

interface StateToProps {
    activeInference: ActiveInference | null;
    projectSubsets: string[];
    dumpers: any[];
    user: any;
}

interface DispatchToProps {
    cancelAutoAnnotation(): void;
}

function mapStateToProps(state: CombinedState, own: OwnProps): StateToProps & OwnProps {
    const [taskProject] = state.projects.current.filter((project) => project.id === own.task.projectId);

    return {
        ...own,
        dumpers: state.formats.annotationFormats.dumpers,
        user: state.auth.user,
        activeInference: state.models.inferences[own.task.id] || null,
        projectSubsets: taskProject ?
            ([
                ...new Set(taskProject.subsets),
            ] as string[]) :
            [],
    };
}

function mapDispatchToProps(dispatch: any, own: OwnProps): DispatchToProps {
    return {
        cancelAutoAnnotation(): void {
            dispatch(cancelInferenceAsync(own.task.id));
        },
    };
}

const core = getCore();

interface State {
    name: string;
    subset: string;
}

type Props = DispatchToProps & StateToProps & OwnProps;

class DetailsComponent extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        const { task: taskInstance } = props;
        this.state = {
            name: taskInstance.name,
            subset: taskInstance.subset,
        };
    }

    public componentDidUpdate(prevProps: Props): void {
        const { task: taskInstance } = this.props;

        if (prevProps !== this.props) {
            this.setState({
                name: taskInstance.name,
            });
        }
    }

    private renderTaskName(): JSX.Element {
        const { name } = this.state;
        const { task: taskInstance, onUpdateTask } = this.props;
        return (
            <Title level={4}>
                <Text
                    editable={{
                        onChange: (value: string): void => {
                            this.setState({
                                name: value,
                            });

                            taskInstance.name = value;
                            onUpdateTask(taskInstance);
                        },
                    }}
                    className='cvat-text-color'
                >
                    {name}
                </Text>
            </Title>
        );
    }

    private renderDescription(): JSX.Element {
        const { task: taskInstance, onUpdateTask } = this.props;
        const owner = taskInstance.owner ? taskInstance.owner.username : null;
        const assignee = taskInstance.assignee ? taskInstance.assignee : null;
        const created = moment(taskInstance.createdDate).format('YYYY MM DD');

        const assigneeSelect = (
            <UserSelector
                value={assignee}
                onSelect={(value: User | null): void => {
                    if (taskInstance?.assignee?.id === value?.id) return;
                    taskInstance.assignee = value;
                    taskInstance.assigneeUrl = window.location.href;
                    onUpdateTask(taskInstance);
                }}
            />
        );

        return (
            <Row className='cvat-task-details-user-block' justify='space-between' align='middle'>
                <Col span={12}>
                    {owner && (
                        <Text type='secondary'>{`任务 #${taskInstance.id} ${owner} 创建于 ${created}`}</Text>
                    )}
                </Col>
                <Col>
                    <Text type='secondary'>分配给</Text>
                    {assigneeSelect}
                </Col>
            </Row>
        );
    }

    private renderLabelsEditor(): JSX.Element {
        const { task: taskInstance, onUpdateTask } = this.props;

        return (
            <Row>
                <Col span={24}>
                    <LabelsEditorComponent
                        labels={taskInstance.labels.map((label: any): string => label.toJSON())}
                        onSubmit={(labels: any[]): void => {
                            taskInstance.labels = labels.map((labelData): any => new core.classes.Label(labelData));
                            onUpdateTask(taskInstance);
                        }}
                    />
                </Col>
            </Row>
        );
    }

    private renderSubsetField(): JSX.Element {
        const { subset } = this.state;
        const {
            task: taskInstance,
            projectSubsets,
            onUpdateTask,
            t,
        } = this.props;
        return (
            <Row>
                <Col span={24}>
                    <Text className='cvat-text-color'>子集</Text>
                </Col>
                <Col span={24}>
                    <ProjectSubsetField
                        value={subset}
                        projectId={taskInstance.projectId as number}
                        projectSubsets={projectSubsets}
                        onChange={(value) => {
                            this.setState({
                                subset: value,
                            });

                            if (taskInstance.subset !== value) {
                                taskInstance.subset = value;
                                onUpdateTask(taskInstance);
                            }
                        }}
                    />
                </Col>
            </Row>
        );
    }

    public render(): JSX.Element {
        const {
            activeInference,
            task: taskInstance,
            cancelAutoAnnotation,
            onUpdateTask,
            history,
        } = this.props;

        const t = i18next.t || ((key: string): string => key);

        return (
            <div className='cvat-task-details'>
                <Row justify='space-between' align='middle'>
                    <Col className='cvat-task-details-task-name'>{this.renderTaskName()}</Col>
                    <Dropdown
                        trigger={['click']}
                        destroyPopupOnHide
                        overlay={(
                            <ActionsMenuContainer
                                taskInstance={taskInstance}
                                onViewAnalytics={() => {
                                    history.push(`/tasks/${taskInstance.id}/analytics`);
                                }}
                            />
                        )}
                    >
                        <Button size='middle' className='cvat-task-page-actions-button'>
                            <Text className='cvat-text-color'>{t('task-page_top-bar_tsx.Actions', 'Actions')}</Text>
                            <MoreOutlined className='cvat-menu-icon' />
                        </Button>
                    </Dropdown>
                </Row>
                <Row justify='space-between' align='top'>
                    <Col md={8} lg={7} xl={7} xxl={6}>
                        <Row justify='start' align='middle'>
                            <Col span={24}>
                                <Preview
                                    task={taskInstance}
                                    loadingClassName='cvat-task-item-loading-preview'
                                    emptyPreviewClassName='cvat-task-item-empty-preview'
                                    previewClassName='cvat-task-item-preview'
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col md={16} lg={17} xl={17} xxl={18}>
                        {this.renderDescription()}
                        { taskInstance.projectId === null && <MdGuideControl instanceType='task' id={taskInstance.id} /> }
                        <Row justify='space-between' align='middle'>
                            <Col span={12}>
                                <BugTrackerEditor
                                    instance={taskInstance}
                                    onChange={(bugTracker) => {
                                        taskInstance.bugTracker = bugTracker;
                                        onUpdateTask(taskInstance);
                                    }}
                                />
                            </Col>
                            <Col span={10}>
                                <AutomaticAnnotationProgress
                                    activeInference={activeInference}
                                    cancelAutoAnnotation={cancelAutoAnnotation}
                                />
                            </Col>
                        </Row>
                        {!taskInstance.projectId && this.renderLabelsEditor()}
                        {taskInstance.projectId && this.renderSubsetField()}
                    </Col>
                </Row>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(DetailsComponent);
