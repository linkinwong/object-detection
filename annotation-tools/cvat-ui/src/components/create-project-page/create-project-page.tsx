// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import './styles.scss';
import React from 'react';
import Text from 'antd/lib/typography/Text';

import CreateProjectContent from './create-project-content';

function CreateProjectPageComponent(): JSX.Element {
    return (
        <div className='w-full h-full flex flex-col items-center gap-4'>
            <Text className='cvat-title'>{useTranslation().t('create-project-page_create-project-page_tsx.Createanewproject', 'Create a new project')}</Text>
            <CreateProjectContent />
        </div>
    );
}

export default React.memo(CreateProjectPageComponent);
