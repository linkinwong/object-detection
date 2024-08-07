// Copyright (C) 2023-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons/lib/icons';
import Text from 'antd/lib/typography/Text';
import InputNumber from 'antd/lib/input-number';
import { Col, Row } from 'antd/lib/grid';
import Divider from 'antd/lib/divider';
import Form, { FormInstance } from 'antd/lib/form';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import CVATTooltip from 'components/common/cvat-tooltip';
import { QualitySettings } from 'cvat-core-wrapper';
import { useTranslation } from 'react-i18next';

interface FormProps {
    form: FormInstance;
    settings: QualitySettings;
}

export default function QualitySettingsForm(props: FormProps): JSX.Element | null {
    const { form, settings } = props;
    const { t } = useTranslation();

    const initialValues = {
        lowOverlapThreshold: settings.lowOverlapThreshold * 100,
        iouThreshold: settings.iouThreshold * 100,
        compareAttributes: settings.compareAttributes,

        oksSigma: settings.oksSigma * 100,

        lineThickness: settings.lineThickness * 100,
        lineOrientationThreshold: settings.lineOrientationThreshold * 100,
        orientedLines: settings.orientedLines,

        compareGroups: settings.compareGroups,
        groupMatchThreshold: settings.groupMatchThreshold * 100,

        checkCoveredAnnotations: settings.checkCoveredAnnotations,
        objectVisibilityThreshold: settings.objectVisibilityThreshold * 100,
        panopticComparison: settings.panopticComparison,
    };

    const generalTooltip = (
        <div className='cvat-analytics-settings-tooltip-inner'>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.MinoverlapthresholdI', 'Min overlap threshold(IoU) is used for distinction between matched / unmatched shapes.')}
            </Text>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.Lowoverlapthresholdi', 'Low overlap threshold is used for distinction between strong / weak (low overlap) matches.')}
            </Text>
        </div>
    );

    const keypointTooltip = (
        <div className='cvat-analytics-settings-tooltip-inner'>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.ObjectKeypointSimila', 'Object Keypoint Similarity (OKS) is like IoU, but for skeleton points.')}
            </Text>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.TheSigmavalueisthepe', 'The Sigma value is the percent of the skeleton bbox area ^ 0.5.\n' +
                'Used as the radius of the circle around a GT point,\n' +
                'where the checked point is expected to be.')}

            </Text>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.Thevalueisalsousedto', 'The value is also used to match single point annotations, in which case\n' +
                'the bbox is the whole image. For point groups the bbox is taken\n' +
                'for the whole group.')}
            </Text>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.Ifthereisarectanglea', 'If there is a rectangle annotation in the points group or skeleton,\n' +
                'it is used as the group bbox (supposing the whole group describes a single object).')}
            </Text>
        </div>
    );

    const linesTooltip = (
        <div className='cvat-analytics-settings-tooltip-inner'>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.Linethicknessthickne', 'Line thickness - thickness of polylines, relatively to the (image area) ^ 0.5.\n' +
                'The distance to the boundary around the GT line,\n' +
                'inside of which the checked line points should be.')}
            </Text>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.CheckorientationIndi', 'Check orientation - Indicates that polylines have direction.')}
            </Text>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.MinsimilaritygainThe', 'Min similarity gain - The minimal gain in the GT IoU between the given and reversed line directions\n' +
                'to consider the line inverted. Only useful with the Check orientation parameter.')}
            </Text>
        </div>
    );

    const groupTooltip = (
        <div className='cvat-analytics-settings-tooltip-inner'>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.ComparegroupsEnables', 'Compare groups - Enables or disables annotation group checks.')}
            </Text>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.Mingroupmatchthresho', 'Min group match threshold - Minimal IoU for groups to be considered matching,\n' +
                'used when the Compare groups is enabled.')}
            </Text>
        </div>
    );

    const segmentationTooltip = (
        <div className='cvat-analytics-settings-tooltip-inner'>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.Checkobjectvisibilit', 'Check object visibility - Check for partially-covered annotations.')}
            </Text>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.Minvisibilitythresho', 'Min visibility threshold - Minimal visible area percent of the spatial annotations (polygons, masks)\n' +
                'for reporting covered annotations, useful with the Check object visibility option.')}
            </Text>
            <Text>
                {t('analytics-page_task-quality_quality-settings-form_tsx.Matchonlyvisiblepart', 'Match only visible parts - Use only the visible part of the masks and polygons in comparisons.')}
            </Text>
        </div>
    );

    return (
        <Form
            form={form}
            layout='vertical'
            initialValues={initialValues}
        >
            <Row className='cvat-quality-settings-title'>
                <Text strong>
                    {t('analytics-page_task-quality_quality-settings-form_tsx.General', 'General')}
                </Text>
                <CVATTooltip title={generalTooltip} className='cvat-analytics-tooltip' overlayStyle={{ maxWidth: '500px' }}>
                    <QuestionCircleOutlined
                        style={{ opacity: 0.5 }}
                    />
                </CVATTooltip>
            </Row>
            <Row>
                <Col span={12}>
                    <Form.Item
                        name='iouThreshold'
                        label='Min overlap threshold (%)'
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} max={100} precision={0} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name='lowOverlapThreshold'
                        label='Low overlap threshold (%)'
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} max={100} precision={0} />
                    </Form.Item>
                </Col>
            </Row>
            <Row>
                <Col span={12}>
                    <Form.Item
                        name='compareAttributes'
                        valuePropName='checked'
                        rules={[{ required: true }]}
                    >
                        <Checkbox>
                            <Text className='cvat-text-color'>
                                {t('analytics-page_task-quality_quality-settings-form_tsx.Compareattributes', 'Compare attributes')}
                            </Text>
                        </Checkbox>
                    </Form.Item>
                </Col>
            </Row>
            <Divider />
            <Row className='cvat-quality-settings-title'>
                <Text strong>
                    {t('analytics-page_task-quality_quality-settings-form_tsx.KeypointComparison', 'Keypoint Comparison')}
                </Text>
                <CVATTooltip title={keypointTooltip} className='cvat-analytics-tooltip' overlayStyle={{ maxWidth: '500px' }}>
                    <QuestionCircleOutlined
                        style={{ opacity: 0.5 }}
                    />
                </CVATTooltip>
            </Row>
            <Row>
                <Col span={12}>
                    <Form.Item
                        name='oksSigma'
                        label='OKS sigma (bbox side %)'
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} max={100} precision={0} />
                    </Form.Item>
                </Col>
            </Row>
            <Divider />
            <Row className='cvat-quality-settings-title'>
                <Text strong>
                    {t('analytics-page_task-quality_quality-settings-form_tsx.LineComparison', 'Line Comparison')}
                </Text>
                <CVATTooltip title={linesTooltip} className='cvat-analytics-tooltip' overlayStyle={{ maxWidth: '500px' }}>
                    <QuestionCircleOutlined
                        style={{ opacity: 0.5 }}
                    />
                </CVATTooltip>
            </Row>
            <Row>
                <Col span={12}>
                    <Form.Item
                        name='lineThickness'
                        label='Relative thickness (frame side %)'
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} max={1000} precision={0} />
                    </Form.Item>
                </Col>
            </Row>
            <Row>
                <Col span={12}>
                    <Form.Item
                        name='orientedLines'
                        rules={[{ required: true }]}
                        valuePropName='checked'
                    >
                        <Checkbox>
                            <Text className='cvat-text-color'>
                                {t('analytics-page_task-quality_quality-settings-form_tsx.Checkorientation', 'Check orientation')}
                            </Text>
                        </Checkbox>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name='lineOrientationThreshold'
                        label='Min similarity gain (%)'
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} max={100} precision={0} />
                    </Form.Item>
                </Col>
            </Row>
            <Divider />
            <Row className='cvat-quality-settings-title'>
                <Text strong>
                    {t('analytics-page_task-quality_quality-settings-form_tsx.Checkorientation', 'Group Comparison')}
                </Text>
                <CVATTooltip title={groupTooltip} className='cvat-analytics-tooltip' overlayStyle={{ maxWidth: '500px' }}>
                    <QuestionCircleOutlined
                        style={{ opacity: 0.5 }}
                    />
                </CVATTooltip>
            </Row>
            <Row>
                <Col span={12}>
                    <Form.Item
                        name='compareGroups'
                        valuePropName='checked'
                        rules={[{ required: true }]}
                    >
                        <Checkbox>
                            <Text className='cvat-text-color'>
                                {t('analytics-page_task-quality_quality-settings-form_tsx.GroupComparison', 'Compare groups')}
                            </Text>
                        </Checkbox>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name='groupMatchThreshold'
                        label='Min group match threshold (%)'
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} max={100} precision={0} />
                    </Form.Item>
                </Col>
            </Row>
            <Divider />
            <Row className='cvat-quality-settings-title'>
                <Text strong>
                    Segmentation Comparison
                </Text>
                <CVATTooltip title={segmentationTooltip} className='cvat-analytics-tooltip' overlayStyle={{ maxWidth: '500px' }}>
                    <QuestionCircleOutlined
                        style={{ opacity: 0.5 }}
                    />
                </CVATTooltip>
            </Row>
            <Row>
                <Col span={12}>
                    <Form.Item
                        name='checkCoveredAnnotations'
                        valuePropName='checked'
                        rules={[{ required: true }]}
                    >
                        <Checkbox>
                            <Text className='cvat-text-color'>
                                {t('analytics-page_task-quality_quality-settings-form_tsx.Checkobjectvisibilit_1', 'Check object visibility')}
                            </Text>
                        </Checkbox>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name='objectVisibilityThreshold'
                        label='Min visibility threshold (area %)'
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} max={100} precision={0} />
                    </Form.Item>
                </Col>
            </Row>
            <Row>
                <Col span={12}>
                    <Form.Item
                        name='panopticComparison'
                        valuePropName='checked'
                        rules={[{ required: true }]}
                    >
                        <Checkbox>
                            <Text className='cvat-text-color'>
                                {t('analytics-page_task-quality_quality-settings-form_tsx.Matchonlyvisiblepart_1', 'Match only visible parts')}
                            </Text>
                        </Checkbox>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );
}
