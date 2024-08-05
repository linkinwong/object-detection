// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022-2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Redirect, Route, Switch } from 'react-router';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { Col, Row } from 'antd/lib/grid';
import Layout from 'antd/lib/layout';
import { Modal, Tabs } from 'antd';
import notification from 'antd/lib/notification';
import Spin from 'antd/lib/spin';
import Icon, { DisconnectOutlined } from '@ant-design/icons';
import Space from 'antd/lib/space';
import Text from 'antd/lib/typography/Text';
import ReactMarkdown from 'react-markdown';
import 'antd/dist/antd.css';

import { ShortcutsContextProvider } from 'components/shortcuts.context';

import { Organization, getCore } from 'cvat-core-wrapper';
import { ErrorState, NotificationsState, PluginsState } from 'reducers';
import { customWaViewHit } from 'utils/environment';
import showPlatformNotification, {
    platformInfo,
    stopNotifications,
    showUnsupportedNotification,
} from 'utils/platform-checker';
import '../styles.scss';
import appConfig from 'config';
import EventRecorder from 'utils/controls-logger';

import loadable from '@loadable/component';
import routes, { overviewTabs, verifyRoutes, locationParser } from '../routes';

import InvitationWatcher from './invitation-watcher/invitation-watcher';
import { ABreadcrumb } from './common/breadcrumb';
import { CVATLogo } from '../icons';

const Header = loadable(() => import(/* webpackChunkName: "header" */ 'components/header/header'));
const GlobalErrorBoundary = loadable(() => import(/* webpackChunkName: "global-error-boundary" */ 'components/global-error-boundary/global-error-boundary'));
const ShortcutsDialog = loadable(() => import(/* webpackChunkName: "shortcuts-dialog" */ 'components/shortcuts-dialog/shortcuts-dialog'));
const ExportDatasetModal = loadable(() => import(/* webpackChunkName: "export-dataset-modal" */ 'components/export-dataset/export-dataset-modal'));
const ExportBackupModal = loadable(() => import(/* webpackChunkName: "export-backup-modal" */ 'components/export-backup/export-backup-modal'));
const ImportDatasetModal = loadable(() => import(/* webpackChunkName: "import-dataset-modal" */ 'components/import-dataset/import-dataset-modal'));
const ImportBackupModal = loadable(() => import(/* webpackChunkName: "import-backup-modal" */ 'components/import-backup/import-backup-modal'));

interface CVATAppProps {
    loadFormats: () => void;
    loadAbout: () => void;
    verifyAuthorized: () => void;
    loadUserAgreements: () => void;
    initPlugins: () => void;
    initModels: () => void;
    resetErrors: () => void;
    resetMessages: () => void;
    loadOrganization: () => void;
    initInvitations: () => void;
    loadServerAPISchema: () => void;
    userInitialized: boolean;
    userFetching: boolean;
    organizationFetching: boolean;
    organizationInitialized: boolean;
    pluginsInitialized: boolean;
    pluginsFetching: boolean;
    modelsInitialized: boolean;
    modelsFetching: boolean;
    formatsInitialized: boolean;
    formatsFetching: boolean;
    aboutInitialized: boolean;
    aboutFetching: boolean;
    userAgreementsFetching: boolean;
    userAgreementsInitialized: boolean;
    notifications: NotificationsState;
    user: any;
    isModelPluginActive: boolean;
    pluginComponents: PluginsState['components'];
    invitationsFetching: boolean;
    invitationsInitialized: boolean;
    serverAPISchemaFetching: boolean;
    serverAPISchemaInitialized: boolean;
    isPasswordResetEnabled: boolean;
    isRegistrationEnabled: boolean;
}

interface CVATAppState {
    healthIinitialized: boolean;
    backendIsHealthy: boolean;
}

class CVATApplication extends React.PureComponent<CVATAppProps & RouteComponentProps, CVATAppState> {
    constructor(props: CVATAppProps & RouteComponentProps) {
        super(props);

        this.state = {
            healthIinitialized: false,
            backendIsHealthy: false,
        };
    }

    public componentDidMount(): void {
        const core = getCore();
        const { history, location } = this.props;
        const {
            HEALTH_CHECK_RETRIES, HEALTH_CHECK_PERIOD, HEALTH_CHECK_REQUEST_TIMEOUT, SERVER_UNAVAILABLE_COMPONENT,
            RESET_NOTIFICATIONS_PATHS,
        } = appConfig;

        // Logger configuration
        const userActivityCallback: (() => void)[] = [];
        window.addEventListener('click', (event: MouseEvent) => {
            userActivityCallback.forEach((handler) => handler());
            EventRecorder.log(event);
        });

        core.logger.configure(() => window.document.hasFocus, userActivityCallback);
        EventRecorder.initSave();

        core.config.onOrganizationChange = (newOrgId: number | null) => {
            if (newOrgId === null) {
                localStorage.removeItem('currentOrganization');
                window.location.reload();
            } else {
                core.organizations.get({
                    filter: `{"and":[{"==":[{"var":"id"},${newOrgId}]}]}`,
                }).then(([organization]: Organization[]) => {
                    if (organization) {
                        localStorage.setItem('currentOrganization', organization.slug);
                        window.location.reload();
                    }
                });
            }
        };

        customWaViewHit(location.pathname, location.search, location.hash);
        history.listen((newLocation) => {
            customWaViewHit(newLocation.pathname, newLocation.search, newLocation.hash);
            const { location: prevLocation } = this.props;
            const shouldResetNotifications = RESET_NOTIFICATIONS_PATHS.from.some(
                (pathname) => prevLocation.pathname === pathname,
            );
            const pathExcluded = shouldResetNotifications && RESET_NOTIFICATIONS_PATHS.exclude.some(
                (pathname) => newLocation.pathname.includes(pathname),
            );
            if (shouldResetNotifications && !pathExcluded) {
                this.resetNotifications();
            }
        });

        core.server.healthCheck(
            HEALTH_CHECK_RETRIES,
            HEALTH_CHECK_PERIOD,
            HEALTH_CHECK_REQUEST_TIMEOUT,
        ).then(() => {
            this.setState({
                healthIinitialized: true,
                backendIsHealthy: true,
            });
        })
            .catch(() => {
                this.setState({
                    healthIinitialized: true,
                    backendIsHealthy: false,
                });

                Modal.error({
                    title: 'Cannot connect to the server',
                    className: 'cvat-modal-cannot-connect-server',
                    closable: false,
                    content:
                        <Text>
                            {SERVER_UNAVAILABLE_COMPONENT}
                        </Text>,
                });
            });

        const {
            name, version, engine, os,
        } = platformInfo();

        if (showPlatformNotification()) {
            stopNotifications(false);
            Modal.warning({
                title: 'Unsupported platform detected',
                className: 'cvat-modal-unsupported-platform-warning',
                content: (
                    <>
                        <Row>
                            <Col>
                                <Text>
                                    {`The browser you are using is ${name} ${version} based on ${engine}.` +
                                        ' CVAT was tested in the latest versions of Chrome and Firefox.' +
                                        ' We recommend to use Chrome (or another Chromium based browser)'}
                                </Text>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Text type='secondary'>{`The operating system is ${os}`}</Text>
                            </Col>
                        </Row>
                    </>
                ),
                onOk: () => stopNotifications(true),
            });
        } else if (showUnsupportedNotification()) {
            stopNotifications(false);
            Modal.warning({
                title: 'Unsupported features detected',
                className: 'cvat-modal-unsupported-features-warning',
                content: (
                    <Text>
                        {`${name} v${version} does not support API, which is used by CVAT. `}
                        It is strongly recommended to update your browser.
                    </Text>
                ),
                onOk: () => stopNotifications(true),
            });
        }
    }

    public componentDidUpdate(): void {
        const {
            verifyAuthorized,
            loadFormats,
            loadAbout,
            loadUserAgreements,
            initPlugins,
            initModels,
            loadOrganization,
            loadServerAPISchema,
            userInitialized,
            userFetching,
            organizationFetching,
            organizationInitialized,
            formatsInitialized,
            formatsFetching,
            aboutInitialized,
            aboutFetching,
            pluginsInitialized,
            pluginsFetching,
            modelsInitialized,
            modelsFetching,
            user,
            userAgreementsFetching,
            userAgreementsInitialized,
            isModelPluginActive,
            invitationsInitialized,
            invitationsFetching,
            initInvitations,
            history,
            serverAPISchemaFetching,
            serverAPISchemaInitialized,
        } = this.props;

        const { backendIsHealthy } = this.state;

        if (!backendIsHealthy) {
            return;
        }

        this.showErrors();
        this.showMessages();

        if (!userInitialized && !userFetching) {
            verifyAuthorized();
            return;
        }

        if (!userAgreementsInitialized && !userAgreementsFetching) {
            loadUserAgreements();
            return;
        }

        if (!serverAPISchemaInitialized && !serverAPISchemaFetching) {
            loadServerAPISchema();
        }

        if (user == null || !user.isVerified || !user.id) {
            return;
        }

        if (!organizationInitialized && !organizationFetching) {
            loadOrganization();
        }

        if (!formatsInitialized && !formatsFetching) {
            loadFormats();
        }

        if (!aboutInitialized && !aboutFetching) {
            loadAbout();
        }

        if (isModelPluginActive && !modelsInitialized && !modelsFetching) {
            initModels();
        }

        if (!invitationsInitialized && !invitationsFetching && history.location.pathname !== '/invitations') {
            initInvitations();
        }

        if (!pluginsInitialized && !pluginsFetching) {
            initPlugins();
        }
    }

    private showMessages(): void {
        function showMessage(title: string): void {
            notification.info({
                message: (
                    <ReactMarkdown>{title}</ReactMarkdown>
                ),
                duration: null,
            });
        }

        const { notifications, resetMessages } = this.props;

        let shown = false;
        for (const where of Object.keys(notifications.messages)) {
            for (const what of Object.keys((notifications as any).messages[where])) {
                const message = (notifications as any).messages[where][what];
                shown = shown || !!message;
                if (message) {
                    showMessage(message);
                }
            }
        }

        if (shown) {
            resetMessages();
        }
    }

    private showErrors(): void {
        function showError(title: string, _error: Error, shouldLog?: boolean, className?: string): void {
            const error = _error?.message || _error.toString();
            const dynamicProps = typeof className === 'undefined' ? {} : { className };
            notification.error({
                ...dynamicProps,
                message: (
                    <ReactMarkdown>{title}</ReactMarkdown>
                ),
                duration: null,
                description: error.length > 300 ? 'Open the Browser Console to get details' :
                    <ReactMarkdown>{error}</ReactMarkdown>,
            });

            if (shouldLog) {
                setTimeout(() => {
                    // throw the error to be caught by global listener
                    throw _error;
                });
            } else {
                console.error(error);
            }
        }

        const { notifications, resetErrors } = this.props;

        let shown = false;
        for (const where of Object.keys(notifications.errors)) {
            for (const what of Object.keys((notifications as any).errors[where])) {
                const error = (notifications as any).errors[where][what] as ErrorState;
                shown = shown || !!error;
                if (error) {
                    showError(error.message, error.reason, error.shouldLog, error.className);
                }
            }
        }

        if (shown) {
            resetErrors();
        }
    }

    private resetNotifications(): void {
        const { resetErrors, resetMessages } = this.props;

        notification.destroy();
        resetErrors();
        resetMessages();
    }

    // Where you go depends on your URL
    public render(): JSX.Element {
        const {
            userInitialized,
            aboutInitialized,
            pluginsInitialized,
            formatsInitialized,
            modelsInitialized,
            organizationInitialized,
            userAgreementsInitialized,
            serverAPISchemaInitialized,
            pluginComponents,
            user,
            history,
            location,
            isModelPluginActive,
            isPasswordResetEnabled,
            isRegistrationEnabled,
        } = this.props;

        if (isModelPluginActive) {
            const models = routes.find((i) => i.path === '/models') || {};
            // @ts-ignore
            models.hide = false;
        }

        const { healthIinitialized, backendIsHealthy } = this.state;

        const notRegisteredUserInitialized = (userInitialized && (user == null || !user.isVerified));
        let readyForRender = userAgreementsInitialized && serverAPISchemaInitialized;
        readyForRender = readyForRender && (notRegisteredUserInitialized ||
            (
                userInitialized &&
                formatsInitialized &&
                pluginsInitialized &&
                aboutInitialized &&
                organizationInitialized &&
                (!isModelPluginActive || modelsInitialized)
            )
        );

        const routesToRender = pluginComponents.router
            .filter(({ data: { shouldBeRendered } }) => shouldBeRendered(this.props, this.state))
            .map(({ component: Component }) => Component());

        const loggedInModals = pluginComponents.loggedInModals
            .filter(({ data: { shouldBeRendered } }) => shouldBeRendered(this.props, this.state))
            .map(({ component: Component }) => Component);

        if (readyForRender) {
            if (user && user.isVerified) {
                return (
                    <GlobalErrorBoundary>
                        <ShortcutsContextProvider>
                            <Layout>
                                <Layout style={{ height: '100%', overflow: 'hidden' }}>
                                    <Layout.Sider theme='light' width={400} className='px-4 w-full h-full overflow-y-auto relative'>

                                        <Icon className="absolute left-4 top-2" component={CVATLogo} />
                                        <Tabs
                                            destroyInactiveTabPane
                                            tabBarExtraContent={null}
                                            moreIcon={null}
                                            tabBarStyle={{
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 11,
                                                background: '#fff'
                                            }}
                                            centered
                                            onChange={(ak) => {
                                                history.push(`/${ak}`);
                                            }}
                                            className='w-full h-full ls-tab'
                                            defaultActiveKey={locationParser()?.[0]}
                                            items={overviewTabs.items.map((item) => ({
                                                key: item.key,
                                                label: item.label,
                                                children: <item.children />,
                                            }))}
                                        />

                                    </Layout.Sider>

                                    <Layout.Content className='mx-6 overflow-auto relative'>
                                        <Header />
                                        <ShortcutsDialog />
                                        {/*<div className="h-[100%-48px] overflow-auto">
                                        </div>*/}
                                        <Switch>
                                            {
                                                routes.map((route) => {
                                                    const { path, component, hide } = route;
                                                    if (hide) return null;
                                                    return (
                                                        <Route
                                                            key={path}
                                                            path={path}
                                                            exact
                                                            component={component}
                                                        />
                                                    );
                                                })
                                            }
                                            {routesToRender}
                                            {/* 确保重定向规则总是在所有其他路由定义之后 */}
                                            <Redirect to='/' />
                                        </Switch>

                                        <ExportDatasetModal />
                                        <ExportBackupModal />
                                        <ImportDatasetModal />
                                        <ImportBackupModal />
                                        <InvitationWatcher />
                                        {loggedInModals.map((Component, idx) => (
                                            <Component key={idx} targetProps={this.props} targetState={this.state} />
                                        ))}
                                        {/* eslint-disable-next-line */}
                                        <a id="downloadAnchor" target="_blank" style={{ display: 'none' }} download />
                                    </Layout.Content>
                                </Layout>
                            </Layout>
                        </ShortcutsContextProvider>
                    </GlobalErrorBoundary>
                );
            }

            return (
                // @ts-ignore
                <GlobalErrorBoundary>
                    <Switch>
                        {
                            verifyRoutes.map((route, index) => (route.condition ? (
                                <Route
                                    key={index}
                                    path={route.path}
                                    exact={route.exact}
                                    render={(props) => (route.condition({
                                        ...props,
                                        isRegistrationEnabled,
                                        isPasswordResetEnabled,
                                    }) ? <route.component {...props} /> : null)}
                                />
                            ) : (
                                <Route
                                    key={index}
                                    path={route.path}
                                    exact={route.exact}
                                    component={route.component}
                                />
                            )),
                            )
                        }
                        {
                            routesToRender
                        }
                        <Redirect
                            to={location.pathname.length > 1 ? `/auth/login?next=${location.pathname}` : '/auth/login'}
                        />
                    </Switch>
                    <InvitationWatcher />
                </GlobalErrorBoundary>
            );
        }

        if (healthIinitialized && !backendIsHealthy) {
            return (
                <Space align='center' direction='vertical' className='cvat-spinner'>
                    <DisconnectOutlined className='cvat-disconnected' />
                    Cannot connect to the server.
                </Space>
            );
        }

        return <Spin size='large' className='cvat-spinner' tip='Connecting...' />;
    }
}

export default withRouter(CVATApplication);
