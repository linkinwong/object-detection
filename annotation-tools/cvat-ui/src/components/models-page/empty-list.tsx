// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022-2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Text from 'antd/lib/typography/Text';
import { Row, Col } from 'antd/lib/grid';
import Empty from 'antd/lib/empty';
import { useTranslation } from 'react-i18next';
import config from 'config';

export default function EmptyListComponent(): JSX.Element {
    const { t } = useTranslation();
    return (
        <div className='cvat-empty-models-list'>
            <Empty
                description={(
                    <div>
                        <Row justify='center' align='middle'>
                            <Col>
                                <Text strong>{t('models-page_empty-list_tsx.Nomodelsdeployedyet', 'No models deployed yet...')}</Text>
                            </Col>
                        </Row>
                        <Row justify='center' align='middle'>
                            <Col>
                                <Text type='secondary'>{t('models-page_empty-list_tsx.Toannotateyourtasksa', 'To annotate your tasks automatically')}</Text>
                            </Col>
                        </Row>
                        <Row justify='center' align='middle'>
                            <Col>
                                <Text type='secondary'>{t('models-page_empty-list_tsx.with', 'with ')}</Text>
                                <a href={`${config.NUCLIO_GUIDE}`}>{t('models-page_empty-list_tsx.nuclio', 'nuclio')}</a>
                                <Text type='secondary'>{t('models-page_empty-list_tsx.deployamodelwith', 'deploy a model')}</Text>
                            </Col>
                        </Row>
                    </div>
                )}
            />
        </div>
    );
}
