// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React from 'react';
import { Col, Row } from 'antd/lib/grid';
import Layout from 'antd/lib/layout';
import Button from 'antd/lib/button';
import './styles.scss';

const { Content } = Layout;

/**
 * Component for displaying message that email confirmation URL is incorrect
 */

export default function IncorrectEmailConfirmationPage(): JSX.Element {
    const { t } = useTranslation();
    return (
        <Layout>
            <Content>
                <Row justify='center' align='middle' id='incorrect-email-confirmation-page-container'>
                    <Col>
                        <h1>
                            This e-mail confirmation link expired or is invalid.
                        </h1>
                        <p>
                            Please issue a new e-mail confirmation request.
                        </p>
                        <Button className='cvat-go-to-login-button' type='link' href='/auth/login'>
                            {t('email-confirmation-pages_incorrect-email-confirmation_tsx.Gotologinpage', 'Go to login page')}
                        </Button>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}
