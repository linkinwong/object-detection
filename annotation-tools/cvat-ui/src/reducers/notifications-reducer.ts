// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { AnyAction } from 'redux';

import { ServerError } from 'cvat-core-wrapper';
import { AuthActionTypes } from 'actions/auth-actions';
import { FormatsActionTypes } from 'actions/formats-actions';
import { ModelsActionTypes } from 'actions/models-actions';
import { TasksActionTypes } from 'actions/tasks-actions';
import { ProjectsActionTypes } from 'actions/projects-actions';
import { AboutActionTypes } from 'actions/about-actions';
import { AnnotationActionTypes } from 'actions/annotation-actions';
import { NotificationsActionType } from 'actions/notification-actions';
import { BoundariesActionTypes } from 'actions/boundaries-actions';
import { UserAgreementsActionTypes } from 'actions/useragreements-actions';
import { ReviewActionTypes } from 'actions/review-actions';
import { ExportActionTypes } from 'actions/export-actions';
import { ImportActionTypes } from 'actions/import-actions';
import { CloudStorageActionTypes } from 'actions/cloud-storage-actions';
import { OrganizationActionsTypes } from 'actions/organization-actions';
import { JobsActionTypes } from 'actions/jobs-actions';
import { WebhooksActionsTypes } from 'actions/webhooks-actions';
import { InvitationsActionTypes } from 'actions/invitations-actions';
import { ServerAPIActionTypes } from 'actions/server-actions';

import { NotificationsState } from '.';

const defaultState: NotificationsState = {
    errors: {
        auth: {
            authorized: null,
            login: null,
            logout: null,
            register: null,
            changePassword: null,
            requestPasswordReset: null,
            resetPassword: null,
        },
        serverAPI: {
            fetching: null,
        },
        projects: {
            fetching: null,
            updating: null,
            deleting: null,
            creating: null,
            restoring: null,
            backuping: null,
        },
        tasks: {
            fetching: null,
            updating: null,
            dumping: null,
            loading: null,
            exportingAsDataset: null,
            deleting: null,
            creating: null,
            exporting: null,
            importing: null,
            moving: null,
        },
        jobs: {
            updating: null,
            fetching: null,
            creating: null,
            deleting: null,
        },
        formats: {
            fetching: null,
        },
        users: {
            fetching: null,
        },
        about: {
            fetching: null,
        },
        models: {
            starting: null,
            fetching: null,
            canceling: null,
            metaFetching: null,
            inferenceStatusFetching: null,
            creating: null,
            deleting: null,
        },
        annotation: {
            saving: null,
            jobFetching: null,
            frameFetching: null,
            changingLabelColor: null,
            updating: null,
            creating: null,
            merging: null,
            grouping: null,
            joining: null,
            slicing: null,
            splitting: null,
            removing: null,
            propagating: null,
            collectingStatistics: null,
            savingJob: null,
            uploadAnnotations: null,
            removeAnnotations: null,
            fetchingAnnotations: null,
            undo: null,
            redo: null,
            search: null,
            deleteFrame: null,
            restoreFrame: null,
            savingLogs: null,
            canvas: null,
        },
        boundaries: {
            resetError: null,
        },
        userAgreements: {
            fetching: null,
        },
        review: {
            commentingIssue: null,
            finishingIssue: null,
            reopeningIssue: null,
            resolvingIssue: null,
            submittingReview: null,
            deletingIssue: null,
        },
        exporting: {
            dataset: null,
            annotation: null,
            backup: null,
        },
        importing: {
            dataset: null,
            annotation: null,
            backup: null,
        },
        cloudStorages: {
            creating: null,
            fetching: null,
            updating: null,
            deleting: null,
        },
        organizations: {
            fetching: null,
            creating: null,
            updating: null,
            activation: null,
            deleting: null,
            leaving: null,
            inviting: null,
            updatingMembership: null,
            removingMembership: null,
            deletingInvitation: null,
        },
        webhooks: {
            fetching: null,
            creating: null,
            updating: null,
            deleting: null,
        },
        analytics: {
            fetching: null,
            fetchingSettings: null,
            updatingSettings: null,
        },
        invitations: {
            fetching: null,
            acceptingInvitation: null,
            decliningInvitation: null,
            resendingInvitation: null,
        },
    },
    messages: {
        tasks: {
            loadingDone: '',
            importingDone: '',
            movingDone: '',
        },
        models: {
            inferenceDone: '',
        },
        auth: {
            changePasswordDone: '',
            registerDone: '',
            requestPasswordResetDone: '',
            resetPasswordDone: '',
        },
        projects: {
            restoringDone: '',
        },
        exporting: {
            dataset: '',
            annotation: '',
            backup: '',
        },
        importing: {
            dataset: '',
            annotation: '',
            backup: '',
        },
        invitations: {
            newInvitations: '',
            acceptInvitationDone: '',
            declineInvitationDone: '',
            resendingInvitation: '',
        },
    },
};

export default function (state = defaultState, action: AnyAction): NotificationsState {
    switch (action.type) {
        case AuthActionTypes.AUTHORIZED_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    auth: {
                        ...state.errors.auth,
                        authorized: {
                            message: '无法检查服务器上的授权',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AuthActionTypes.LOGIN_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    auth: {
                        ...state.errors.auth,
                        login: {
                            message: '无法登录服务器',
                            // reason: action.payload.error,
                            reason: '用户名或密码错误',
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-login-failed',
                        },
                    },
                },
            };
        }
        case AuthActionTypes.LOGOUT_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    auth: {
                        ...state.errors.auth,
                        logout: {
                            message: '无法从服务器注销',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AuthActionTypes.REGISTER_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    auth: {
                        ...state.errors.auth,
                        register: {
                            message: '无法在服务器上注册',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AuthActionTypes.REGISTER_SUCCESS: {
            if (!action.payload.user.isVerified) {
                return {
                    ...state,
                    messages: {
                        ...state.messages,
                        auth: {
                            ...state.messages.auth,
                            registerDone: `要使用您的帐户，您需要确认电子邮件地址。我们已经发送了一封电子邮件，其中有一个确认链接到 ${action.payload.user.email}.`,
                        },
                    },
                };
            }

            return {
                ...state,
            };
        }
        case AuthActionTypes.CHANGE_PASSWORD_SUCCESS: {
            return {
                ...state,
                messages: {
                    ...state.messages,
                    auth: {
                        ...state.messages.auth,
                        changePasswordDone: '新密码已保存',
                    },
                },
            };
        }
        case AuthActionTypes.CHANGE_PASSWORD_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    auth: {
                        ...state.errors.auth,
                        changePassword: {
                            message: '无法更改密码',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-change-password-failed',
                        },
                    },
                },
            };
        }
        case AuthActionTypes.REQUEST_PASSWORD_RESET_SUCCESS: {
            return {
                ...state,
                messages: {
                    ...state.messages,
                    auth: {
                        ...state.messages.auth,
                        requestPasswordResetDone: `检查您的电子邮件链接重置您的密码，
                            如果它在几分钟内没有出现，请检查您的垃圾邮件文件夹`,
                    },
                },
            };
        }
        case AuthActionTypes.REQUEST_PASSWORD_RESET_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    auth: {
                        ...state.errors.auth,
                        requestPasswordReset: {
                            message: '无法在服务器上重置密码',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AuthActionTypes.RESET_PASSWORD_SUCCESS: {
            return {
                ...state,
                messages: {
                    ...state.messages,
                    auth: {
                        ...state.messages.auth,
                        resetPasswordDone: '已使用新密码重置密码',
                    },
                },
            };
        }
        case AuthActionTypes.RESET_PASSWORD_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    auth: {
                        ...state.errors.auth,
                        resetPassword: {
                            message: '无法在服务器上设置新密码',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ServerAPIActionTypes.GET_SERVER_API_SCHEMA_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    serverAPI: {
                        ...state.errors.serverAPI,
                        fetching: {
                            message: '无法接收服务器架构',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case InvitationsActionTypes.GET_INVITATIONS_SUCCESS: {
            if (action.payload.showNotification) {
                return {
                    ...state,
                    messages: {
                        ...state.messages,
                        invitations: {
                            ...state.messages.invitations,
                            newInvitations: '您收到了加入某个组织的邀请![点击这里](/邀请函)了解详情.',
                        },
                    },
                };
            }
            return state;
        }
        case InvitationsActionTypes.GET_INVITATIONS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    invitations: {
                        ...state.errors.invitations,
                        fetching: {
                            message: '没有收到邀请',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-get-invitations-failed',
                        },
                    },
                },
            };
        }
        case InvitationsActionTypes.ACCEPT_INVITATION_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    invitations: {
                        ...state.errors.invitations,
                        acceptingInvitation: {
                            message: '无法接受邀请',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-accept-organization-invitation-failed',
                        },
                    },
                },
            };
        }
        case InvitationsActionTypes.DECLINE_INVITATION_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    invitations: {
                        ...state.errors.invitations,
                        decliningInvitation: {
                            message: '不能拒绝邀请',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-decline-organization-invitation-failed',
                        },
                    },
                },
            };
        }
        case InvitationsActionTypes.RESEND_INVITATION_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    invitations: {
                        ...state.errors.invitations,
                        resendingInvitation: {
                            message: '不能重新发送邀请',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-resend-organization-invitation-failed',
                        },
                    },
                },
            };
        }
        case InvitationsActionTypes.RESEND_INVITATION_SUCCESS: {
            return {
                ...state,
                messages: {
                    ...state.messages,
                    invitations: {
                        ...state.messages.invitations,
                        resendingInvitation: '邀请函发送成功',
                    },
                },
            };
        }
        case ExportActionTypes.EXPORT_DATASET_FAILED: {
            const { instance, instanceType } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    exporting: {
                        ...state.errors.exporting,
                        dataset: {
                            message:
                                '无法导出数据集的 ' +
                                `[${instanceType} ${instance.id}](/${instanceType}s/${instance.id})`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ExportActionTypes.EXPORT_DATASET_SUCCESS: {
            const {
                instance, instanceType, isLocal, resource,
            } = action.payload;
            const auxiliaryVerb = resource === 'Dataset' ? 'has' : 'have';
            return {
                ...state,
                messages: {
                    ...state.messages,
                    exporting: {
                        ...state.messages.exporting,
                        dataset:
                            // `${resource} for ${instanceType} ${instance.id} ` +
                            // `${auxiliaryVerb} been ${(isLocal) ? 'downloaded' : 'uploaded'} ` +
                            // `${(isLocal) ? 'locally' : 'to cloud storage'}`,
                            `${resource} ${instanceType} ${instance.id} ` +
                            `已经 ${(isLocal) ? '下载到' : '上传到'} ` +
                            `${(isLocal) ? '本地' : '云存储'}`,
                    },
                },
            };
        }
        case ExportActionTypes.EXPORT_BACKUP_FAILED: {
            const { instance, instanceType } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    exporting: {
                        ...state.errors.exporting,
                        backup: {
                            message:
                                `无法输出 ${instanceType} №${instance.id}`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ExportActionTypes.EXPORT_BACKUP_SUCCESS: {
            const { instance, instanceType, isLocal } = action.payload;
            return {
                ...state,
                messages: {
                    ...state.messages,
                    exporting: {
                        ...state.messages.exporting,
                        backup:
                            `Backup for the ${instanceType} №${instance.id} ` +
                            `has been ${(isLocal) ? 'downloaded' : 'uploaded'} ` +
                            `${(isLocal) ? 'locally' : 'to cloud storage'}`,
                    },
                },
            };
        }
        case ImportActionTypes.IMPORT_DATASET_SUCCESS: {
            const { instance, resource } = action.payload;
            const message = resource === 'annotation' ?
                'Annotations have been loaded to the ' +
                `[task ${instance.taskId || instance.id}](/tasks/${instance.taskId || instance.id}) ` :
                `Dataset was imported to the [project ${instance.id}](/projects/${instance.id})`;
            return {
                ...state,
                messages: {
                    ...state.messages,
                    importing: {
                        ...state.messages.importing,
                        [resource]: message,
                    },
                },
            };
        }
        case ImportActionTypes.IMPORT_DATASET_FAILED: {
            const { instance, resource } = action.payload;
            const message = resource === 'annotation' ?
                'Could not upload annotation for the ' +
                `[task ${instance.taskId || instance.id}](/tasks/${instance.taskId || instance.id})` :
                `Could not import dataset to the [project ${instance.id}](/projects/${instance.id})`;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    importing: {
                        ...state.errors.importing,
                        dataset: {
                            message,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-' +
                                `${resource === 'annotation' ? 'load-annotation' : 'import-dataset'}-failed`,
                        },
                    },
                },
            };
        }
        case ImportActionTypes.IMPORT_BACKUP_SUCCESS: {
            const { instanceId, instanceType } = action.payload;
            return {
                ...state,
                messages: {
                    ...state.messages,
                    importing: {
                        ...state.messages.importing,
                        backup:
                            `The ${instanceType} has been restored successfully.
                            Click [here](/${instanceType}s/${instanceId}) to open`,
                    },
                },
            };
        }
        case ImportActionTypes.IMPORT_BACKUP_FAILED: {
            const { instanceType } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    importing: {
                        ...state.errors.importing,
                        backup: {
                            message:
                                `Could not restore ${instanceType} backup.`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case TasksActionTypes.GET_TASKS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    tasks: {
                        ...state.errors.tasks,
                        fetching: {
                            message: '无法获取任务',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case TasksActionTypes.DELETE_TASK_FAILED: {
            const { taskID } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    tasks: {
                        ...state.errors.tasks,
                        deleting: {
                            message: `无法删除 [任务 ${taskID}](/tasks/${taskID})`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-delete-task-failed',
                        },
                    },
                },
            };
        }
        case TasksActionTypes.CREATE_TASK_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    tasks: {
                        ...state.errors.tasks,
                        creating: {
                            message: '无法创建任务',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-create-task-failed',
                        },
                    },
                },
            };
        }
        case ProjectsActionTypes.GET_PROJECTS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    projects: {
                        ...state.errors.projects,
                        fetching: {
                            message: '无法获取项目',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ProjectsActionTypes.CREATE_PROJECT_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    projects: {
                        ...state.errors.projects,
                        creating: {
                            message: '无法创建项目',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-create-project-failed',
                        },
                    },
                },
            };
        }
        case ProjectsActionTypes.DELETE_PROJECT_FAILED: {
            const { projectId } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    projects: {
                        ...state.errors.projects,
                        updating: {
                            message: `无法删除 [项目 ${projectId}](/project/${projectId})`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-delete-project-failed',
                        },
                    },
                },
            };
        }
        case FormatsActionTypes.GET_FORMATS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    formats: {
                        ...state.errors.formats,
                        fetching: {
                            message: '无法从服务器获取格式',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AboutActionTypes.GET_ABOUT_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    about: {
                        ...state.errors.about,
                        fetching: {
                            message: '无法获得有关服务器的信息',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ModelsActionTypes.GET_INFERENCE_STATUS_SUCCESS: {
            if (action.payload.activeInference.status === 'finished') {
                const { taskID } = action.payload;
                return {
                    ...state,
                    messages: {
                        ...state.messages,
                        models: {
                            ...state.messages.models,
                            inferenceDone: '自动注释完成 ' +
                                `[任务 ${taskID}](/tasks/${taskID})`,
                        },
                    },
                };
            }

            return {
                ...state,
            };
        }
        case ModelsActionTypes.FETCH_META_FAILED: {
            if (action.payload.error.code === 403) {
                return state;
            }

            return {
                ...state,
                errors: {
                    ...state.errors,
                    models: {
                        ...state.errors.models,
                        metaFetching: {
                            message: '无法获取模型元信息',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ModelsActionTypes.GET_INFERENCE_STATUS_FAILED: {
            const { taskID } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    models: {
                        ...state.errors.models,
                        inferenceStatusFetching: {
                            message: `获取推理状态 [任务 ${taskID}](/tasks/${taskID})`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ModelsActionTypes.GET_MODELS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    models: {
                        ...state.errors.models,
                        fetching: {
                            message: '无法从服务器获取模型',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ModelsActionTypes.START_INFERENCE_FAILED: {
            const { taskID } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    models: {
                        ...state.errors.models,
                        starting: {
                            message: `无法推断模型 [任务 ${taskID}](/tasks/${taskID})`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ModelsActionTypes.CANCEL_INFERENCE_FAILED: {
            const { taskID } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    models: {
                        ...state.errors.models,
                        canceling: {
                            message: `无法取消模型推断 [任务 ${taskID}](/tasks/${taskID})`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.GET_JOB_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        jobFetching: {
                            message: '获取作业时出错',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-fetch-job-failed',
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.CHANGE_FRAME_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        frameFetching: {
                            message: `无法接收帧 ${action.payload.number}`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.SAVE_ANNOTATIONS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        saving: {
                            message: '无法保存注释',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-save-annotations-failed',
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.UPDATE_ANNOTATIONS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        updating: {
                            message: '无法更新注释',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-update-annotations-failed',
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.CREATE_ANNOTATIONS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        creating: {
                            message: '无法创建注释',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.MERGE_ANNOTATIONS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        merging: {
                            message: '无法合并注释',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.GROUP_ANNOTATIONS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        grouping: {
                            message: '无法对注释进行分组',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.JOIN_ANNOTATIONS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        joining: {
                            message: '无法连接注释',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.SLICE_ANNOTATIONS_FAILED:
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        slicing: {
                            message: '不能切割物体',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        case AnnotationActionTypes.SPLIT_ANNOTATIONS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        splitting: {
                            message: '不能分割轨迹',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.REMOVE_OBJECT_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        removing: {
                            message: '无法移除物体',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-remove-object-failed',
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.PROPAGATE_OBJECT_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        propagating: {
                            message: '不能传播对象',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.COLLECT_STATISTICS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        collectingStatistics: {
                            message: '无法收集注释统计信息',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.UPLOAD_JOB_ANNOTATIONS_FAILED: {
            const { job, error } = action.payload;

            const {
                id: jobID,
                taskId: taskID,
            } = job;

            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        uploadAnnotations: {
                            message:
                                `无法上传注释 [作业 ${jobID}](/tasks/${taskID}/jobs/${jobID})`,
                            reason: error.toString(),
                            className: 'cvat-notification-notice-upload-annotations-fail',
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.REMOVE_JOB_ANNOTATIONS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        removeAnnotations: {
                            message: '无法删除注释',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.FETCH_ANNOTATIONS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        fetchingAnnotations: {
                            message: '无法获取注解',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.REDO_ACTION_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        redo: {
                            message: '不能重做',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.UNDO_ACTION_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        undo: {
                            message: '无法撤销',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.SEARCH_ANNOTATIONS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        search: {
                            message: '无法执行搜索注释',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.SAVE_LOGS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        savingLogs: {
                            message: '无法将日志发送到服务器',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case BoundariesActionTypes.THROW_RESET_ERROR: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    boundaries: {
                        ...state.errors.annotation,
                        resetError: {
                            message: '无法重置状态',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case UserAgreementsActionTypes.GET_USER_AGREEMENTS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    userAgreements: {
                        ...state.errors.userAgreements,
                        fetching: {
                            message: '无法从服务器获取用户协议',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ReviewActionTypes.FINISH_ISSUE_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    review: {
                        ...state.errors.review,
                        finishingIssue: {
                            message: '无法打开新问题',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ReviewActionTypes.RESOLVE_ISSUE_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    review: {
                        ...state.errors.review,
                        resolvingIssue: {
                            message: '无法解决问题',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ReviewActionTypes.REOPEN_ISSUE_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    review: {
                        ...state.errors.review,
                        reopeningIssue: {
                            message: '无法重新打开问题',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ReviewActionTypes.COMMENT_ISSUE_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    review: {
                        ...state.errors.review,
                        commentingIssue: {
                            message: '不能评论这个问题吗',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ReviewActionTypes.SUBMIT_REVIEW_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    review: {
                        ...state.errors.review,
                        submittingReview: {
                            message: `无法提交审核 作业 ${action.payload.jobId}`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case ReviewActionTypes.REMOVE_ISSUE_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    review: {
                        ...state.errors.review,
                        deletingIssue: {
                            message: '无法从服务器上删除问题',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case NotificationsActionType.RESET_ERRORS: {
            return {
                ...state,
                errors: {
                    ...defaultState.errors,
                },
            };
        }
        case NotificationsActionType.RESET_MESSAGES: {
            return {
                ...state,
                messages: {
                    ...defaultState.messages,
                },
            };
        }
        case AnnotationActionTypes.GET_DATA_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        jobFetching: {
                            message: '无法接收图像数据',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-fetch-frame-data-from-the-server-failed',
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.CANVAS_ERROR_OCCURRED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        canvas: {
                            message: '发生画布错误',
                            reason: action.payload.error,
                            shouldLog: true,
                            className: 'cvat-notification-notice-canvas-error-occurreed',
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.DELETE_FRAME_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        deleteFrame: {
                            message: '无法删除帧',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case AnnotationActionTypes.RESTORE_FRAME_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    annotation: {
                        ...state.errors.annotation,
                        restoreFrame: {
                            message: '无法恢复帧',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case CloudStorageActionTypes.GET_CLOUD_STORAGE_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    cloudStorages: {
                        ...state.errors.cloudStorages,
                        fetching: {
                            message: '无法获取云存储',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                        },
                    },
                },
            };
        }
        case CloudStorageActionTypes.CREATE_CLOUD_STORAGE_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    cloudStorages: {
                        ...state.errors.cloudStorages,
                        creating: {
                            message: '无法创建云存储',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-create-cloud-storage-failed',
                        },
                    },
                },
            };
        }
        case CloudStorageActionTypes.UPDATE_CLOUD_STORAGE_FAILED: {
            const { cloudStorage, error } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    cloudStorages: {
                        ...state.errors.cloudStorages,
                        updating: {
                            message: `无法更新云存储 #${cloudStorage.id}`,
                            reason: error.toString(),
                            className: 'cvat-notification-notice-update-cloud-storage-failed',
                        },
                    },
                },
            };
        }
        case CloudStorageActionTypes.DELETE_CLOUD_STORAGE_FAILED: {
            const { cloudStorageID } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    cloudStorages: {
                        ...state.errors.cloudStorages,
                        deleting: {
                            message:
                                `无法删除云存储 ${cloudStorageID}`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-delete-cloud-storage-failed',
                        },
                    },
                },
            };
        }
        case CloudStorageActionTypes.LOAD_CLOUD_STORAGE_CONTENT_FAILED: {
            const { cloudStorageID } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    cloudStorages: {
                        ...state.errors.cloudStorages,
                        fetching: {
                            message: `无法为云存储获取内容 #${cloudStorageID}`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-fetch-cloud-storage-content-failed',
                        },
                    },
                },
            };
        }
        case CloudStorageActionTypes.GET_CLOUD_STORAGE_STATUS_FAILED: {
            const { cloudStorageID } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    cloudStorages: {
                        ...state.errors.cloudStorages,
                        fetching: {
                            message: `无法获取云存储 #${cloudStorageID} status`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-fetch-cloud-storage-status-failed',
                        },
                    },
                },
            };
        }

        case CloudStorageActionTypes.GET_CLOUD_STORAGE_PREVIEW_FAILED: {
            const { cloudStorageID } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    cloudStorages: {
                        ...state.errors.cloudStorages,
                        fetching: {
                            message: `无法获取云存储预览 #${cloudStorageID}`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-fetch-cloud-storage-preview-failed',
                        },
                    },
                },
            };
        }
        case OrganizationActionsTypes.CREATE_ORGANIZATION_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    organizations: {
                        ...state.errors.organizations,
                        creating: {
                            message: `无法创建组织 ${action.payload.slug}`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-create-organization-failed',
                        },
                    },
                },
            };
        }
        case OrganizationActionsTypes.UPDATE_ORGANIZATION_FAILED: {
            const { slug } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    organizations: {
                        ...state.errors.organizations,
                        updating: {
                            message: `无法更新组织 "${slug}"`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-update-organization-failed',
                        },
                    },
                },
            };
        }
        case OrganizationActionsTypes.ACTIVATE_ORGANIZATION_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    organizations: {
                        ...state.errors.organizations,
                        activation: {
                            message: `无法激活组织 ${action.payload.slug || ''}`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-activate-organization-failed',
                        },
                    },
                },
            };
        }
        case OrganizationActionsTypes.REMOVE_ORGANIZATION_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    organizations: {
                        ...state.errors.organizations,
                        deleting: {
                            message: `无法删除组织 ${action.payload.slug}`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-remove-organization-failed',
                        },
                    },
                },
            };
        }
        case OrganizationActionsTypes.INVITE_ORGANIZATION_MEMBERS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    organizations: {
                        ...state.errors.organizations,
                        inviting: {
                            message: '不能邀请组织成员',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-invite-organization-members-failed',
                        },
                    },
                },
            };
        }
        case OrganizationActionsTypes.INVITE_ORGANIZATION_MEMBER_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    organizations: {
                        ...state.errors.organizations,
                        inviting: {
                            message: `不能邀请这个成员"${action.payload.email}" 到该组织`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-invite-organization-member-failed',
                        },
                    },
                },
            };
        }
        case OrganizationActionsTypes.LEAVE_ORGANIZATION_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    organizations: {
                        ...state.errors.organizations,
                        leaving: {
                            message: '不能离开组织',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-leave-organization-failed',
                        },
                    },
                },
            };
        }
        case OrganizationActionsTypes.REMOVE_ORGANIZATION_MEMBER_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    organizations: {
                        ...state.errors.organizations,
                        removingMembership: {
                            message: `不能移除成员 "${action.payload.username}" 从该组织`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-remove-organization-member-failed',
                        },
                    },
                },
            };
        }
        case OrganizationActionsTypes.UPDATE_ORGANIZATION_MEMBER_FAILED: {
            const { role, username } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    organizations: {
                        ...state.errors.organizations,
                        updatingMembership: {
                            message: `无法分配角色 "${role}" 给用户 "${username}"`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-update-organization-membership-failed',
                        },
                    },
                },
            };
        }
        case JobsActionTypes.GET_JOBS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    jobs: {
                        ...state.errors.jobs,
                        fetching: {
                            message: '无法获取工作列表',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-get-jobs-failed',
                        },
                    },
                },
            };
        }
        case JobsActionTypes.CREATE_JOB_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    jobs: {
                        ...state.errors.jobs,
                        creating: {
                            message: '创建失败',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-create-job-failed',
                        },
                    },
                },
            };
        }
        case JobsActionTypes.UPDATE_JOB_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    jobs: {
                        ...state.errors.jobs,
                        updating: {
                            message: '无法更新作业',
                            reason: action.payload.error.toString(),
                            className: 'cvat-notification-notice-update-job-failed',
                        },
                    },
                },
            };
        }
        case JobsActionTypes.DELETE_JOB_FAILED: {
            const { jobID } = action.payload;
            return {
                ...state,
                errors: {
                    ...state.errors,
                    jobs: {
                        ...state.errors.jobs,
                        deleting: {
                            message: `无法删除作业 #${jobID}`,
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-delete-job-failed',
                        },
                    },
                },
            };
        }
        case WebhooksActionsTypes.GET_WEBHOOKS_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    webhooks: {
                        ...state.errors.webhooks,
                        fetching: {
                            message: '无法获取网络钩子列表',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-get-webhooks-failed',
                        },
                    },
                },
            };
        }
        case WebhooksActionsTypes.CREATE_WEBHOOK_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    webhooks: {
                        ...state.errors.webhooks,
                        creating: {
                            message: '无法创建网络钩子',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-create-webhook-failed',
                        },
                    },
                },
            };
        }
        case WebhooksActionsTypes.UPDATE_WEBHOOK_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    webhooks: {
                        ...state.errors.webhooks,
                        updating: {
                            message: '无法更新网络钩子',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-update-webhook-failed',
                        },
                    },
                },
            };
        }
        case WebhooksActionsTypes.DELETE_WEBHOOK_FAILED: {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    webhooks: {
                        ...state.errors.webhooks,
                        deleting: {
                            message: '无法删除网络钩子',
                            reason: action.payload.error,
                            shouldLog: !(action.payload.error instanceof ServerError),
                            className: 'cvat-notification-notice-delete-webhook-failed',
                        },
                    },
                },
            };
        }
        case BoundariesActionTypes.RESET_AFTER_ERROR:
        case AuthActionTypes.LOGOUT_SUCCESS: {
            return { ...defaultState };
        }
        default: {
            return state;
        }
    }
}
