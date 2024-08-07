// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {Redirect, Route, RouteComponentProps, Switch} from 'react-router';

import AnnotationPageComponent from 'components/annotation-page/annotation-page';
import {
    getJobAsync, saveLogsAsync, changeFrameAsync,
    closeJob as closeJobAction,
} from 'actions/annotation-actions';

import {CombinedState, ErrorState, Workspace} from 'reducers';
import AnnotationPageContainer from 'containers/annotation-page/annotation-page';
import React from "react";
import {getCore, Organization} from "../../cvat-core-wrapper";
import appConfig from "../../config";
import EventRecorder from "../../utils/controls-logger";
import {customWaViewHit} from "../../utils/environment";
import Modal from "antd/lib/modal";
import Text from "antd/lib/typography/Text";
import showPlatformNotification, {
    platformInfo,
    showUnsupportedNotification,
    stopNotifications
} from "../../utils/platform-checker";
import {Col, Row} from "antd/lib/grid";
import notification from "antd/lib/notification";
import ReactMarkdown from "react-markdown";
import {authQuery} from "../../utils/auth-query";
import GlobalErrorBoundary from "../../components/global-error-boundary/global-error-boundary";
import {ShortcutsContextProvider} from "../../components/shortcuts.context";
import Layout from "antd/lib/layout";
import Header from "../../components/header/header";
import ShortcutsDialog from "../../components/shortcuts-dialog/shortcuts-dialog";
import LoginWithTokenComponent from "../../components/login-with-token/login-with-token";
import LogoutComponent from "../../components/logout-component";
import ProjectsPageComponent from "../../components/projects-page/projects-page";
import CreateProjectPageComponent from "../../components/create-project-page/create-project-page";
import ProjectPageComponent from "../../components/project-page/project-page";
import WebhooksPage from "../../components/webhooks-page/webhooks-page";
import GuidePage from "../../components/md-guide/guide-page";
import AnalyticsPage from "../../components/analytics-page/analytics-page";
import TasksPageContainer from "../tasks-page/tasks-page";
import CreateTaskPageContainer from "../create-task-page/create-task-page";
import TaskPageComponent from "../../components/task-page/task-page";
import CreateJobPage from "../../components/create-job-page/create-job-page";
import JobsPageComponent from "../../components/jobs-page/jobs-page";
import CloudStoragesPageComponent from "../../components/cloud-storages-page/cloud-storages-page";
import CreateCloudStoragePageComponent from "../../components/create-cloud-storage-page/create-cloud-storage-page";
import UpdateCloudStoragePageComponent from "../../components/update-cloud-storage-page/update-cloud-storage-page";
import CreateOrganizationComponent from "../../components/create-organization-page/create-organization-page";
import CreateWebhookPage from "../../components/setup-webhook-pages/create-webhook-page";
import UpdateWebhookPage from "../../components/setup-webhook-pages/update-webhook-page";
import InvitationsPage from "../../components/invitations-page/invitations-page";
import OrganizationPage from "../../components/organization-page/organization-page";
import ModelsPageComponent from "../../components/models-page/models-page";
import ExportDatasetModal from "../../components/export-dataset/export-dataset-modal";
import ExportBackupModal from "../../components/export-backup/export-backup-modal";
import ImportDatasetModal from "../../components/import-dataset/import-dataset-modal";
import ImportBackupModal from "../../components/import-backup/import-backup-modal";
import InvitationWatcher from "../../components/invitation-watcher/invitation-watcher";
import RegisterPageContainer from "../register-page/register-page";
import EmailVerificationSentPage from "../../components/email-confirmation-pages/email-verification-sent";
import IncorrectEmailConfirmationPage from "../../components/email-confirmation-pages/incorrect-email-confirmation";
import LoginPageContainer from "../login-page/login-page";
import ResetPasswordPageComponent from "../../components/reset-password-page/reset-password-page";
import ResetPasswordPageConfirmComponent
    from "../../components/reset-password-confirm-page/reset-password-confirm-page";
import EmailConfirmationPage from "../../components/email-confirmation-pages/email-confirmed";
import Space from "antd/lib/space";
import {DisconnectOutlined} from "@ant-design/icons";
import Spin from "antd/lib/spin";

class AnnotationPageComponentAll extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ocrType: 1,
        };
    }

    // Where you go depends on your URL
    public render(): JSX.Element {
        const { ocrType } = this.props;

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

        const queryParams = new URLSearchParams(location.search);
        const authParams = authQuery(queryParams);

        if (readyForRender) {
            if (user && user.isVerified) {
                return (
                    <GlobalErrorBoundary>
                        <ShortcutsContextProvider>
                            <Layout>
                                <Header />
                                <Layout.Content style={{ height: '100%' }}>
                                    <ShortcutsDialog />
                                    <Switch>
                                        <Route
                                            exact
                                            path='/auth/login-with-token/:token'
                                            component={LoginWithTokenComponent}
                                        />
                                        <Route exact path='/auth/logout' component={LogoutComponent} />
                                        <Route exact path='/projects' component={ProjectsPageComponent} />
                                        <Route exact path='/projects/create' component={CreateProjectPageComponent} />
                                        <Route exact path='/projects/:id' component={ProjectPageComponent} />
                                        <Route exact path='/projects/:id/webhooks' component={WebhooksPage} />
                                        <Route exact path='/projects/:id/guide' component={GuidePage} />
                                        <Route exact path='/projects/:pid/analytics' component={AnalyticsPage} />
                                        <Route exact path='/tasks' component={TasksPageContainer} />
                                        <Route exact path='/tasks/create' component={CreateTaskPageContainer} />
                                        <Route exact path='/tasks/:id' component={TaskPageComponent} />
                                        <Route exact path='/tasks/:tid/analytics' component={AnalyticsPage} />
                                        <Route exact path='/tasks/:id/jobs/create' component={CreateJobPage} />
                                        <Route exact path='/tasks/:id/guide' component={GuidePage} />
                                        <Route exact path='/tasks/:tid/jobs/:jid' component={AnnotationPageContainer} />
                                        {/*<Route exact path='/tasks/:tid/jobs/:jid' component={JobAudioAnnotatorComponent} />*/}
                                        <Route exact path='/tasks/:tid/jobs/:jid/analytics' component={AnalyticsPage} />
                                        <Route exact path='/jobs' component={JobsPageComponent} />
                                        <Route exact path='/cloudstorages' component={CloudStoragesPageComponent} />
                                        <Route
                                            exact
                                            path='/cloudstorages/create'
                                            component={CreateCloudStoragePageComponent}
                                        />
                                        <Route
                                            exact
                                            path='/cloudstorages/update/:id'
                                            component={UpdateCloudStoragePageComponent}
                                        />
                                        <Route
                                            exact
                                            path='/organizations/create'
                                            component={CreateOrganizationComponent}
                                        />
                                        <Route exact path='/organization/webhooks' component={WebhooksPage} />
                                        <Route exact path='/webhooks/create' component={CreateWebhookPage} />
                                        <Route exact path='/webhooks/update/:id' component={UpdateWebhookPage} />
                                        <Route exact path='/invitations' component={InvitationsPage} />
                                        <Route exact path='/organization' component={OrganizationPage} />
                                        { routesToRender }
                                        {isModelPluginActive && (
                                            <Route
                                                path='/models'
                                            >
                                                <Switch>
                                                    <Route exact path='/models' component={ModelsPageComponent} />
                                                </Switch>
                                            </Route>
                                        )}
                                        <Redirect
                                            push
                                            to={{
                                                pathname: queryParams.get('next') || '/tasks',
                                                search: authParams ? new URLSearchParams(authParams).toString() : '',
                                            }}
                                        />
                                    </Switch>
                                    <ExportDatasetModal />
                                    <ExportBackupModal />
                                    <ImportDatasetModal />
                                    <ImportBackupModal />
                                    <InvitationWatcher />
                                    { loggedInModals.map((Component, idx) => (
                                        <Component key={idx} targetProps={this.props} targetState={this.state} />
                                    ))}
                                    {/* eslint-disable-next-line */}
                                    <a id='downloadAnchor' target='_blank' style={{ display: 'none' }} download />
                                    {/* <JobAudioAnnotatorComponent style={{ with: '1000px' }}></JobAudioAnnotatorComponent> */}
                                </Layout.Content>
                            </Layout>
                        </ShortcutsContextProvider>
                    </GlobalErrorBoundary>
                );
            }

            return (
                <GlobalErrorBoundary>
                    <>
                        <Switch>
                            {isRegistrationEnabled && (
                                <Route exact path='/auth/register' component={RegisterPageContainer} />
                            )}
                            <Route exact path='/auth/email-verification-sent' component={EmailVerificationSentPage} />
                            <Route exact path='/auth/incorrect-email-confirmation' component={IncorrectEmailConfirmationPage} />
                            <Route exact path='/auth/login' component={LoginPageContainer} />
                            <Route
                                exact
                                path='/auth/login-with-token/:token'
                                component={LoginWithTokenComponent}
                            />
                            {isPasswordResetEnabled && (
                                <Route exact path='/auth/password/reset' component={ResetPasswordPageComponent} />
                            )}
                            {isPasswordResetEnabled && (
                                <Route
                                    exact
                                    path='/auth/password/reset/confirm'
                                    component={ResetPasswordPageConfirmComponent}
                                />
                            )}

                            <Route exact path='/auth/email-confirmation' component={EmailConfirmationPage} />
                            { routesToRender }
                            <Redirect
                                to={location.pathname.length > 1 ? `/auth/login?next=${location.pathname}` : '/auth/login'}
                            />
                        </Switch>
                        <InvitationWatcher />
                    </>
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AnnotationPageComponent));
