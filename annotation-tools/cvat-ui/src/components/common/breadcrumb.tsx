import { Breadcrumb, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import { useGoBack } from 'utils/hooks';

const breadcrumbNameMap: Record<string, string> = {
    '/': '首页',
    '/tasks': '任务',
    '/projects': '项目',
    '/jobs': '作业',
    '/analytics': '分析',
    '/cloudstorages': '云存储',
    '/models': '模型',
    '/auth/login': '登录',
};

export const ABreadcrumb = () => {
    const goBack = useGoBack();

    const isTopNav = Object.keys(breadcrumbNameMap).find((key) => location.pathname === key);
    if (isTopNav) return null;
    return (
        <Button className='!flex !items-center !pl-1' type="text" icon={<ArrowLeftOutlined />} onClick={() => {
            goBack();
        }}>
            返回
        </Button>
    );
}
