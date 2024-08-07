// Copyright (C) 2022 Intel Corporation
// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React from 'react';

import Text from 'antd/lib/typography/Text';
import Upload, { RcFile } from 'antd/lib/upload';
import { InboxOutlined } from '@ant-design/icons';

interface Props {
    files: File[];
    many: boolean;
    onUpload: (_: RcFile, uploadedFiles: RcFile[]) => boolean;
}

export default function LocalFiles(props: Props): JSX.Element {
    const { files, onUpload, many } = props;
    const hintText = many ? 'You can upload one or more videos' :
        'You can upload an archive with images, a video, or multiple images';

    const onChange = (info) => {
        const {status} = info.file;
        console.log('status: ', status);
        if (status !== 'uploading') {
            console.log(info.file, info.fileList);
        }
        if (status === 'done') {
            // message.success(`${info.file.name} file uploaded successfully.`);
            console.log(`${info.file.name} file uploaded successfully.`);
        } else if (status === 'error') {
            // message.error(`${info.file.name} file upload failed.`);
            console.log(`${info.file.name} file upload failed.`);
        }
    }

    return (
        <>
            <Upload.Dragger
                multiple
                listType='text'
                fileList={files as any[]}
                showUploadList={
                    files.length < 5 && {
                        showRemoveIcon: false,
                    }
                }
                beforeUpload={onUpload}
            >
                <p className='ant-upload-drag-icon'>
                    <InboxOutlined />
                </p>
                <p className='ant-upload-text'>{useTranslation().t('file-manager_local-files_tsx.Clickordragfilestoth', 'Click or drag files to this area')}</p>
                <p className='ant-upload-hint'>{ hintText }</p>
            </Upload.Dragger>
            {files.length >= 5 && (
                <>
                    <br />
                    <Text className='cvat-text-color'>{`${files.length} files selected`}</Text>
                </>
            )}
        </>
    );
}
