// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Link } from 'react-router-dom';
import Text from 'antd/lib/typography/Text';
import { Row, Col } from 'antd/lib/grid';

import { TasksQuery } from 'reducers';
import { useTranslation } from 'react-i18next';

interface Props {
    query: TasksQuery;
}

function EmptyListComponent(props: Props): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className='relative bg-white w-full h-full'>
            <div className='w-full absolute inset-y-1/2	'>
                <Row justify='center' align='middle'>
                    <Col>
                        <Text type='secondary'>{t('tasks-page_empty-list_tsx.Togetstartedwithyour', 'To get started with your annotation project')}</Text>
                    </Col>
                </Row>
                <Row justify='center' align='middle'>
                    <Col>
                        <Link to='/tasks/create'>{t('tasks-page_empty-list_tsx.createanewtask', 'create a new task')}</Link>
                        <Text type='secondary'>{t('tasks-page_empty-list_tsx.ortryto', ' or try to ')}</Text>
                        <Link to='/projects/create'>{t('tasks-page_empty-list_tsx.createanewproject', 'create a new project')}</Link>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default React.memo(EmptyListComponent);
