// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Row, Col } from 'antd/lib/grid';
import Pagination from 'antd/lib/pagination';
import Menu from 'antd/lib/menu';
import { getProjectsAsync } from 'actions/projects-actions';
import { CombinedState, Project } from 'reducers';
import dimensions from './dimensions';
import ProjectItem from './project-item';
import { locationParser } from '../../routes';
import { useHistory, useLocation } from 'react-router';

export default function ProjectListComponent(): JSX.Element {
    const dispatch = useDispatch();
    const projectsCount = useSelector((state: CombinedState) => state.projects.count);
    const projects = useSelector((state: CombinedState) => state.projects.current);
    const gettingQuery = useSelector((state: CombinedState) => state.projects.gettingQuery);
    const tasksQuery = useSelector((state: CombinedState) => state.projects.tasksGettingQuery);
    const { page } = gettingQuery;
    let [_, id] = locationParser();
    const history = useHistory();
    const { search } = useLocation();

    const changePage = useCallback((p: number) => {
        dispatch(
            getProjectsAsync({
                ...gettingQuery,
                page: p,
            }, tasksQuery),
        );
    }, [gettingQuery]);

    return (
        <div className='flex flex-col h-full justify-between gap-4'>

            <Menu
                mode="inline"
                forceSubMenuRender
                defaultSelectedKeys={[id]}
                className='cvat-project-list-content ls-tab-menu'
            >
                {projects.map(
                    (project: Project): JSX.Element => (
                        <>
                            <Menu.Item
                                key={project.id}
                                onClick={(): void => {
                                    history.push(`/projects/${project.id}${search}`);
                                }}
                            >
                                <ProjectItem key={project.id} projectInstance={project} />
                            </Menu.Item>
                            <Menu.Divider />
                        </>
                    ),
                )}
            </Menu>



            <Row justify='center' align='middle'>
                <Col {...dimensions}>
                    <Pagination
                        className='cvat-projects-pagination'
                        onChange={changePage}
                        showSizeChanger={false}
                        total={projectsCount}
                        pageSize={12}
                        current={page}
                        showQuickJumper
                    />
                </Col>
            </Row>
        </div>
    );
}
