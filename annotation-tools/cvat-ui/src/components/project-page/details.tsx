// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import moment from 'moment';
import { Row, Col } from 'antd/lib/grid';
import Title from 'antd/lib/typography/Title';
import Text from 'antd/lib/typography/Text';

import { getCore, Project } from 'cvat-core-wrapper';
import LabelsEditor from 'components/labels-editor/labels-editor';
import BugTrackerEditor from 'components/task-page/bug-tracker-editor';
import UserSelector from 'components/task-page/user-selector';
import MdGuideControl from 'components/md-guide/md-guide-control';
import ActionsMenu from '../projects-page/actions-menu';
import Button from 'antd/lib/button';
import { MoreOutlined } from '@ant-design/icons';
import Dropdown from 'antd/lib/dropdown';

const core = getCore();

interface DetailsComponentProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
}

export default function DetailsComponent(props: DetailsComponentProps): JSX.Element {
    const { t } = useTranslation();
    const { project, onUpdateProject } = props;
    const [projectName, setProjectName] = useState(project.name);

    return (
        <div data-cvat-project-id={project.id} className='cvat-project-details'>
            <Row>
                <div className='w-full flex flex-row items-center justify-between'>
                    <Title
                        level={4}
                        editable={{
                            onChange: (value: string): void => {
                                setProjectName(value);
                                project.name = value;
                                onUpdateProject(project);
                            },
                        }}
                        className='cvat-text-color !mb-0'
                    >
                        {projectName}
                    </Title>

                    <Dropdown
                        destroyPopupOnHide
                        trigger={['click']}
                        overlay={<ActionsMenu projectInstance={project} />}
                    >
                        <Button size='middle' className='cvat-project-page-actions-button'>
                            <Text className='cvat-text-color'>{t('project-page_top-bar_tsx.Actions', 'Actions')}</Text>
                            <MoreOutlined className='cvat-menu-icon' />
                        </Button>
                    </Dropdown>
                </div>
            </Row>
            <Row justify='space-between' className='cvat-project-description'>
                <Col>
                    <Text type='secondary'>
                        {`项目 #${project.id} `}
                        {project.owner ? `${project.owner.username} 创建于` : null}
                        {` ${moment(project.createdDate).format('YYYY MM DD')}`}
                    </Text>
                    <MdGuideControl instanceType='project' id={project.id} />
                    <BugTrackerEditor
                        instance={project}
                        onChange={(bugTracker): void => {
                            project.bugTracker = bugTracker;
                            onUpdateProject(project);
                        }}
                    />
                </Col>
                <Col>
                    <Text type='secondary'>{t('project-page_details_tsx.Assignedto', 'Assigned to')}</Text>
                    <UserSelector
                        value={project.assignee}
                        onSelect={(user) => {
                            project.assignee = user;
                            project.assigneeUrl = window.location.href;
                            onUpdateProject(project);
                        }}
                    />
                </Col>
            </Row>
            <LabelsEditor
                labels={project.labels.map((label: any): string => label.toJSON())}
                onSubmit={(labels: any[]): void => {
                    project.labels = labels.map((labelData): any => new core.classes.Label(labelData));
                    onUpdateProject(project);
                }}
            />
        </div>
    );
}
