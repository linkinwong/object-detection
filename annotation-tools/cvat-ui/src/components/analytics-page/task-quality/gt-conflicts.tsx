// Copyright (C) 2023-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Text from 'antd/lib/typography/Text';
import { Col, Row } from 'antd/lib/grid';

import { QualityReport, QualitySummary } from 'cvat-core-wrapper';
import { useTranslation } from 'react-i18next';
import AnalyticsCard from '../views/analytics-card';
import { percent, clampValue } from '../utils/text-formatting';

interface Props {
    taskReport: QualityReport | null;
}

interface ConflictTooltipProps {
    reportSummary?: QualitySummary;
}

export function ConflictsTooltip(props: ConflictTooltipProps): JSX.Element {
    const { reportSummary } = props;
    const { t } = useTranslation();
    return (
        <Row className='cvat-analytics-tooltip-conflicts-inner'>
            <Col span={12}>
                <Text>{t('analytics-page_task-quality_gt-conflicts_tsx.Warnings', 'Warnings:')}</Text>
                <Text>
                    {t('analytics-page_task-quality_gt-conflicts_tsx.Lowoverlap', 'Low overlap:')}
                    &nbsp;
                    {reportSummary?.conflictsByType.lowOverlap || 0}
                </Text>
                <Text>
                    {t('analytics-page_task-quality_gt-conflicts_tsx.Mismatchingdirection', 'Mismatching direction:')}
                    &nbsp;
                    {reportSummary?.conflictsByType.mismatchingDirection || 0}
                </Text>
                <Text>
                    {t('analytics-page_task-quality_gt-conflicts_tsx.Mismatchingattribute', 'Mismatching attributes:')}
                    &nbsp;
                    {reportSummary?.conflictsByType.mismatchingAttributes || 0}
                </Text>
                <Text>
                    {t('analytics-page_task-quality_gt-conflicts_tsx.Mismatchinggroups', 'Mismatching groups:')}
                    &nbsp;
                    {reportSummary?.conflictsByType.mismatchingGroups || 0}
                </Text>
                <Text>
                    {t('analytics-page_task-quality_gt-conflicts_tsx.Coveredannotation', 'Covered annotation:')}
                    &nbsp;
                    {reportSummary?.conflictsByType.coveredAnnotation || 0}
                </Text>
            </Col>
            <Col span={12}>
                <Text>{t('analytics-page_task-quality_gt-conflicts_tsx.Errors', 'Errors:')}</Text>
                <Text>
                    {t('analytics-page_task-quality_gt-conflicts_tsx.Missingannotations', 'Missing annotations:')}
                    &nbsp;
                    {reportSummary?.conflictsByType.missingAnnotations || 0}
                </Text>
                <Text>
                    {t('analytics-page_task-quality_gt-conflicts_tsx.Extraannotations', 'Extra annotations:')}
                    &nbsp;
                    {reportSummary?.conflictsByType.extraAnnotations || 0}
                </Text>
                <Text>
                    {t('analytics-page_task-quality_gt-conflicts_tsx.Mismatchinglabel', 'Mismatching label:')}
                    &nbsp;
                    {reportSummary?.conflictsByType.mismatchingLabel || 0}
                </Text>
            </Col>
        </Row>
    );
}

function GTConflicts(props: Props): JSX.Element {
    const { t } = useTranslation();
    const { taskReport } = props;
    let conflictsRepresentation: string | number = 'N/A';
    let reportSummary;
    if (taskReport) {
        reportSummary = taskReport.summary;
        conflictsRepresentation = clampValue(reportSummary?.conflictCount);
    }

    const bottomElement = (
        <>
            <Text type='secondary'>
                {t('analytics-page_task-quality_gt-conflicts_tsx.Errors_1', 'Errors:')}
                {' '}
                {clampValue(reportSummary?.errorCount)}
                {reportSummary?.errorCount ?
                    ` (${percent(reportSummary?.errorCount, reportSummary?.conflictCount)})` :
                    ''}
            </Text>
            <Text type='secondary'>
                {', '}
                {t('analytics-page_task-quality_gt-conflicts_tsx.Warnings_1', 'Warnings:')}
                {' '}
                {clampValue(reportSummary?.warningCount)}
                {reportSummary?.warningCount ?
                    ` (${percent(reportSummary?.warningCount, reportSummary?.conflictCount)})` :
                    ''}
            </Text>
        </>
    );

    return (
        <AnalyticsCard
            title='GT Conflicts'
            className='cvat-task-gt-conflicts'
            value={conflictsRepresentation}
            tooltip={<ConflictsTooltip reportSummary={reportSummary} />}
            size={12}
            bottomElement={bottomElement}
        />
    );
}

export default React.memo(GTConflicts);
