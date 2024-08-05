// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Icon from '@ant-design/icons';

import { FitIcon } from 'icons';
import { Canvas } from 'cvat-canvas-wrapper';
import CVATTooltip from 'components/common/cvat-tooltip';
import { useTranslation } from "react-i18next";

export interface Props {
    canvasInstance: Canvas;
}

function FitControl(props: Props): JSX.Element {
    const { canvasInstance } = props;
    const { t } = useTranslation();

    return (
        <CVATTooltip title={t('annotation-page_standard-workspace_controls-side-bar_fit-control_tsx.FitImage', 'Fit the image [Double Click]')} placement='right'>
            <Icon className='cvat-fit-control' component={FitIcon} onClick={(): void => canvasInstance.fit()} />
        </CVATTooltip>
    );
}

export default React.memo(FitControl);
