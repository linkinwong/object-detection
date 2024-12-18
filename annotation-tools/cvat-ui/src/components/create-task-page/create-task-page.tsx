// Copyright (C) 2019-2022 Intel Corporation
// Copyright (C) 2022-2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import './styles.scss';
import React from 'react';
import { useLocation } from 'react-router';
import { Row, Col } from 'antd/lib/grid';
import Text from 'antd/lib/typography/Text';

import CreateTaskContent, { CreateTaskData } from './create-task-content';

interface Props {
    onCreate: (data: CreateTaskData, onProgress?: (status: string) => void) => Promise<any>;
}

export default function CreateTaskPage(props: Props): JSX.Element {
    const { onCreate } = props;

    const location = useLocation();

    let projectId = null;
    const params = new URLSearchParams(location.search);
    if (params.get('projectId')?.match(/^[1-9]+[0-9]*$/)) {
        projectId = +(params.get('projectId') as string);
    }
    const many = params.get('many') === 'true';
    const handleCreate: typeof onCreate = (...onCreateParams) => onCreate(...onCreateParams);

    return (
        <div className='w-full h-full flex flex-col items-center gap-4 cvat-create-work-form-wrapper'>
            <Text className='cvat-title'>{useTranslation().t('create-task-page_create-task-page_tsx.Createanewtask', 'Create a new task')}</Text>
            <CreateTaskContent projectId={projectId} onCreate={handleCreate} many={many} />
        </div>
    );
}
