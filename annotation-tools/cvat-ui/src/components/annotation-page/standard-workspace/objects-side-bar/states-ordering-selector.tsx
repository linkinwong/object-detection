// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React from 'react';
import { Col } from 'antd/lib/grid';
import Select from 'antd/lib/select';
import Text from 'antd/lib/typography/Text';

import { StatesOrdering } from 'reducers';

interface StatesOrderingSelectorComponentProps {
    statesOrdering: StatesOrdering;
    changeStatesOrdering(value: StatesOrdering): void;
}

function StatesOrderingSelectorComponent(props: StatesOrderingSelectorComponentProps): JSX.Element {
    const { statesOrdering, changeStatesOrdering } = props;
    const { t } = useTranslation();

    return (
        <Col>
            <Text strong>{t('annotation-page_standard-workspace_objects-side-bar_states-ordering-selector_tsx.Sortby', 'Sort by')}</Text>
            <Select
                className='cvat-objects-sidebar-ordering-selector'
                dropdownClassName='cvat-objects-sidebar-ordering-dropdown'
                value={statesOrdering}
                onChange={changeStatesOrdering}
            >
                <Select.Option key={StatesOrdering.ID_DESCENT} value={StatesOrdering.ID_DESCENT}>
                    {StatesOrdering.ID_DESCENT}
                </Select.Option>
                <Select.Option key={StatesOrdering.ID_ASCENT} value={StatesOrdering.ID_ASCENT}>
                    {StatesOrdering.ID_ASCENT}
                </Select.Option>
                <Select.Option key={StatesOrdering.UPDATED} value={StatesOrdering.UPDATED}>
                    {StatesOrdering.UPDATED}
                </Select.Option>
                <Select.Option key={StatesOrdering.Z_ORDER} value={StatesOrdering.Z_ORDER}>
                    {StatesOrdering.Z_ORDER}
                </Select.Option>
            </Select>
        </Col>
    );
}

export default React.memo(StatesOrderingSelectorComponent);
