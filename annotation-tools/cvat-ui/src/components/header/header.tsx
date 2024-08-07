// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT
import './styles.scss';
import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router';
import { Row, Col } from 'antd/lib/grid';
import Icon, {
    SettingOutlined,
    InfoCircleOutlined,
    EditOutlined,
    LoadingOutlined,
    LogoutOutlined,
    GithubOutlined,
    QuestionCircleOutlined,
    CaretDownOutlined,
    ControlOutlined,
    UserOutlined,
    TeamOutlined,
    PlusOutlined,
    MailOutlined,
} from '@ant-design/icons';
import Layout from 'antd/lib/layout';
import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
import Dropdown from 'antd/lib/dropdown';
import Modal from 'antd/lib/modal';
import Text from 'antd/lib/typography/Text';
import notification from 'antd/lib/notification';

import config from 'config';

import { Organization, getCore } from 'cvat-core-wrapper';
import { CVATLogo } from 'icons';
import ChangePasswordDialog from 'components/change-password-modal/change-password-modal';
import CVATTooltip from 'components/common/cvat-tooltip';
import { switchSettingsModalVisible as switchSettingsModalVisibleAction } from 'actions/settings-actions';
import { logoutAsync, authActions } from 'actions/auth-actions';
import { shortcutsActions } from 'actions/shortcuts-actions';
import { AboutState, CombinedState } from 'reducers';
import { useIsMounted, usePlugins } from 'utils/hooks';
import GlobalHotKeys, { KeyMap } from 'utils/mousetrap-react';
import { useTranslation } from 'react-i18next';
import SettingsModal from './settings-modal/settings-modal';
import OrganizationsSearch from './organizations-search';
import { ABreadcrumb } from '../common/breadcrumb';
import * as wsAction from 'actions/ws-actions';
import { connectAction } from 'actions/ws-actions';

interface StateToProps {
    ws: any;
    user: any;
    about: AboutState;
    keyMap: KeyMap;
    switchSettingsShortcut: string;
    settingsModalVisible: boolean;
    shortcutsModalVisible: boolean;
    changePasswordDialogShown: boolean;
    changePasswordFetching: boolean;
    logoutFetching: boolean;
    renderChangePasswordItem: boolean;
    isAnalyticsPluginActive: boolean;
    isModelsPluginActive: boolean;
    organizationFetching: boolean;
    currentOrganization: any | null;
}

interface DispatchToProps {
    wsStoreMsg: (item: any) => void;
    transEndAction: () => void;
    wsConnect: () => void;
    onLogout: () => void;
    switchSettingsModalVisible: (visible: boolean) => void;
    switchShortcutsModalVisible: (visible: boolean) => void;
    switchChangePasswordModalVisible: (visible: boolean) => void;
}

const core = getCore();

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        auth: {
            user,
            fetching: logoutFetching,
            fetching: changePasswordFetching,
            showChangePasswordDialog: changePasswordDialogShown,
        },
        plugins: { list },
        about,
        shortcuts: { normalizedKeyMap, keyMap, visibleShortcutsHelp: shortcutsModalVisible },
        settings: { showDialog: settingsModalVisible },
        organizations: { fetching: organizationFetching, current: currentOrganization },
        serverAPI: {
            configuration: {
                isPasswordChangeEnabled: renderChangePasswordItem,
            },
        },
        ws
    } = state;

    return {
        ws,
        user,
        about,
        switchSettingsShortcut: normalizedKeyMap.SWITCH_SETTINGS,
        keyMap,
        settingsModalVisible,
        shortcutsModalVisible,
        changePasswordDialogShown,
        changePasswordFetching,
        logoutFetching,
        renderChangePasswordItem,
        isAnalyticsPluginActive: list.ANALYTICS,
        isModelsPluginActive: list.MODELS,
        organizationFetching,
        currentOrganization,
    };
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        wsConnect(): void {
            dispatch(connectAction());
        },
        wsStoreMsg(v: any): void {
            dispatch(wsAction.storeMsgAction(v));
        },
        transEndAction(): void {
            dispatch(wsAction.transEndAction());
        },
        onLogout: (): void => dispatch(logoutAsync()),
        switchShortcutsModalVisible: (visible: boolean): void => dispatch(
            shortcutsActions.switchShortcutsModalVisible(visible),
        ),
        switchSettingsModalVisible: (visible: boolean): void => dispatch(
            switchSettingsModalVisibleAction(visible),
        ),
        switchChangePasswordModalVisible: (visible: boolean): void => dispatch(
            authActions.switchChangePasswordModalVisible(visible),
        ),
    };
}

type Props = StateToProps & DispatchToProps;

function HeaderComponent(props: Props): JSX.Element {
    const { t } = useTranslation();

    const {
        ws,
        wsConnect,
        wsStoreMsg,
        transEndAction,
        user,
        about,
        keyMap,
        logoutFetching,
        changePasswordFetching,
        settingsModalVisible,
        shortcutsModalVisible,
        switchSettingsShortcut,
        renderChangePasswordItem,
        isAnalyticsPluginActive,
        isModelsPluginActive,
        organizationFetching,
        currentOrganization,
        switchSettingsModalVisible,
        switchShortcutsModalVisible,
        switchChangePasswordModalVisible,
    } = props;

    const {
        CHANGELOG_URL, LICENSE_URL, GITHUB_URL, GUIDE_URL, DISCORD_URL,
    } = config;

    const isMounted = useIsMounted();
    const [listFetching, setListFetching] = useState(false);
    const [organizationsList, setOrganizationList] = useState<Organization[] | null>(null);
    const location = useLocation();

    const searchCallback = useCallback((search?: string): Promise<Organization[]> => new Promise((resolve, reject) => {
        const promise = core.organizations.get(search ? { search } : {});

        setListFetching(true);
        promise.then((organizations: Organization[]) => {
            resolve(organizations);
        }).catch((error: unknown) => {
            reject(error);
        }).finally(() => {
            if (isMounted()) {
                setListFetching(false);
            }
        });

    }), []);

    useEffect(() => {
        searchCallback().then((organizations: Organization[]) => {
            if (isMounted()) {
                setOrganizationList(organizations);
            }
        }).catch((error: unknown) => {
            setOrganizationList([]);
            notification.error({
                message: 'Could not receive a list of organizations',
                description: error instanceof Error ? error.message : '',
            });
        });
    }, []);

    useEffect(() => {
        if (!ws.instance) wsConnect();
        const [_, jobPath] = location.pathname.match(/^\/jobs\/(\d+\/\d+)/) || [];

        let currentJobPathId = '';
        if (jobPath) {
            const [tid, jid] = jobPath.split('/') || []
            currentJobPathId = [user?.id, tid, jid].join('_');
        }
        const { instance, msg } = ws;
        if (instance) {
            instance.on((msg: any) => {
                const res = JSON.parse(msg.data);
                const { request_id, data: listXd, status, server_type: type, end_type, user_id } = res;
                if (status === 'registered') {
                    return;
                } else if (status === 'transfend') {
                    transEndAction();
                }

                const list = [];

                if (listXd?.length) {
                    if (type === 'asr') {
                        // audio
                        for (const item of listXd) {
                            if (!item) continue;
                            const [start, end, label, content] = item;
                            list.push({
                                start,
                                end,
                                label,
                                content,
                            });
                        }
                    } else if (type === 'video') {
                        // video
                        for (let j of listXd) {
                            for (let item of j) {
                                if (item.length !== 7) continue;
                                let point = item.slice(2, item.length - 1);

                                point[2] = Number(point[0]) + Number(point[2]);
                                point[3] = Number(point[1]) + Number(point[3]);

                                list.push({
                                    frame: item[0],
                                    content: item[1],
                                    point: point
                                });
                            }
                        }
                    }
                }
                wsStoreMsg({
                    request_id,
                    end_type,
                    list,
                    type,
                    // 当前所在 页面 job == msg job
                    isCurrentJobPath: currentJobPathId === request_id,
                })
            });
        }

    }, [ws.instance, location.pathname]);

    const history = useHistory();

    const subKeyMap = {
        SWITCH_SHORTCUTS: keyMap.SWITCH_SHORTCUTS,
        SWITCH_SETTINGS: keyMap.SWITCH_SETTINGS,
    };

    const handlers = {
        SWITCH_SHORTCUTS: (event: KeyboardEvent) => {
            if (event) event.preventDefault();
            if (!settingsModalVisible) {
                switchShortcutsModalVisible(!shortcutsModalVisible);
            }
        },
        SWITCH_SETTINGS: (event: KeyboardEvent) => {
            if (event) event.preventDefault();
            if (!shortcutsModalVisible) {
                switchSettingsModalVisible(!settingsModalVisible);
            }
        },
    };

    const aboutPlugins = usePlugins((state: CombinedState) => state.plugins.components.about.links.items, props);
    const aboutLinks: [JSX.Element, number][] = [];
    aboutLinks.push([(
        <Col>
            <a href={CHANGELOG_URL} target='_blank' rel='noopener noreferrer'>
                {t('header_header_tsx.Whatsnew')}
            </a>
        </Col>
    ), 0]);
    aboutLinks.push([(
        <Col>
            <a href={LICENSE_URL} target='_blank' rel='noopener noreferrer'>
                MIT License
                {t('header_header_tsx.MITLicense')}
            </a>
        </Col>
    ), 10]);
    aboutLinks.push([(
        <Col>
            <a href={DISCORD_URL} target='_blank' rel='noopener noreferrer'>
                {t('header_header_tsx.FindusonDiscord')}
            </a>
        </Col>
    ), 20]);
    aboutLinks.push(...aboutPlugins.map(({ component: Component, weight }, index: number) => (
        [<Component key={index} targetProps={props} />, weight] as [JSX.Element, number]
    )));

    const showAboutModal = useCallback((): void => {
        Modal.info({
            title: `${about.server.name}`,
            content: (
                <div>
                    <a href={LICENSE_URL} target='_blank' rel='noopener noreferrer'>
                        {/* {t('header_header_tsx.MITLicense_1')} */}
                        {/* <br /> */}
                    </a>
                    {/* <p style={{ whiteSpace: 'pre-line', textIndent: '2em' }}>{`${about.server.description}`}</p> */}
                    {about.server.description.split('\n').map((paragraph: boolean | React.ReactChild | React.ReactFragment | React.ReactPortal | Iterable<React.ReactNode> | null | undefined, index: React.Key | null | undefined) => (
                        <p key={index} style={{ whiteSpace: 'pre-line', textIndent: '2em', marginTop: index === 0 ? 0 : '1em' }}>
                            {paragraph}
                        </p>
                    ))}
                    <p>
                        <Text strong>
                            {' '}
                            {t('header_header_tsx.Serverversion')}
                        </Text>
                        <Text type='secondary'>{` ${about.server.version}`}</Text>
                    </p>
                    <p>
                        <Text strong>{t('header_header_tsx.Coreversion')}</Text>
                        <Text type='secondary'>{` ${about.packageVersion.core}`}</Text>
                    </p>
                    <p>
                        <Text strong>{t('header_header_tsx.Canvasversion')}</Text>
                        <Text type='secondary'>{` ${about.packageVersion.canvas}`}</Text>
                    </p>
                    <p>
                        <Text strong>{t('header_header_tsx.UIversion')}</Text>
                        <Text type='secondary'>{` ${about.packageVersion.ui}`}</Text>
                    </p>
                    {/* <Row justify='space-around'>
                        { aboutLinks.sort((item1, item2) => item1[1] - item2[1])
                            .map((item) => item[0]) }
                    </Row> */}
                </div>
            ),
            width: 800,
            okButtonProps: {
                style: {
                    width: '100px',
                },
            },
        });
    }, [about]);

    const closeSettings = useCallback(() => {
        switchSettingsModalVisible(false);
    }, []);

    const resetOrganization = (): void => {
        localStorage.removeItem('currentOrganization');
        if (/(webhooks)|(\d+)/.test(window.location.pathname)) {
            window.location.pathname = '/';
        } else {
            window.location.reload();
        }
    };

    const setNewOrganization = (organization: any): void => {
        if (!currentOrganization || currentOrganization.slug !== organization.slug) {
            localStorage.setItem('currentOrganization', organization.slug);
            if (/\d+/.test(window.location.pathname)) {
                // a resource is opened (task/job/etc.)
                window.location.pathname = '/';
            } else {
                window.location.reload();
            }
        }
    };

    const plugins = usePlugins((state: CombinedState) => state.plugins.components.header.userMenu.items, props);

    const menuItems: [JSX.Element, number][] = [];
    if (user.isStaff) {
        menuItems.push([(
            <Menu.Item
                icon={<ControlOutlined />}
                key='admin_page'
                onClick={(): void => {
                    window.open('/admin', '_blank');
                }}
            >
                {t('header_header_tsx.Adminpage')}
            </Menu.Item>
        ), 0]);
    }

    const viewType: 'menu' | 'list' = (organizationsList?.length || 0) > 5 ? 'list' : 'menu';
    menuItems.push([(
        <Menu.SubMenu
            disabled={organizationFetching || listFetching}
            key='organization'
            title={t('header_header_tsx.Organization', 'Organization')}
            icon={organizationFetching || listFetching ? <LoadingOutlined /> : <TeamOutlined />}
        >
            {currentOrganization ? (
                <Menu.Item icon={<SettingOutlined />} key='open_organization' onClick={() => history.push('/organization')} className='cvat-header-menu-open-organization'>
                    {t('header_header_tsx.Settings')}
                </Menu.Item>
            ) : null}
            <Menu.Item
                icon={<MailOutlined />}
                className='cvat-header-menu-organization-invitations-item'
                key='invitations'
                onClick={() => {
                    history.push('/invitations');
                }}
            >
                {t('header_header_tsx.Invitations')}
            </Menu.Item>
            <Menu.Item icon={<PlusOutlined />} key='create_organization' onClick={() => history.push('/organizations/create')} className='cvat-header-menu-create-organization'>Create</Menu.Item>
            { !!organizationsList && viewType === 'list' && (
                <Menu.Item
                    key='switch_organization'
                    onClick={() => {
                        Modal.confirm({
                            icon: undefined,
                            title: 'Select an organization',
                            okButtonProps: {
                                style: { display: 'none' },
                            },
                            content: (
                                <OrganizationsSearch
                                    defaultOrganizationList={organizationsList}
                                    resetOrganization={resetOrganization}
                                    searchOrganizations={searchCallback}
                                    setNewOrganization={setNewOrganization}
                                />
                            ),
                        });
                    }}
                >
                    {t('header_header_tsx.Switchorganization')}
                </Menu.Item>
            )}
            { !!organizationsList && viewType === 'menu' && (
                <>
                    <Menu.Divider />
                    <Menu.ItemGroup>
                        <Menu.Item
                            className={!currentOrganization ?
                                'cvat-header-menu-active-organization-item' : 'cvat-header-menu-organization-item'}
                            key='$personal'
                            onClick={resetOrganization}
                        >
                            {t('header_header_tsx.Personalworkspace')}
                        </Menu.Item>
                        {organizationsList.map((organization: any): JSX.Element => (
                            <Menu.Item
                                className={currentOrganization?.slug === organization.slug ?
                                    'cvat-header-menu-active-organization-item' : 'cvat-header-menu-organization-item'}
                                key={organization.slug}
                                onClick={() => setNewOrganization(organization)}
                            >
                                {organization.slug}
                            </Menu.Item>
                        ))}
                    </Menu.ItemGroup>
                </>
            )}
        </Menu.SubMenu>
    ), 10]);

    menuItems.push([(
        <Menu.Item
            icon={<SettingOutlined />}
            key='settings'
            title={`Press ${switchSettingsShortcut} to switch`}
            onClick={() => switchSettingsModalVisible(true)}
        >
            {t('header_header_tsx.Settings_1')}
        </Menu.Item>
    ), 20]);

    menuItems.push([(
        <Menu.Item icon={<InfoCircleOutlined />} key='about' onClick={() => showAboutModal()}>
            {t('header_header_tsx.About')}
        </Menu.Item>
    ), 30]);

    if (renderChangePasswordItem) {
        menuItems.push([(
            <Menu.Item
                key='change_password'
                icon={changePasswordFetching ? <LoadingOutlined /> : <EditOutlined />}
                className='cvat-header-menu-change-password'
                onClick={(): void => switchChangePasswordModalVisible(true)}
                disabled={changePasswordFetching}
            >
                {t('header_header_tsx.Changepassword')}
            </Menu.Item>
        ), 40]);
    }

    menuItems.push([(
        <Menu.Item
            key='logout'
            icon={logoutFetching ? <LoadingOutlined /> : <LogoutOutlined />}
            onClick={() => {
                history.push('/auth/logout');
            }}
            disabled={logoutFetching}
        >
            {t('header_header_tsx.Logout')}
        </Menu.Item>
    ), 50]);

    menuItems.push(
        ...plugins.map(({ component: Component, weight }, index) => (
            [<Component key={index} targetProps={props} />, weight] as [JSX.Element, number]
        )),
    );

    const userMenu = (
        <Menu triggerSubMenuAction='click' className='cvat-header-menu'>
            { menuItems.sort((menuItem1, menuItem2) => menuItem1[1] - menuItem2[1])
                .map((menuItem) => menuItem[0]) }
        </Menu>
    );

    const getButtonClassName = (value: string): string => {
        // eslint-disable-next-line security/detect-non-literal-regexp
        const regex = new RegExp(`${value}$`);
        const baseClass = `cvat-header-${value}-button cvat-header-button`;
        return location.pathname.match(regex) ?
            `${baseClass} cvat-active-header-button` : baseClass;
    };

    return (
        <Layout.Header className="cvat-header z-[111] sticky top-0 !bg-[#f0f2f5]">
            <GlobalHotKeys keyMap={subKeyMap} handlers={handlers} />
            <div className="flex justify-between items-center w-full sticky top-0">
                <ABreadcrumb />
                <div className='cvat-left-header'>
                    <Button
                        className={getButtonClassName('cloudstorages')}
                        type="link"
                        value="cloudstorages"
                        href="/cloudstorages?page=1"
                        onClick={(event: React.MouseEvent): void => {
                            event.preventDefault();
                            history.push('/cloudstorages');
                        }}
                    >
                        {t('header_header_tsx.CloudStorages')}
                    </Button>
                    {isModelsPluginActive ? (
                        <Button
                            className={getButtonClassName('models')}
                            type="link"
                            value="models"
                            href="/models"
                            onClick={(event: React.MouseEvent): void => {
                                event.preventDefault();
                                history.push('/models');
                            }}
                        >
                            {t('header_header_tsx.Models')}
                        </Button>
                    ) : null}
                    {isAnalyticsPluginActive && user.isSuperuser ? (
                        <Button
                            className={getButtonClassName('analytics')}
                            type="link"
                            href="/analytics"
                            onClick={(event: React.MouseEvent): void => {
                                event.preventDefault();
                                window.open('/analytics', '_blank');
                            }}
                        >
                            {t('header_header_tsx.Analytics')}
                        </Button>
                    ) : null}
                </div>
            </div>
            <div className="cvat-right-header">
                <Dropdown
                    trigger={['click']}
                    destroyPopupOnHide
                    placement='bottomRight'
                    overlay={userMenu}
                    className='cvat-header-menu-user-dropdown'
                >
                    <span>
                        <UserOutlined className='cvat-header-dropdown-icon' />
                        <Row>
                            <Col span={24}>
                                <Text strong className='cvat-header-menu-user-dropdown-user'>
                                    {user.username.length > 14 ? `${user.username.slice(0, 10)} ...` : user.username}
                                </Text>
                            </Col>
                            { currentOrganization ? (
                                <Col span={24}>
                                    <Text className='cvat-header-menu-user-dropdown-organization'>
                                        {currentOrganization.slug}
                                    </Text>
                                </Col>
                            ) : null }
                        </Row>
                        <CaretDownOutlined className='cvat-header-dropdown-icon' />
                    </span>
                </Dropdown>
            </div>
            <SettingsModal visible={settingsModalVisible} onClose={closeSettings} />
            {renderChangePasswordItem && (
                <ChangePasswordDialog onClose={() => switchChangePasswordModalVisible(false)} />
            )}
        </Layout.Header>
    );
}

export default connect(mapStateToProps, mapDispatchToProps)(React.memo(HeaderComponent));
