// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import '../styles.scss';

import React from 'react';
import { Link } from 'react-router-dom';
import { Col, Row } from 'antd/lib/grid';
import Card from 'antd/lib/card';
import Button from 'antd/lib/button';
import Title from 'antd/lib/typography/Title';
import { useTranslation } from 'react-i18next';

interface Props {
    taskID: number,
}

function EmptyJobComponent(props: Props): JSX.Element {
    const { taskID } = props;
    const { t } = useTranslation();
    return (
        <Col span={24}>
            <Card className='cvat-job-empty-ground-truth-item'>
                <Row justify='space-between' align='middle'>
                    <Col>
                        <Title level={5}>
                            {t('analytics-page_task-quality_empty-job_tsx.NoGroundTruthjobcrea', 'No Ground Truth job created yet...')}
                        </Title>
                    </Col>
                    <Col>
                        <Button type='primary'>
                            <Link to={`/tasks/${taskID}/jobs/create`}>
                                {t('analytics-page_task-quality_empty-job_tsx.Createnew', 'Create new')}
                            </Link>
                        </Button>
                    </Col>
                </Row>
            </Card>
        </Col>
    );
}

export default React.memo(EmptyJobComponent);
