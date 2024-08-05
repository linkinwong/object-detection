// Copyright (C) 2022 Intel Corporation
// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { useSelector } from 'react-redux';
import { CombinedState } from 'reducers';
import { Job, JobType } from 'cvat-core-wrapper';
import JobCard from './job-card';
import Menu from 'antd/lib/menu';
import { useHistory, useLocation } from 'react-router';
import { locationParser } from '../../routes';

interface Props {
    onJobUpdate(job: Job): void;
}

function JobsContentComponent(props: Props): JSX.Element {
    const { onJobUpdate } = props;
    const jobs = useSelector((state: CombinedState) => state.jobs.current);
    const history = useHistory();
    let [_, __, id] = locationParser();
    const { search } = useLocation();

    return (
        <Menu
            mode="inline"
            className="ls-tab-menu"
            defaultSelectedKeys={[id]}
        >
            {
                jobs.map((job: Job) => {
                    return (
                        <>
                            <Menu.Item
                                key={job.id}
                               onClick={(): void => {
                                   history.push(`/jobs/${job.taskId}/${job.id}${search}`);
                               }}
                            >
                                <JobCard job={job} onJobUpdate={onJobUpdate} />
                            </Menu.Item>
                            <Menu.Divider />
                        </>
                    );
                })
            }
        </Menu>
    );
}

export default React.memo(JobsContentComponent);
