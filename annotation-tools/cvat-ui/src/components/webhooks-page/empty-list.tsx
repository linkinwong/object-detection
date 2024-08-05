// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React from 'react';
import Text from 'antd/lib/typography/Text';
import { Row, Col } from 'antd/lib/grid';

import Empty from 'antd/lib/empty';
import { WebhooksQuery } from 'reducers';

interface Props {
    query: WebhooksQuery;
}

function EmptyWebhooksListComponent(props: Props): JSX.Element {
    const { query } = props;

    return (
        <div className='cvat-empty-webhooks-list'>
            <Empty description={!query.filter && !query.search ? (
                <Row justify='center' align='middle'>
                    <Col>
                        <Text strong>No webhooks created yet ...</Text>
                    </Col>
                </Row>
            ) : (<Text>{t('webhooks-page_empty-list_tsx.Noresultsmatchedyour', 'No results matched your search')}</Text>)}
            />
        </div>
    );
}

export default React.memo(EmptyWebhooksListComponent);
