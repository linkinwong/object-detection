// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Button from 'antd/lib/button';
import Empty from 'antd/lib/empty';
import Select from 'antd/lib/select';
import Text from 'antd/lib/typography';
import { PlusCircleOutlined } from '@ant-design/icons';

import { CombinedState, ShapeType } from 'reducers';
import MLModel from 'cvat-core/src/ml-model';
import { LabelOptColor } from './common';

interface Props {
    labelNames: string[];
    onCreate: (label: LabelOptColor) => void;
    onCancel: () => void;
}

function compareProps(prevProps: Props, nextProps: Props): boolean {
    return (
        prevProps.onCreate === nextProps.onCreate &&
        prevProps.onCancel === nextProps.onCancel &&
        prevProps.labelNames.length === nextProps.labelNames.length &&
        prevProps.labelNames.every((value: string, index: number) => nextProps.labelNames[index] === value)
    );
}

function PickFromModelComponent(props: Props): JSX.Element {
    const { t } = useTranslation();
    const { onCreate, onCancel, labelNames } = props;
    const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
    const models = useSelector((state: CombinedState) => state.models.detectors);
    const labels = selectedModel?.labels || [];

    return (
        <div className='cvat-label-constructor-pick-from-model'>
            { models.length ? (
                <>
                    <div>
                        <Text>{t('labels-editor_pick-from-model_tsx.Selectamodeltopickla', 'Select a model to pick labels:')}</Text>
                    </div>
                    <Select
                        onSelect={(id: string): void => {
                            setSelectedModel(models.find((_model) => _model.id === id) || null);
                        }}
                    >
                        {models.map((_model) => (
                            <Select.Option value={_model.id} key={_model.id}>{_model.name}</Select.Option>
                        ))}
                    </Select>
                    <Button
                        className='cvat-label-constructor-done-pick-labels-button'
                        type='primary'
                        style={{ width: '150px' }}
                        onClick={onCancel}
                    >
                        {t('labels-editor_pick-from-model_tsx.Done', 'Done')}
                    </Button>
                </>

            ) : (
                <Empty description={(
                    <>
                        <Text>{t('labels-editor_pick-from-model_tsx.Nodeployedmodelsfoun', 'No deployed models found')}</Text>
                        <Button type='primary' onClick={onCancel}>{t('labels-editor_pick-from-model_tsx.Cancel', 'Cancel')}</Button>
                    </>
                )}
                />
            )}

            <div className='cvat-label-constructor-pick-from-model-list'>
                { !!selectedModel && !labels.length && (
                    <Empty description='Labels not found in the specified model' />
                )}
                {labels.map((label) => (
                    <Button
                        type='ghost'
                        key={label.name}
                        disabled={labelNames.includes(label.name)}
                        onClick={() => {
                            if (!labelNames.includes(label.name)) {
                                const generatedLabel: LabelOptColor = {
                                    name: label.name,
                                    type: label.type === 'unknown' ? 'any' : label.type as ShapeType,
                                    attributes: label.attributes.map((attr) => ({
                                        ...attr,
                                        mutable: false,
                                        default_value: attr.values[0],
                                    })),
                                };

                                if (generatedLabel.type === ShapeType.SKELETON && label.sublabels && label.svg) {
                                    generatedLabel.sublabels = label.sublabels.map((sublabel) => ({
                                        name: sublabel.name,
                                        type: sublabel.type === 'unknown' ? 'any' : sublabel.type as ShapeType,
                                        attributes: sublabel.attributes.map((attr) => ({
                                            ...attr,
                                            mutable: false,
                                            default_value: attr.values[0],
                                        })),
                                    }));
                                    generatedLabel.svg = label.svg;
                                }

                                onCreate(generatedLabel);
                            }
                        }}
                    >
                        {label.name}
                        <PlusCircleOutlined />
                    </Button>
                ))}
            </div>
        </div>
    );
}

export default React.memo(PickFromModelComponent, compareProps);
