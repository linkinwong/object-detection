// Copyright (C) 2022 Intel Corporation
// Copyright (C) 2022-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useHistory } from 'react-router';
import Card from 'antd/lib/card';
import Descriptions from 'antd/lib/descriptions';
import { MoreOutlined } from '@ant-design/icons';
import Dropdown from 'antd/lib/dropdown';

import { Job } from 'cvat-core-wrapper';
import { useCardHeightHOC } from 'utils/hooks';
import Preview from 'components/common/preview';
import JobActionsMenu from 'components/job-item/job-actions-menu';

const useCardHeight = useCardHeightHOC({
    containerClassName: 'cvat-jobs-page',
    siblingClassNames: ['cvat-jobs-page-pagination', 'cvat-jobs-page-top-bar'],
    paddings: 40,
    minHeight: 200,
    numberOfRows: 3,
});

interface Props {
    job: Job;
    onJobUpdate: (job: Job) => void;
}

function JobCardComponent(props: Props): JSX.Element {
    const { t } = useTranslation();
    const { job, onJobUpdate } = props;
    const [expanded, setExpanded] = useState<boolean>(false);
    const history = useHistory();
    const height = useCardHeight();
    const onClick = (event: React.MouseEvent): void => {
        const url = `/tasks/${job.taskId}/jobs/${job.id}`;
        if (event.ctrlKey) {
            window.open(url, '_blank', 'noopener noreferrer');
        } else {
            history.push(url);
        }
    };

    return (
        <>
            <div className="overflow-hidden cursor-pointer flex flex-col md:flex-row items-start md:items-center relative">
                {/* Preview Section */}
                <div className="">
                    {/* Placeholder for Preview Image */}
                    <Preview
                        job={job}
                        loadingClassName='cvat-job-item-loading-preview'
                        emptyPreviewClassName='cvat-job-item-empty-preview'
                        previewWrapperClassName=''
                        previewClassName='w-full h-full max-h-[120px] object-cover'
                    />
                    <div className='text-xs text-teal-300 mb-1 inline absolute top-1 right-1'><span>{`#${job.id}`}</span></div>
                </div>

                {/* Job Details Section */}
                <div className="md:w-1/2 p-4">
                    <Descriptions column={1} size='small'>
                        <Descriptions.Item label={t('jobs-page_job-card_tsx.Stage', 'Stage')}>{job.stage}</Descriptions.Item>
                        <Descriptions.Item label={t('jobs-page_job-card_tsx.State', 'State')}>{job.state}</Descriptions.Item>
                        <Descriptions.Item label={t('jobs-page_job-card_tsx.Size', 'Size')}>{job.stopFrame - job.startFrame + 1}</Descriptions.Item>
                        <Descriptions.Item label={t('jobs-page_job-card_tsx.Assignee', 'Assignee')}>{job.assignee?.username || '-'}</Descriptions.Item>
                    </Descriptions>
                </div>
            </div>
        </>

    );
}

export default React.memo(JobCardComponent);
