// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022-2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react';
import { Row, Col } from 'antd/lib/grid';
import Text from 'antd/lib/typography/Text';
import Select from 'antd/lib/select';

import { Label, DimensionType } from 'cvat-core-wrapper';
import GlobalHotKeys, { KeyMap } from 'utils/mousetrap-react';
import { shift } from 'utils/math';
import { useTranslation } from 'react-i18next';

interface ShortcutLabelMap {
    [index: number]: any;
}

type Props = {
    onShortcutPress(event: KeyboardEvent | undefined, labelID: number): void;
    labels: Label[];
};

const defaultShortcutLabelMap = {
    1: '',
    2: '',
    3: '',
    4: '',
    5: '',
    6: '',
    7: '',
    8: '',
    9: '',
    0: '',
} as ShortcutLabelMap;

function ShortcutsSelect(props: Props): JSX.Element {
    const { labels, onShortcutPress } = props;
    const [shortcutLabelMap, setShortcutLabelMap] = useState(defaultShortcutLabelMap);

    const keyMap: KeyMap = {};
    const handlers: {
        [key: string]: (keyEvent?: KeyboardEvent) => void;
    } = {};

    useEffect(() => {
        const newShortcutLabelMap = { ...shortcutLabelMap };
        (labels as any[]).slice(0, 10).forEach((label, index) => {
            newShortcutLabelMap[(index + 1) % 10] = label.id;
        });
        setShortcutLabelMap(newShortcutLabelMap);
    }, []);

    Object.keys(shortcutLabelMap)
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => shortcutLabelMap[id])
        .forEach((id: number): void => {
            const [label] = labels.filter((_label) => _label.id === shortcutLabelMap[id]);
            const key = `SETUP_${id}_TAG`;
            keyMap[key] = {
                name: `Setup ${label.name} tag`,
                description: `Setup tag with "${label.name}" label`,
                sequences: [`${id}`, `shift+${id}`],
                action: 'keydown',
                applicable: [DimensionType.DIMENSION_2D, DimensionType.DIMENSION_3D],
            };

            handlers[key] = (event: KeyboardEvent | undefined) => {
                if (event) {
                    event.preventDefault();
                }
                onShortcutPress(event, label.id as number);
            };
        });

    const onChangeShortcutLabel = (value: string, id: number): void => {
        const newShortcutLabelMap = { ...shortcutLabelMap };
        newShortcutLabelMap[id] = value ? Number.parseInt(value, 10) : '';
        setShortcutLabelMap(newShortcutLabelMap);
    };
    const { t } = useTranslation();
    return (
        <div className='cvat-tag-annotation-label-selects'>
            <GlobalHotKeys keyMap={keyMap as KeyMap} handlers={handlers} />
            <Row>
                <Col>
                    <Text strong>
                        {t('annotation-page_tag-annotation-workspace_tag-annotation-sidebar_shortcuts-select_tsx.Shortcutsforlabels', 'Shortcuts for labels:')}
                    </Text>
                </Col>
            </Row>
            {shift(Object.keys(shortcutLabelMap), 1)
                .slice(0, Math.min(labels.length, 10))
                .map((id) => (
                    <Row key={id}>
                        <Col>
                            <Select
                                value={`${shortcutLabelMap[Number.parseInt(id, 10)]}`}
                                onChange={(value: string) => {
                                    onChangeShortcutLabel(value, Number.parseInt(id, 10));
                                }}
                                style={{ width: 200 }}
                                className='cvat-tag-annotation-label-select'
                            >
                                <Select.Option value=''>
                                    <Text type='secondary'>None</Text>
                                </Select.Option>
                                {(labels as any[]).map((label: any) => (
                                    <Select.Option key={label.id} value={`${label.id}`}>
                                        {label.name}
                                    </Select.Option>
                                ))}
                            </Select>
                            <Text code className='cvat-tag-annotation-shortcut-key'>{`Key ${id}`}</Text>
                        </Col>
                    </Row>
                ))}
        </div>
    );
}

export default ShortcutsSelect;
