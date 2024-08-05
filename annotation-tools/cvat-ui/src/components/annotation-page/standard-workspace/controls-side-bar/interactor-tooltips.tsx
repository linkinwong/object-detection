// Copyright (C) 2021-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Image from 'antd/lib/image';
import Paragraph from 'antd/lib/typography/Paragraph';
import Text from 'antd/lib/typography/Text';
import { useTranslation } from 'react-i18next';

interface Props {
    name?: string;
    gif?: string;
    message?: string;
    withNegativePoints?: boolean;
}

function InteractorTooltips(props: Props): JSX.Element {
    const {
        name, gif, message, withNegativePoints,
    } = props;
    const UNKNOWN_MESSAGE = 'Selected interactor does not have a help message';
    const desc = message || UNKNOWN_MESSAGE;
    const { t } = useTranslation();
    return (
        <div className='cvat-interactor-tip-container'>
            {name ? (
                <>
                    <Paragraph>{desc}</Paragraph>
                    <Paragraph>
                        <Text>
                            {t('annotation-page_standard-workspace_controls-side-bar_interactor-tooltips_tsx.Youcanpreventserverr', 'You can prevent server requests holding')}
                        </Text>
                        <Text strong>{' Ctrl '}</Text>
                        <Text>
                            {t('annotation-page_standard-workspace_controls-side-bar_interactor-tooltips_tsx.key', 'key')}
                        </Text>
                    </Paragraph>
                    <Paragraph>
                        <Text>
                            {t('annotation-page_standard-workspace_controls-side-bar_interactor-tooltips_tsx.Positivepointscanbea', 'Positive points can be added by left-clicking the image. ')}
                        </Text>
                        {withNegativePoints ? (
                            <Text>
                                {t('annotation-page_standard-workspace_controls-side-bar_interactor-tooltips_tsx.Negativepointscanbea', 'Negative points can be added by right-clicking the image. ')}
                            </Text>
                        ) : null}
                    </Paragraph>
                    {gif ? <Image className='cvat-interactor-tip-image' alt='Example gif' src={gif} /> : null}
                </>
            ) : (
                <Text>
                    {t('annotation-page_standard-workspace_controls-side-bar_interactor-tooltips_tsx.Selectaninteractorto', 'Select an interactor to see help message')}
                </Text>
            )}
        </div>
    );
}

export default React.memo(InteractorTooltips);
