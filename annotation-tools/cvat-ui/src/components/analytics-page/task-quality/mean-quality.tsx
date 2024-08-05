// Copyright (C) 2023-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import moment from 'moment';
import { DownloadOutlined, SettingOutlined } from '@ant-design/icons';
import Text from 'antd/lib/typography/Text';
import Button from 'antd/lib/button';

import { QualityReport, getCore } from 'cvat-core-wrapper';
import { useTranslation } from 'react-i18next';
import AnalyticsCard from '../views/analytics-card';
import { toRepresentation } from '../utils/text-formatting';

interface Props {
    taskID: number;
    taskReport: QualityReport | null;
    setQualitySettingsVisible: (visible: boolean) => void;
}

function MeanQuality(props: Props): JSX.Element {
    const { taskID, taskReport, setQualitySettingsVisible } = props;
    const reportSummary = taskReport?.summary;
    const { t } = useTranslation();
    moment.locale('zh-cn');

    const tooltip = (
        <div className='cvat-analytics-tooltip-inner'>
            <Text>
                {t('analytics-page_task-quality_mean-quality_tsx.Meanannotationqualit', 'Mean annotation quality consists of:')}
            </Text>
            <Text>
                {t('analytics-page_task-quality_mean-quality_tsx.Correctannotations', 'Correct annotations:')}
                &nbsp;
                {reportSummary?.validCount || 0}
            </Text>
            <Text>
                {t('analytics-page_task-quality_mean-quality_tsx.Taskannotations', 'Task annotations:')}
                &nbsp;
                {reportSummary?.dsCount || 0}
            </Text>
            <Text>
                {t('analytics-page_task-quality_mean-quality_tsx.GTannotations', 'GT annotations:')}
                &nbsp;
                {reportSummary?.gtCount || 0}
            </Text>
            <Text>
                {t('analytics-page_task-quality_mean-quality_tsx.Accuracy', 'Accuracy:')}
                &nbsp;
                {toRepresentation(reportSummary?.accuracy)}
            </Text>
            <Text>
                {t('analytics-page_task-quality_mean-quality_tsx.Precision', 'Precision:')}
                &nbsp;
                {toRepresentation(reportSummary?.precision)}
            </Text>
            <Text>
                {t('analytics-page_task-quality_mean-quality_tsx.Recall', 'Recall:')}
                &nbsp;
                {toRepresentation(reportSummary?.recall)}
            </Text>
        </div>
    );

    const downloadReportButton = (
        <div className='cvat-quality-summary-controls'>
            {
                taskReport?.id ? (
                    <Button type='primary' icon={<DownloadOutlined />} className='cvat-analytics-download-report-button'>
                        <a
                            href={`${getCore().config.backendAPI}/quality/reports/${taskReport?.id}/data`}
                            download={`quality-report-task_${taskID}-${taskReport?.id}.json`}
                        >
                            {t('analytics-page_task-quality_mean-quality_tsx.QualityReport', 'Quality Report')}
                        </a>
                    </Button>
                ) : null
            }
            <SettingOutlined
                className='cvat-quality-settings-switch ant-btn ant-btn-default'
                onClick={() => setQualitySettingsVisible(true)}
            />
            {
                taskReport?.id ? (
                    <div className='cvat-analytics-time-hint'>
                        <Text type='secondary'>{taskReport?.createdDate ? moment(taskReport?.createdDate).fromNow() : ''}</Text>
                    </div>
                ) : null
            }
        </div>

    );
    return (
        <AnalyticsCard
            title='Mean annotation quality'
            className='cvat-task-mean-annotation-quality'
            value={toRepresentation(reportSummary?.accuracy)}
            tooltip={tooltip}
            rightElement={downloadReportButton}
        />
    );
}

export default React.memo(MeanQuality);
