// Copyright (C) 2021-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React, { CSSProperties } from 'react';
import ReactDOM from 'react-dom';
import Text from 'antd/lib/typography/Text';
import Slider from 'antd/lib/slider';
import { Col, Row } from 'antd/lib/grid';

interface Props {
    approxPolyAccuracy: number;
    onChange(value: number): void;
}

export const MAX_ACCURACY = 13;

export const marks: Record<number, { style: CSSProperties; label: JSX.Element }> = {};
marks[0] = {
    style: {
        color: '#1890ff',
    },
    // label: <strong>{t('annotation-page_standard-workspace_controls-side-bar_approximation-accuracy_tsx.less', 'less')}</strong>,
    label: <strong>更少</strong>,
};
marks[MAX_ACCURACY] = {
    style: {
        color: '#61c200',
    },
    // label: <strong>{t('annotation-page_standard-workspace_controls-side-bar_approximation-accuracy_tsx.more', 'more')}</strong>,
    label: <strong>更多</strong>,
};

export function thresholdFromAccuracy(approxPolyAccuracy: number): number {
    const approxPolyMaxDistance = MAX_ACCURACY - approxPolyAccuracy;
    let threshold = 0;
    if (approxPolyMaxDistance > 0) {
        if (approxPolyMaxDistance <= 8) {
            // −2.75x+7y+1=0 linear made from two points (1; 0.25) and (8; 3)
            threshold = (2.75 * approxPolyMaxDistance - 1) / 7;
        } else {
            // 4 for 9, 8 for 10, 16 for 11, 32 for 12, 64 for 13
            threshold = 2 ** (approxPolyMaxDistance - 7);
        }
    }

    return threshold;
}

function ApproximationAccuracy(props: Props): React.ReactPortal | null {
    const { t } = useTranslation();
    const { approxPolyAccuracy, onChange } = props;
    const target = window.document.getElementsByClassName('cvat-canvas-container')[0];

    return target ?
        ReactDOM.createPortal(
            <Row align='middle' className='cvat-approx-poly-threshold-wrapper'>
                <Col span={5}>
                    <Text>{t('annotation-page_standard-workspace_controls-side-bar_approximation-accuracy_tsx.Points', 'Points:')} </Text>
                </Col>
                <Col offset={1} span={18}>
                    <Slider
                        value={approxPolyAccuracy}
                        min={0}
                        max={MAX_ACCURACY}
                        step={1}
                        dots
                        tooltipVisible={false}
                        onChange={onChange}
                        marks={marks}
                    />
                </Col>
            </Row>,
            target,
        ) :
        null;
}

export default React.memo(ApproximationAccuracy);
