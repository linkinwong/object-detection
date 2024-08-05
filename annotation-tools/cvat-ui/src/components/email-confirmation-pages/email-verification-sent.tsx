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
 * Component for displaying message that email should be verified
 */

export default function EmailVerificationSentPage(): JSX.Element {
    const { t } = useTranslation();
    return (
        <Layout>
            <Content>
                <Row justify='center' align='middle' id='email-verification-sent-page-container'>
                    <Col>
                        <h1>{t('email-confirmation-pages_email-verification-sent_tsx.Pleaseconfirmyourema', 'Please, confirm your email')}</h1>
                        <Button className='cvat-go-to-login-button' type='link' href='/auth/login'>
                            {t('email-confirmation-pages_email-verification-sent_tsx.Gotologinpage', 'Go to login page')}
                        </Button>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}
