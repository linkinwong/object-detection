// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect } from 'react';
import { Menu, Divider } from 'antd';

import ModelRunnerModal from 'components/model-runner-modal/model-runner-dialog';
import MoveTaskModal from 'components/move-task-modal/move-task-modal';
import TaskItem from 'containers/tasks-page/task-item';
import { useHistory, useLocation } from 'react-router';

import { locationParser } from '../../routes';

export interface Props {
    currentTasksIndexes: number[];
}

function TaskListComponent(props: Props): JSX.Element {
    const { currentTasksIndexes } = props;
    const taskViews = currentTasksIndexes.map((tid, id): JSX.Element => <TaskItem sidebar idx={id} taskID={tid} key={tid} />);
    const history = useHistory();
    const { search } = useLocation();

    let [_, tid] = locationParser();

    return (
        <>
            <Menu
                mode="inline"
                forceSubMenuRender
                className="ls-tab-menu"
                defaultSelectedKeys={[tid]}
            >
                {
                    taskViews.map((taskView) => (
                        <>
                            <Menu.Item

                                key={taskView.props.taskID}
                                onClick={(): void => {
                                    history.push(`/tasks/${taskView.props.taskID}${search}`);
                                }}
                            >
                                {taskView}
                            </Menu.Item>
                            <Menu.Divider />
                        </>
                    ))
                }
            </Menu>
            <ModelRunnerModal />
            <MoveTaskModal />
        </>
    );
}

export default React.memo(TaskListComponent, (prev: Props, cur: Props) => (
    prev.currentTasksIndexes.length !== cur.currentTasksIndexes.length || prev.currentTasksIndexes
        .some((val: number, idx: number) => val !== cur.currentTasksIndexes[idx])
));
