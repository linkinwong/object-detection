// @ts-ignore
import loadable from '@loadable/component';

const projects = loadable(() => import(/* webpackChunkName: "projects" */ 'components/projects-page/projects-page'));
const tasks = loadable(() => import(/* webpackChunkName: "tasks" */ 'containers/tasks-page/tasks-page'));
const annotation = loadable(() => import(/* webpackChunkName: "annotation-page" */ 'containers/annotation-page/annotation-page'));
const emptyPage = loadable(() => import(/* webpackChunkName: "empty-page" */ 'components/tasks-page/empty-list'));

const routes = [
    {
        path: '/auth/login-with-token/:token',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "login-with-token" */ 'components/login-with-token/login-with-token')),
    },
    {
        path: '/auth/logout',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "logout-component" */ 'components/logout-component')),
    },
    {
        path: '/',
        exact: true,
        component: emptyPage,
    },
    {
        path: '/projects',
        exact: true,
        component: emptyPage,
        label: '项目',
    },
    {
        // set route but no view
        path: '/tasks',
        exact: true,
        component: emptyPage,
        label: '任务',
    },
    {
        path: '/jobs',
        exact: true,
        component: emptyPage,
        label: '作业',
    },
    {
        path: '/projects/create',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "create-project-page" */ 'components/create-project-page/create-project-page')),
        label: '创建项目',
    },
    {
        path: '/projects/:id',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "project-page" */ 'components/project-page/project-page')),
        label: '项目详情',
    },
    {
        path: '/projects/:id/webhooks',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "webhooks-page" */ 'components/webhooks-page/webhooks-page')),
        label: 'Webhooks',
    },
    {
        path: '/projects/:id/guide',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "guide-page" */ 'components/md-guide/guide-page')),
        label: '指南',
    },
    {
        path: '/projects/:pid/analytics',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "analytics-page" */ './components/analytics-page/analytics-page')),
        label: '分析',
    },

    {
        path: '/tasks/create',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "create-task-page" */ 'containers/create-task-page/create-task-page')),
        label: '创建任务',
    },
    {
        path: '/tasks/:id',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "task-page" */ 'components/task-page/task-page')),
        label: '任务详情',
    },
    {
        path: '/tasks/:tid/analytics',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "analytics-page" */ './components/analytics-page/analytics-page')),
        label: '分析',
    },
    {
        path: '/tasks/:id/jobs/create',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "create-job-page" */ './components/create-job-page/create-job-page')),
        label: '创建作业',
    },
    {
        path: '/tasks/:id/guide',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "guide-page" */ 'components/md-guide/guide-page')),
        label: '指南',
    },
    {
        // todo delete
        path: '/tasks/:tid/jobs/:jid',
        exact: true,
        component: annotation,
        label: '标注',
    },
    {
        path: '/jobs/:id/:jid',
        exact: true,
        component: annotation,
        label: '标注',
    },
    {
        path: '/tasks/:tid/jobs/:jid/analytics',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "analytics-page" */ './components/analytics-page/analytics-page')),
        label: '分析',
    },
    {
        path: '/cloudstorages',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "cloud-storages-page" */ 'components/cloud-storages-page/cloud-storages-page')),
        label: '云存储',
    },
    {
        path: '/cloudstorages/create',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "create-cloud-storage-page" */ 'components/create-cloud-storage-page/create-cloud-storage-page')),
        label: '创建云存储',
    },
    {
        path: '/cloudstorages/update/:id',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "update-cloud-storage-page" */ 'components/update-cloud-storage-page/update-cloud-storage-page')),
        label: '更新云存储',
    },
    {
        path: '/organizations/create',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "create-organization-page" */ 'components/create-organization-page/create-organization-page')),
        label: '创建组织',
    },
    {
        path: '/organization/webhooks',
        exact: true,
        label: 'Webhooks',
        component: loadable(() => import(/* webpackChunkName: "webhooks-page" */ 'components/webhooks-page/webhooks-page')),
    },
    {
        path: '/webhooks/create',
        label: '创建Webhook',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "create-webhook-page" */ 'components/setup-webhook-pages/create-webhook-page')),
    },
    {
        path: '/webhooks/update/:id',
        label: '更新Webhook',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "update-webhook-page" */ 'components/setup-webhook-pages/update-webhook-page')),
    },
    {
        path: '/invitations',
        label: '邀请',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "invitations" */ 'components/invitations-page/invitations-page')),
    },
    {
        path: '/organization',
        label: '组织',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "organization" */ 'components/organization-page/organization-page')),
    },
    // 模型插件激活时的路由配置
    {
        path: '/models',
        label: '模型',
        hide: false,
        component: loadable(() => import(/* webpackChunkName: "models" */ 'components/models-page/models-page')),
    },
];

export const verifyRoutes = [
    {
        path: '/auth/register',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "register" */ 'containers/register-page/register-page')),
        condition: (props: any) => props.isRegistrationEnabled,
    },
    {
        path: '/auth/email-verification-sent',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "sent" */ './components/email-confirmation-pages/email-verification-sent')),
    },
    {
        path: '/auth/incorrect-email-confirmation',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "confirmation" */ './components/email-confirmation-pages/incorrect-email-confirmation')),
    },
    {
        path: '/auth/login',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "login" */ 'containers/login-page/login-page')),
    },
    {
        path: '/auth/login-with-token/:token',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "token" */ 'components/login-with-token/login-with-token')),
    },
    {
        path: '/auth/password/reset',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "reset" */ 'components/reset-password-page/reset-password-page')),
        condition: (props: any) => props.isPasswordResetEnabled,
    },
    {
        path: '/auth/password/reset/confirm',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "confirm" */ 'components/reset-password-confirm-page/reset-password-confirm-page')),
        condition: (props: any) => props.isPasswordResetEnabled,
    },
    {
        path: '/auth/email-confirmation',
        exact: true,
        component: loadable(() => import(/* webpackChunkName: "confirmation" */ './components/email-confirmation-pages/email-confirmed')),
    },
];

export const overviewTabs = {
    defaultActiveKey: 'tasks',
    items: [
        {
            label: '项目',
            key: 'projects',
            children: projects,
        },
        {
            label: '任务',
            key: 'tasks',
            children: tasks,
            disabled: true,
        },
        {
            label: '作业',
            key: 'jobs',
            children: loadable(() => import(/* webpackChunkName: "jobs" */ 'components/jobs-page/jobs-page')),
        },
    ],
};

/**
 * return [task, tid, job, jid]
 */
export const locationParser = () => window.location.pathname.split('/').filter((i) => i);

export default routes;
