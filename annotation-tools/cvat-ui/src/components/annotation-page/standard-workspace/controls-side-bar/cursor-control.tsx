// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Icon from '@ant-design/icons';

import { CursorIcon } from 'icons';
import { ActiveControl } from 'reducers';
import { Canvas } from 'cvat-canvas-wrapper';
import { Canvas3d } from 'cvat-canvas3d-wrapper';
import CVATTooltip from 'components/common/cvat-tooltip';
import GlobalHotKeys, { KeyMapItem } from 'utils/mousetrap-react';
import { useTranslation } from "react-i18next";

export interface Props {
    canvasInstance: Canvas | Canvas3d;
    cursorShortkey: string;
    activeControl: ActiveControl;
    shortcuts: {
        CANCEL: {
            details: KeyMapItem;
            displayValue: string;
        };
    }
}

function CursorControl(props: Props): JSX.Element {
    const {
        canvasInstance, activeControl, cursorShortkey, shortcuts,
    } = props;

    const handler = (): void => {
        if (activeControl !== ActiveControl.CURSOR) {
            canvasInstance.cancel();
        }
    };
    const { t } = useTranslation();

    return (
        <>
            <GlobalHotKeys
                keyMap={{ CANCEL: shortcuts.CANCEL.details }}
                handlers={{
                    CANCEL: (event: KeyboardEvent | undefined) => {
                        if (event) event.preventDefault();
                        handler();
                    },
                }}
            />
            <CVATTooltip title={`${t('annotation-page_standard-workspace_controls-side-bar_cursor-control_tsx.Cursor', 'Cursor')} ${cursorShortkey}`} placement='right'>
                <Icon
                    component={CursorIcon}
                    className={
                        activeControl === ActiveControl.CURSOR ?
                            'cvat-active-canvas-control cvat-cursor-control' :
                            'cvat-cursor-control'
                    }
                    onClick={handler}
                />
            </CVATTooltip>
        </>
    );
}

export default React.memo(CursorControl);
