// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Row, Col } from 'antd/lib/grid';

import { CloseOutlined } from '@ant-design/icons';
import Button from 'antd/lib/button';
import Popover from 'antd/lib/popover';
import Text from 'antd/lib/typography/Text';
import { SketchPicker } from 'react-color';

import { getCore } from 'cvat-core-wrapper';
import CVATTooltip from 'components/common/cvat-tooltip';

const core = getCore();

interface Props {
    children: React.ReactNode;
    value?: string;
    visible?: boolean;
    resetVisible?: boolean;
    onChange?: (value: string) => void;
    onVisibleChange?: (visible: boolean) => void;
    placement?:
    | 'left'
    | 'top'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'leftTop'
    | 'leftBottom'
    | 'rightTop'
    | 'rightBottom';
}

function ColorPicker(props: Props, ref: React.Ref<any>): JSX.Element {
    const {
        children, value, visible, resetVisible, onChange, onVisibleChange, placement,
    } = props;
    const { t } = useTranslation();

    const [colorState, setColorState] = useState(value);
    const [pickerVisible, setPickerVisible] = useState(false);

    const colors = [...core.enums.colors];

    const changeVisible = (_visible: boolean): void => {
        if (typeof onVisibleChange === 'function') {
            onVisibleChange(_visible);
        } else {
            setPickerVisible(_visible);
        }
    };

    return (
        <Popover
            content={(
                <>
                    <SketchPicker
                        color={colorState}
                        onChange={(color) => setColorState(color.hex)}
                        presetColors={colors}
                        ref={ref}
                        disableAlpha
                    />
                    <Row>
                        <Col span={9}>
                            {resetVisible !== false && (
                                <Button
                                    className='cvat-color-picker-reset-button'
                                    onClick={() => {
                                        if (typeof onChange === 'function') onChange('');
                                        changeVisible(false);
                                    }}
                                >
                                    {t('annotation-page_standard-workspace_objects-side-bar_color-picker_tsx.Reset', 'Reset')}
                                </Button>
                            )}
                        </Col>
                        <Col span={9}>
                            <Button
                                className='cvat-color-picker-cancel-button'
                                onClick={() => {
                                    changeVisible(false);
                                }}
                            >
                                {t('annotation-page_standard-workspace_objects-side-bar_color-picker_tsx.Cancel', 'Cancel')}
                            </Button>
                        </Col>
                        <Col span={6}>
                            <Button
                                className='cvat-color-picker-submit-button'
                                type='primary'
                                onClick={() => {
                                    if (typeof onChange === 'function') onChange(colorState || '');
                                    changeVisible(false);
                                }}
                            >
                                {t('annotation-page_standard-workspace_objects-side-bar_color-picker_tsx.Ok', 'Ok')}
                            </Button>
                        </Col>
                    </Row>
                </>
            )}
            title={(
                <Row justify='space-between' align='middle'>
                    <Col span={12}>
                        <Text strong>{t('annotation-page_standard-workspace_objects-side-bar_color-picker_tsx.Selectcolor', 'Select color')}</Text>
                    </Col>
                    <Col span={4}>
                        <CVATTooltip title='Close'>
                            <Button
                                className='cvat-color-picker-close-button'
                                type='link'
                                onClick={() => {
                                    changeVisible(false);
                                }}
                            >
                                <CloseOutlined />
                            </Button>
                        </CVATTooltip>
                    </Col>
                </Row>
            )}
            placement={placement || 'left'}
            overlayClassName='cvat-label-color-picker'
            trigger='click'
            visible={typeof visible === 'boolean' ? visible : pickerVisible}
            onVisibleChange={changeVisible}
        >
            {children}
        </Popover>
    );
}

export default React.forwardRef(ColorPicker);
