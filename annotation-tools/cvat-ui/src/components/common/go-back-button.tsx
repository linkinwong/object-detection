// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React from 'react';
import Button from 'antd/lib/button';
import Text from 'antd/lib/typography/Text';
import { LeftOutlined } from '@ant-design/icons';
import { useGoBack } from 'utils/hooks';

function GoBackButton(): JSX.Element {
    const goBack = useGoBack();
    const { t } = useTranslation();
    return (
        <>
            <Button style={{ marginRight: 8 }} onClick={goBack}>
                <LeftOutlined />
            </Button>
            <Text style={{ userSelect: 'none' }} strong>{t('common_go-back-button_tsx.Back', 'Back')}</Text>
        </>
    );
}

export default React.memo(GoBackButton);
