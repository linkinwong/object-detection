// Copyright (c) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import './styles.scss';
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Modal from 'antd/lib/modal';
import Notification from 'antd/lib/notification';
import Text from 'antd/lib/typography/Text';
import Input from 'antd/lib/input';
import Form from 'antd/lib/form';
import { CombinedState, StorageLocation } from 'reducers';
import { exportActions, exportBackupAsync } from 'actions/export-actions';
import { getCore, Storage, StorageData } from 'cvat-core-wrapper';

import TargetStorageField from 'components/storage/target-storage-field';

const core = getCore();

type FormValues = {
    customName: string | undefined;
    targetStorage: StorageData;
    useProjectTargetStorage: boolean;
};

const initialValues: FormValues = {
    customName: undefined,
    targetStorage: {
        location: StorageLocation.LOCAL,
        cloudStorageId: undefined,
    },
    useProjectTargetStorage: true,
};

function ExportBackupModal(): JSX.Element {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [instanceType, setInstanceType] = useState('');
    const [useDefaultStorage, setUseDefaultStorage] = useState(true);
    const [storageLocation, setStorageLocation] = useState(StorageLocation.LOCAL);
    const [defaultStorageLocation, setDefaultStorageLocation] = useState(StorageLocation.LOCAL);
    const [defaultStorageCloudId, setDefaultStorageCloudId] = useState<number | null>(null);
    const [helpMessage, setHelpMessage] = useState('');

    const instanceT = useSelector((state: CombinedState) => state.export.instanceType);
    const instance = useSelector((state: CombinedState) => {
        if (!instanceT) {
            return null;
        }
        return state.export[`${instanceT}s` as 'projects' | 'tasks']?.backup?.modalInstance;
    });

    useEffect(() => {
        if (instance instanceof core.classes.Project) {
            setInstanceType(`project #${instance.id}`);
        } else if (instance instanceof core.classes.Task) {
            setInstanceType(`task #${instance.id}`);
        }
    }, [instance]);

    useEffect(() => {
        if (instance) {
            setDefaultStorageLocation(instance.targetStorage.location);
            setDefaultStorageCloudId(instance.targetStorage.cloudStorageId);
        }
    }, [instance]);

    useEffect(() => {
        // eslint-disable-next-line prefer-template
        const message = `Export backup to ${(defaultStorageLocation) ? defaultStorageLocation.split('_')[0] : 'local'} ` +
                        `storage ${(defaultStorageCloudId) ? `№${defaultStorageCloudId}` : ''}`;
        setHelpMessage(message);
    }, [defaultStorageLocation, defaultStorageCloudId]);

    const closeModal = (): void => {
        setUseDefaultStorage(true);
        setStorageLocation(StorageLocation.LOCAL);
        form.resetFields();
        dispatch(exportActions.closeExportBackupModal(instance));
    };

    const handleExport = useCallback(
        (values: FormValues): void => {
            dispatch(
                exportBackupAsync(
                    instance,
                    new Storage({
                        location: useDefaultStorage ? defaultStorageLocation : values.targetStorage?.location,
                        cloudStorageId: useDefaultStorage ? (
                            defaultStorageCloudId
                        ) : (
                            values.targetStorage?.cloudStorageId
                        ),
                    }),
                    useDefaultStorage,
                    values.customName ? `${values.customName}.zip` : undefined,
                ),
            );
            closeModal();
            Notification.info({
                message: t('export-backup_export-backup-modal_tsx.ExportMsg'),
                description:
                    t('export-backup_export-backup-modal_tsx.ExportMsg') +
                    t('export-backup_export-backup-modal_tsx.ExportDescription'),
                className: 'cvat-notification-notice-export-backup-start',
            });
        },
        [instance, useDefaultStorage, defaultStorageLocation, defaultStorageCloudId],
    );

    return (
        <Modal
            title={<Text strong>{`Export ${instanceType}`}</Text>}
            visible={!!instance}
            onCancel={closeModal}
            onOk={() => form.submit()}
            className={`cvat-modal-export-${instanceType.split(' ')[0]}`}
            destroyOnClose
        >
            <Form
                name={`Export ${instanceType}`}
                form={form}
                layout='vertical'
                initialValues={initialValues}
                onFinish={handleExport}
            >
                <Form.Item label={<Text strong>{t('export-backup_export-backup-modal_tsx.Customname', 'Custom name')}</Text>} name='customName'>
                    <Input
                        placeholder={t('export-backup_export-backup-modal_tsx.labelPlaceholder')}
                        suffix='.zip'
                        className='cvat-modal-export-filename-input'
                    />
                </Form.Item>
                <TargetStorageField
                    instanceId={instance?.id}
                    switchDescription={t('export-backup_export-backup-modal_tsx.TargetStorageSwitchDescription')}
                    switchHelpMessage={helpMessage}
                    useDefaultStorage={useDefaultStorage}
                    storageDescription={`${t('export-backup_export-backup-modal_tsx.TargetStorageSwitchDescription')} ${instanceType}`}
                    locationValue={storageLocation}
                    onChangeUseDefaultStorage={(value: boolean) => setUseDefaultStorage(value)}
                    onChangeLocationValue={(value: StorageLocation) => setStorageLocation(value)}
                />
            </Form>
        </Modal>
    );
}

export default React.memo(ExportBackupModal);
