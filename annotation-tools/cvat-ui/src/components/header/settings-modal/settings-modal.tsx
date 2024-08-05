// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import './styles.scss';
import _ from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Tabs from 'antd/lib/tabs';
import Text from 'antd/lib/typography/Text';
import Modal from 'antd/lib/modal/Modal';
import Button from 'antd/lib/button';
import notification from 'antd/lib/notification';
import Tooltip from 'antd/lib/tooltip';
import { PlayCircleOutlined, LaptopOutlined } from '@ant-design/icons';

import { setSettings } from 'actions/settings-actions';
import WorkspaceSettingsContainer from 'containers/header/settings-modal/workspace-settings';
import PlayerSettingsContainer from 'containers/header/settings-modal/player-settings';
import { CombinedState } from 'reducers';

interface SettingsModalProps {
    visible: boolean;
    onClose(): void;
}

function SettingsModal(props: SettingsModalProps): JSX.Element {
    const { visible, onClose } = props;
    const { t } = useTranslation();

    const settings = useSelector((state: CombinedState) => state.settings);
    const dispatch = useDispatch();

    const onSaveSettings = useCallback(() => {
        const settingsForSaving: any = {};
        for (const [key, value] of Object.entries(settings)) {
            if (['player', 'workspace'].includes(key)) {
                settingsForSaving[key] = value;
            }
        }

        localStorage.setItem('clientSettings', JSON.stringify(settingsForSaving));
        notification.success({
            message: t('analytics-page_shared_quality-settings-modal_tsx.savedSettingsSuccess'),
            className: 'cvat-notification-notice-save-settings-success',
        });

        onClose();
    }, [onClose, settings]);

    useEffect(() => {
        try {
            const newSettings = _.pick(settings, 'player', 'workspace');
            const settingsString = localStorage.getItem('clientSettings') as string;
            if (!settingsString) return;
            const loadedSettings = JSON.parse(settingsString);
            for (const [sectionKey, section] of Object.entries(newSettings)) {
                for (const [key, value] of Object.entries(section)) {
                    let settedValue = value;
                    if (sectionKey in loadedSettings && key in loadedSettings[sectionKey]) {
                        settedValue = loadedSettings[sectionKey][key];
                        Object.defineProperty(newSettings[(sectionKey as 'player' | 'workspace')], key, { value: settedValue });
                    }
                }
            }
            dispatch(setSettings(newSettings));
        } catch {
            notification.error({
                message: t('analytics-page_shared_quality-settings-modal_tsx.loadSettingsFail'),
                className: 'cvat-notification-notice-load-settings-fail',
            });
        }
    }, []);

    return (
        <Modal
            title={t('analytics-page_shared_quality-settings-modal_tsx.Settings')}
            visible={visible}
            onCancel={onClose}
            width={800}
            className='cvat-settings-modal'
            footer={(
                <>
                    <Tooltip title={t('analytics-page_shared_quality-settings-modal_tsx.restoreTitle')}>
                        <Button className='cvat-save-settings-button' type='primary' onClick={onSaveSettings}>
                            {t('header_settings-modal_settings-modal_tsx.Save', 'Save')}
                        </Button>
                    </Tooltip>
                    <Button className='cvat-close-settings-button' type='default' onClick={onClose}>
                        {t('header_settings-modal_settings-modal_tsx.Close', 'Close')}
                    </Button>
                </>
            )}
        >
            <div className='cvat-settings-tabs'>
                <Tabs type='card' tabBarStyle={{ marginBottom: '0px', marginLeft: '-1px' }}>
                    <Tabs.TabPane
                        tab={(
                            <span>
                                <PlayCircleOutlined />
                                <Text>{t('header_settings-modal_settings-modal_tsx.Player', 'Player')}</Text>
                            </span>
                        )}
                        key='player'
                    >
                        <PlayerSettingsContainer />
                    </Tabs.TabPane>
                    <Tabs.TabPane
                        tab={(
                            <span>
                                <LaptopOutlined />
                                <Text>{t('header_settings-modal_settings-modal_tsx.Workspace', 'Workspace')}</Text>
                            </span>
                        )}
                        key='workspace'
                    >
                        <WorkspaceSettingsContainer />
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </Modal>
    );
}

export default React.memo(SettingsModal);
