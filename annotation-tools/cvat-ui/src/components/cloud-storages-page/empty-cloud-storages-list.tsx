// Copyright (C) 2021-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';

import Empty from 'antd/lib/empty';
import { Row, Col } from 'antd/lib/grid';
import Text from 'antd/lib/typography/Text';
import { CloudOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
    notFound: boolean;
}

export default function EmptyStoragesListComponent(props: Props): JSX.Element {
    const { notFound } = props;
    const { t } = useTranslation();
    const description = notFound ? (
        <Row justify='center' align='middle'>
            <Col>
                <Text strong>{t('cloud-storages-page_empty-cloud-storages-list_tsx.Noresultsmatchedyour', 'No results matched your search found...')}</Text>
            </Col>
        </Row>
    ) : (
        <>
            <Row justify='center' align='middle'>
                <Col>
                    <Text strong>{t('cloud-storages-page_empty-cloud-storages-list_tsx.Nocloudstoragesattac', 'No cloud storages attached yet ...')}</Text>
                </Col>
            </Row>
            <Row justify='center' align='middle'>
                <Col>
                    <Text type='secondary'>{t('cloud-storages-page_empty-cloud-storages-list_tsx.Togetstartedwithyour', 'To get started with your cloud storage')}</Text>
                </Col>
            </Row>
            <Row justify='center' align='middle'>
                <Col>
                    <Link to='/cloudstorages/create'>{t('cloud-storages-page_empty-cloud-storages-list_tsx.attachanewone', 'attach a new one')}</Link>
                </Col>
            </Row>
        </>
    );

    return (
        <div className='cvat-empty-cloud-storages-list'>
            <Empty description={description} image={<CloudOutlined className='cvat-empty-cloud-storages-list-icon' />} />
        </div>
    );
}
