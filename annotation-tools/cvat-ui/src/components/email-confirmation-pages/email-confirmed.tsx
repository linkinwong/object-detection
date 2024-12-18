// Copyright (C) 2021-2022 Intel Corporation
// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { useTranslation } from 'react-i18next';
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Col, Row } from 'antd/lib/grid';
import Layout from 'antd/lib/layout';
import Statistic from 'antd/lib/statistic';
import './styles.scss';

const { Content } = Layout;
const { Countdown } = Statistic;

/**
 * Component for displaying email confirmation message and then redirecting to the login page
 */

function EmailConfirmationPage(): JSX.Element {
    const { t } = useTranslation();
    const linkRef = useRef<HTMLAnchorElement>(null);
    const onFinish = (): void => {
        linkRef.current?.click();
    };
    return (
        <Layout>
            <Content>
                <Row justify='center' align='middle' id='email-confirmation-page-container'>
                    <Col>
                        <h1>{t('email-confirmation-pages_email-confirmed_tsx.Youremailisconfirmed', 'Your email is confirmed')}</h1>
                        <Countdown format='ss' title='Redirecting to login page after...' value={Date.now() + 1000 * 6} onFinish={onFinish} />
                        <Link to='/' ref={linkRef}>{t('email-confirmation-pages_email-confirmed_tsx.Orclickthislink', 'Or click this link')}</Link>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

export default EmailConfirmationPage;
