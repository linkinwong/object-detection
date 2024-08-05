// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, {RefObject} from 'react';
import Input from 'antd/lib/input';
import Text from 'antd/lib/typography/Text';
import Tooltip from 'antd/lib/tooltip';
import Form, {FormInstance} from 'antd/lib/form';
import Select from 'antd/lib/select';
import {QuestionCircleOutlined} from '@ant-design/icons';

const {Option} = Select;

export interface BaseConfiguration {
    name: string;
    type: string;
}

interface Props {
    onChange(values: BaseConfiguration): void;

    many: boolean;
    exampleMultiTaskName?: string;
}

class BasicConfigurationForm extends React.PureComponent<Props> {
    private formRef: RefObject<FormInstance>;
    private inputRef: RefObject<Input>;
    private initialName: string;
    private initialType: string;

    public constructor(props: Props) {
        super(props);
        this.formRef = React.createRef<FormInstance>();
        this.inputRef = React.createRef<Input>();

        const {many} = this.props;
        this.initialName = many ? '{{file_name}}' : '';
        this.initialType = '';
    }

    componentDidMount(): void {
        const {onChange} = this.props;
        onChange({
            name: this.initialName,
        });
    }

    private handleChangeName(e: React.ChangeEvent<HTMLInputElement>): void {
        const type = this.initialType;
        const {onChange} = this.props;
        onChange({
            name: e.target.value,
            type,
        });
        this.initialName = e.target.value;
    }

    private handleChangeType(e): void {
        const name = this.initialName;
        const {onChange} = this.props;
        onChange({
            type: e,
            name,
        });
        this.initialType = e;
    }

    public submit(): Promise<void> {
        if (this.formRef.current) {
            return this.formRef.current.validateFields();
        }

        return Promise.reject(new Error('Form ref is empty'));
    }

    public resetFields(): void {
        if (this.formRef.current) {
            this.formRef.current.resetFields();
        }
    }

    public focus(): void {
        if (this.inputRef.current) {
            this.inputRef.current.focus();
        }
    }

    public render(): JSX.Element {
        const {many, exampleMultiTaskName} = this.props;

        return (
            <Form ref={this.formRef} layout='vertical'>
                <Form.Item
                    hasFeedback
                    name='name'
                    label={<span>名称</span>}
                    rules={[
                        {
                            required: true,
                            message: 'Task name cannot be empty',
                        },
                    ]}
                    initialValue={this.initialName}
                >
                    <Input
                        ref={this.inputRef}
                        onChange={(e) => this.handleChangeName(e)}
                    />
                </Form.Item>
                {many ? (
                    <Text type='secondary'>
                        <Tooltip title={() => (
                            <>
                                您可以在模板中替换
                                <ul>
                                    <li>
                                        some_text - 任何文本
                                    </li>
                                    <li>
                                        {'{{'}
                                        index
                                        {'}}'}
                                        &nbsp;- index file in set
                                    </li>
                                    <li>
                                        {'{{'}
                                        file_name
                                        {'}}'}
                                        &nbsp;- name of file
                                    </li>
                                </ul>
                                Example:&nbsp;
                                <i>
                                    {exampleMultiTaskName || 'Task name 1 - video_1.mp4'}
                                </i>
                            </>
                        )}
                        >
                            When forming the name, a template is used.
                            {' '}
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </Text>
                ) : null}
                <Form.Item
                    name='type'
                    label={<span>类型</span>}
                    rules={[
                        {
                            required: true,
                            message: '任务类型不能为空',
                        },
                    ]}
                >
                    <Select
                        placeholder='选择任务类型'
                        onChange={(e) => this.handleChangeType(e)}
                        allowClear
                    >
                        <Option value='image'>图片（jpg, jpeg, png, bmp）</Option>
                        <Option value='audio'>语音（mp3, wav）</Option>
                        <Option value='text'>文本（上传语音文件可自动转成文本）</Option>
                        <Option value='video'>视频（mp4, avi, wmv）</Option>
                    </Select>
                </Form.Item>
            </Form>
        );
    }
}

export default BasicConfigurationForm;
