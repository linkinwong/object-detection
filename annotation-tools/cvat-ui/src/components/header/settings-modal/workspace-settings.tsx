// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React from 'react';

import { Row, Col } from 'antd/lib/grid';
import Checkbox, { CheckboxChangeEvent } from 'antd/lib/checkbox';
import InputNumber from 'antd/lib/input-number';
import Text from 'antd/lib/typography/Text';
import Slider from 'antd/lib/slider';
import Select from 'antd/lib/select';

import {
    MAX_ACCURACY,
    marks,
} from 'components/annotation-page/standard-workspace/controls-side-bar/approximation-accuracy';
import { clamp } from 'utils/math';

interface Props {
    autoSave: boolean;
    autoSaveInterval: number;
    aamZoomMargin: number;
    showAllInterpolationTracks: boolean;
    showObjectsTextAlways: boolean;
    automaticBordering: boolean;
    intelligentPolygonCrop: boolean;
    defaultApproxPolyAccuracy: number;
    textFontSize: number;
    controlPointsSize: number;
    textPosition: 'center' | 'auto';
    textContent: string;
    showTagsOnFrame: boolean;
    onSwitchAutoSave(enabled: boolean): void;
    onChangeAutoSaveInterval(interval: number): void;
    onChangeAAMZoomMargin(margin: number): void;
    onChangeDefaultApproxPolyAccuracy(approxPolyAccuracy: number): void;
    onSwitchShowingInterpolatedTracks(enabled: boolean): void;
    onSwitchShowingObjectsTextAlways(enabled: boolean): void;
    onSwitchAutomaticBordering(enabled: boolean): void;
    onSwitchIntelligentPolygonCrop(enabled: boolean): void;
    onChangeTextFontSize(fontSize: number): void;
    onChangeControlPointsSize(pointsSize: number): void;
    onChangeTextPosition(position: 'auto' | 'center'): void;
    onChangeTextContent(textContent: string[]): void;
    onSwitchShowingTagsOnFrame(enabled: boolean): void;
}

function WorkspaceSettingsComponent(props: Props): JSX.Element {
    const {
        autoSave,
        autoSaveInterval,
        aamZoomMargin,
        showAllInterpolationTracks,
        showObjectsTextAlways,
        automaticBordering,
        intelligentPolygonCrop,
        defaultApproxPolyAccuracy,
        textFontSize,
        controlPointsSize,
        textPosition,
        textContent,
        showTagsOnFrame,
        onSwitchAutoSave,
        onChangeAutoSaveInterval,
        onChangeAAMZoomMargin,
        onSwitchShowingInterpolatedTracks,
        onSwitchShowingObjectsTextAlways,
        onSwitchAutomaticBordering,
        onSwitchIntelligentPolygonCrop,
        onChangeDefaultApproxPolyAccuracy,
        onChangeTextFontSize,
        onChangeControlPointsSize,
        onChangeTextPosition,
        onChangeTextContent,
        onSwitchShowingTagsOnFrame,
    } = props;
    const { t } = useTranslation();

    const minAutoSaveInterval = 1;
    const maxAutoSaveInterval = 60;
    const minAAMMargin = 0;
    const maxAAMMargin = 1000;
    const minControlPointsSize = 4;
    const maxControlPointsSize = 8;

    return (
        <div className='cvat-workspace-settings'>
            <Row className='cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color cvat-workspace-settings-auto-save'
                        checked={autoSave}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onSwitchAutoSave(event.target.checked);
                        }}
                    >
                        {t('header_settings-modal_workspace-settings_tsx.Enableautosave', 'Enable auto save')}
                    </Checkbox>
                </Col>
                <Col className='cvat-workspace-settings-auto-save-interval'>
                    <Text type='secondary'> {t('header_settings-modal_workspace-settings_tsx.Autosaveevery', 'Auto save every')} </Text>
                    <InputNumber
                        size='small'
                        min={minAutoSaveInterval}
                        max={maxAutoSaveInterval}
                        step={1}
                        value={Math.round(autoSaveInterval / (60 * 1000))}
                        onChange={(value: number | undefined | string): void => {
                            if (typeof value !== 'undefined') {
                                onChangeAutoSaveInterval(
                                    Math.floor(clamp(+value, minAutoSaveInterval, maxAutoSaveInterval)) * 60 * 1000,
                                );
                            }
                        }}
                    />
                    <Text type='secondary'> {t('header_settings-modal_workspace-settings_tsx.minutes', 'minutes')} </Text>
                </Col>
            </Row>
            <Row className='cvat-player-setting'>
                <Col span={12} className='cvat-workspace-settings-show-interpolated'>
                    <Row>
                        <Checkbox
                            className='cvat-text-color'
                            checked={showAllInterpolationTracks}
                            onChange={(event: CheckboxChangeEvent): void => {
                                onSwitchShowingInterpolatedTracks(event.target.checked);
                            }}
                        >
                            {t('header_settings-modal_workspace-settings_tsx.Showallinterpolation', 'Show all interpolation tracks')}
                        </Checkbox>
                    </Row>
                    <Row>
                        <Text type='secondary'> {t('header_settings-modal_workspace-settings_tsx.Showhiddeninterpolat', 'Show hidden interpolated objects in the side panel')}</Text>
                    </Row>
                </Col>
            </Row>
            <Row className='cvat-workspace-settings-show-text-always cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={showObjectsTextAlways}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onSwitchShowingObjectsTextAlways(event.target.checked);
                        }}
                    >
                        {t('header_settings-modal_workspace-settings_tsx.Alwaysshowobjectdeta', 'Always show object details')}
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>
                        {t('header_settings-modal_workspace-settings_tsx.Showtextforanobjecto', 'Show text for an object on the canvas not only when the object is activated')}
                    </Text>
                </Col>
            </Row>
            <Row className='cvat-workspace-settings-text-settings cvat-player-setting'>
                <Col span={24}>
                    <Text>{t('header_settings-modal_workspace-settings_tsx.Contentofatext', 'Content of a text')}</Text>
                </Col>
                <Col span={16}>
                    <Select
                        className='cvat-workspace-settings-text-content'
                        mode='multiple'
                        value={textContent.split(',').filter((entry: string) => !!entry)}
                        onChange={onChangeTextContent}
                    >
                        <Select.Option value='id'>ID</Select.Option>
                        <Select.Option value='label'>{t('header_settings-modal_workspace-settings_tsx.Label', 'Label')}</Select.Option>
                        <Select.Option value='attributes'>{t('header_settings-modal_workspace-settings_tsx.Attributes', 'Attributes')}</Select.Option>
                        <Select.Option value='source'>{t('header_settings-modal_workspace-settings_tsx.Source', 'Source')}</Select.Option>
                        <Select.Option value='descriptions'>{t('header_settings-modal_workspace-settings_tsx.Descriptions', 'Descriptions')}</Select.Option>
                    </Select>
                </Col>
            </Row>
            <Row className='cvat-workspace-settings-text-settings cvat-player-setting'>
                <Col span={12}>
                    <Text>{t('header_settings-modal_workspace-settings_tsx.Positionofatext', 'Position of a text')}</Text>
                </Col>
                <Col span={12}>
                    <Text>{t('header_settings-modal_workspace-settings_tsx.Fontsizeofatext', 'Font size of a text')}</Text>
                </Col>
                <Col span={12}>
                    <Select
                        className='cvat-workspace-settings-text-position'
                        value={textPosition}
                        onChange={onChangeTextPosition}
                    >
                        <Select.Option value='auto'>{t('header_settings-modal_workspace-settings_tsx.Auto', 'Auto')}</Select.Option>
                        <Select.Option value='center'>{t('header_settings-modal_workspace-settings_tsx.Center', 'Center')}</Select.Option>
                    </Select>
                </Col>
                <Col span={12}>
                    <InputNumber
                        className='cvat-workspace-settings-text-size'
                        onChange={onChangeTextFontSize}
                        min={8}
                        max={20}
                        value={textFontSize}
                    />
                </Col>
            </Row>
            <Row className='cvat-workspace-settings-autoborders cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={automaticBordering}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onSwitchAutomaticBordering(event.target.checked);
                        }}
                    >
                        {t('header_settings-modal_workspace-settings_tsx.Automaticbordering', 'Automatic bordering')}
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>
                        {t('header_settings-modal_workspace-settings_tsx.Enableautomaticborde', 'Enable automatic bordering for polygons and polylines during drawing/editing')}
                    </Text>
                </Col>
            </Row>
            <Row className='cvat-workspace-settings-intelligent-polygon-cropping cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={intelligentPolygonCrop}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onSwitchIntelligentPolygonCrop(event.target.checked);
                        }}
                    >
                        {t('header_settings-modal_workspace-settings_tsx.Intelligentpolygoncr', 'Intelligent polygon cropping')}
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>{t('header_settings-modal_workspace-settings_tsx.Trytocroppolygonsaut', 'Try to crop polygons automatically when editing')}</Text>
                </Col>
            </Row>
            <Row className='cvat-workspace-settings-show-frame-tags cvat-player-setting'>
                <Col span={24}>
                    <Checkbox
                        className='cvat-text-color'
                        checked={showTagsOnFrame}
                        onChange={(event: CheckboxChangeEvent): void => {
                            onSwitchShowingTagsOnFrame(event.target.checked);
                        }}
                    >
                        {t('header_settings-modal_workspace-settings_tsx.Showtagsonframe', 'Show tags on frame')}
                    </Checkbox>
                </Col>
                <Col span={24}>
                    <Text type='secondary'>{t('header_settings-modal_workspace-settings_tsx.Showframetagsintheco', 'Show frame tags in the corner of the workspace')}</Text>
                </Col>
            </Row>
            <Row className='cvat-workspace-settings-aam-zoom-margin cvat-player-setting'>
                <Col>
                    <Text className='cvat-text-color'> {t('header_settings-modal_workspace-settings_tsx.Attributeannotationm', 'Attribute annotation mode (AAM) zoom margin')} </Text>
                    <InputNumber
                        min={minAAMMargin}
                        max={maxAAMMargin}
                        value={aamZoomMargin}
                        onChange={(value: number | undefined | string): void => {
                            if (typeof value !== 'undefined') {
                                onChangeAAMZoomMargin(Math.floor(clamp(+value, minAAMMargin, maxAAMMargin)));
                            }
                        }}
                    />
                </Col>
            </Row>
            <Row className='cvat-workspace-settings-control-points-size cvat-player-setting'>
                <Col>
                    <Text className='cvat-text-color'> {t('header_settings-modal_workspace-settings_tsx.Controlpointssize', 'Control points size')} </Text>
                    <InputNumber
                        min={minControlPointsSize}
                        max={maxControlPointsSize}
                        value={controlPointsSize}
                        onChange={(value: number | undefined | string): void => {
                            if (typeof value !== 'undefined') {
                                onChangeControlPointsSize(
                                    Math.floor(clamp(+value, minControlPointsSize, maxControlPointsSize)),
                                );
                            }
                        }}
                    />
                </Col>
            </Row>
            <Row className='cvat-workspace-settings-approx-poly-threshold cvat-player-setting'>
                <Col>
                    <Text className='cvat-text-color'>{t('header_settings-modal_workspace-settings_tsx.Defaultnumberofpoint', 'Default number of points in polygon approximation')}</Text>
                </Col>
                <Col span={7} offset={1}>
                    <Slider
                        min={0}
                        max={MAX_ACCURACY}
                        step={1}
                        value={defaultApproxPolyAccuracy}
                        dots
                        onChange={onChangeDefaultApproxPolyAccuracy}
                        marks={marks}
                    />
                </Col>
                <Col>
                    <Text type='secondary'>{t('header_settings-modal_workspace-settings_tsx.Worksforserverlessin', 'Works for serverless interactors and OpenCV scissors')}</Text>
                </Col>
            </Row>
        </div>
    );
}

export default React.memo(WorkspaceSettingsComponent);