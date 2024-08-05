// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import './styles.scss';

import React from 'react';
import { useHistory } from 'react-router';
import { Row, Col } from 'antd/lib/grid';
import Text from 'antd/lib/typography/Text';
import Button from 'antd/lib/button';

interface Props {
    instanceType: 'task' | 'project';
    id: number;
}

function MdGuideControl(props: Props): JSX.Element {
    const { t } = useTranslation();
    const { instanceType, id } = props;
    const history = useHistory();

    return (
        <Row justify='start' className='cvat-md-guide-control-wrapper'>
            <Col span={24}>
                <Text strong className='cvat-text-color'>{`${instanceType[0].toUpperCase()}${instanceType.slice(1)} 描述`}</Text>
                <br />
                <Button
                    onClick={() => {
                        history.push(`/${instanceType}s/${id}/guide`);
                    }}
                >
                    {t('md-guide_md-guide-control_tsx.Edit', 'Edit')}
                </Button>
            </Col>
        </Row>
    );
}

export default React.memo(MdGuideControl);
