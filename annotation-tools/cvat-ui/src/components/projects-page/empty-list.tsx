// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Link } from 'react-router-dom';
import Text from 'antd/lib/typography/Text';
import { Row, Col } from 'antd/lib/grid';
import Empty from 'antd/lib/empty';
import { useTranslation } from 'react-i18next';

interface Props {
    notFound: boolean;
}

export default function EmptyListComponent(props: Props): JSX.Element {
    const { notFound } = props;
    const { t } = useTranslation();
    return (
        <div className='cvat-empty-projects-list'>
            <Empty description={notFound ? (
                <Text strong>{t('projects-page_empty-list_tsx.Noresultsmatchedyour', 'No results matched your search...')}</Text>
            ) : (
                <>
                    <Row justify='center' align='middle'>
                        <Col>
                            <Text strong>{t('projects-page_empty-list_tsx.Noprojectscreatedyet', 'No projects created yet ...')}</Text>
                        </Col>
                    </Row>
                    <Row justify='center' align='middle'>
                        <Col>
                            <Text type='secondary'>{t('projects-page_empty-list_tsx.Togetstartedwithyour', 'To get started with your annotation project')}</Text>
                        </Col>
                    </Row>
                    <Row justify='center' align='middle'>
                        <Col>
                            <Link to='/projects/create'>{t('projects-page_empty-list_tsx.createanewone', 'create a new one')}</Link>
                        </Col>
                    </Row>
                </>
            )}
            />
        </div>
    );
}
