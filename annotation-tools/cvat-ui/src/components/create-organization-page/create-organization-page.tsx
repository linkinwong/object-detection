// Copyright (C) 2021-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import './styles.scss';
import React from 'react';
import { Row, Col } from 'antd/lib/grid';
import Text from 'antd/lib/typography/Text';

import CreateOrganizationForm from './create-organization-form';

function CreateOrganizationComponent(): JSX.Element {
    const { t } = useTranslation();
    return (
        <Row justify='center' align='top' className='cvat-create-organization-page'>
            <Col md={20} lg={16} xl={14} xxl={9}>
                <Text className='cvat-title'>{t('create-organization-page_create-organization-page_tsx.Createaneworganizati', 'Create a new organization')}</Text>
                <CreateOrganizationForm />
            </Col>
        </Row>
    );
}

export default React.memo(CreateOrganizationComponent);
