// Copyright (C) 2021-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React from 'react';
import Text from 'antd/lib/typography/Text';

import { useTranslation } from 'react-i18next';
import CreateCloudStorageForm from './cloud-storage-form';

export default function CreateCloudStoragePageComponent(): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className='cvat-attach-cloud-storage-form-wrapper w-full h-full flex flex-col items-center gap-4'>
            <Text className='cvat-title'>{t('create-cloud-storage-page_create-cloud-storage-page_tsx.Createacloudstorage', 'Create a cloud storage')}</Text>
            <CreateCloudStorageForm />
        </div>
    );
}
