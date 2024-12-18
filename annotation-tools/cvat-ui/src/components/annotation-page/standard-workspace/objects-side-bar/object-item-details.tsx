// Copyright (C) 2021-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React from 'react';
import { Row } from 'antd/lib/grid';
import Text from 'antd/lib/typography/Text';
import Collapse from 'antd/lib/collapse';

import ItemAttribute from './object-item-attribute';

interface Props {
    readonly: boolean;
    collapsed: boolean;
    attributes: any[];
    values: Record<number, string>;
    changeAttribute(attrID: number, value: string): void;
    collapse(): void;
}

export function attrValuesAreEqual(next: Record<number, string>, prev: Record<number, string>): boolean {
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);

    return (
        nextKeys.length === prevKeys.length &&
        nextKeys.map((key: string): boolean => prev[+key] === next[+key]).every((value: boolean) => value)
    );
}

function attrAreTheSame(prevProps: Props, nextProps: Props): boolean {
    return (
        nextProps.readonly === prevProps.readonly &&
        nextProps.collapsed === prevProps.collapsed &&
        nextProps.attributes === prevProps.attributes &&
        attrValuesAreEqual(nextProps.values, prevProps.values)
    );
}

function ItemAttributesComponent(props: Props): JSX.Element {
    const {
        collapsed, attributes, values, readonly, changeAttribute, collapse,
    } = props;
    const { t } = useTranslation();

    return (
        <Row>
            <Collapse
                className='cvat-objects-sidebar-state-item-collapse'
                activeKey={collapsed ? [] : ['details']}
                onChange={collapse}
            >
                <Collapse.Panel header={<Text style={{ fontSize: 10 }} type='secondary'>{t('annotation-page_standard-workspace_objects-side-bar_object-item-details_tsx.DETAILS', 'DETAILS')}</Text>} key='details'>
                    {attributes.map(
                        (attribute: any): JSX.Element => (
                            <Row
                                key={attribute.id}
                                align='middle'
                                justify='start'
                                className='cvat-object-item-attribute-wrapper'
                            >
                                <ItemAttribute
                                    readonly={readonly}
                                    attrValue={values[attribute.id]}
                                    attrInputType={attribute.inputType}
                                    attrName={attribute.name}
                                    attrID={attribute.id}
                                    attrValues={attribute.values}
                                    changeAttribute={changeAttribute}
                                />
                            </Row>
                        ),
                    )}
                </Collapse.Panel>
            </Collapse>
        </Row>
    );
}

export default React.memo(ItemAttributesComponent, attrAreTheSame);
