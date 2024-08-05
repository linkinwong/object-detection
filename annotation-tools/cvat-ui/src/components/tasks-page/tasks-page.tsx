// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import { useDispatch } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import Spin from 'antd/lib/spin';
import { Col, Row } from 'antd/lib/grid';
import Pagination from 'antd/lib/pagination';
import CvatDropdownMenuPaper from 'components/common/cvat-dropdown-menu-paper';

import { TasksQuery, Indexable } from 'reducers';
import { updateHistoryFromQuery, topBarOptions } from 'components/resource-sorting-filtering';
import TaskListContainer from 'containers/tasks-page/tasks-list';
import { getTasksAsync } from 'actions/tasks-actions';

import Button from 'antd/lib/button';
import { LoadingOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';

import { useTranslation } from 'react-i18next';
import { MultiPlusIcon } from 'icons';
import { importActions } from 'actions/import-actions';
import { usePrevious } from 'utils/hooks';
import Dropdown from 'antd/lib/dropdown';
import EmptyListComponent from './empty-list';
import TopBar from '../common/top-bar';
import LoadingSkeleton from '../common/skeleton';

interface Props {
    fetching: boolean;
    importing: boolean;
    query: TasksQuery;
    count: number;
}

function TasksPageComponent(props: Props): JSX.Element {
    const {
        query, fetching, importing, count,
    } = props;

    const dispatch = useDispatch();
    const history = useHistory();
    const [isMounted, setIsMounted] = useState(false);
    const { t } = useTranslation();
    const prevImporting = usePrevious(importing);

    const queryParams = new URLSearchParams(history.location.search);
    const updatedQuery = { ...query };
    for (const key of Object.keys(updatedQuery)) {
        (updatedQuery as Indexable)[key] = queryParams.get(key) || null;
        if (key === 'page') {
            updatedQuery.page = updatedQuery.page ? +updatedQuery.page : 1;
        }
    }

    useEffect(() => {
        dispatch(getTasksAsync({ ...updatedQuery }));
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            history.replace({
                search: updateHistoryFromQuery(query),
            });
        }
    }, [query]);

    const content = count ? (
        <div className='flex flex-col gap-4 items-center'>
            <TaskListContainer />
            <Pagination
                className='cvat-tasks-pagination'
                onChange={(page: number) => {
                    dispatch(getTasksAsync({
                        ...query,
                        page,
                    }));
                }}
                showSizeChanger={false}
                total={count}
                pageSize={10}
                current={query.page}
                showQuickJumper
            />
        </div>
    ) : (
        <EmptyListComponent query={query} />
    );

    return (
        <div className='cvat-tasks-page'>
            <TopBar
                onApplySearch={(search: string | null) => {
                    dispatch(
                        getTasksAsync({
                            ...query,
                            search,
                            page: 1,
                        }),
                    );
                }}
                onApplyFilter={(filter: string | null) => {
                    dispatch(
                        getTasksAsync({
                            ...query,
                            filter,
                            page: 1,
                        }),
                    );
                }}
                onApplySorting={(sorting: string | null) => {
                    dispatch(
                        getTasksAsync({
                            ...query,
                            sort: sorting,
                            page: 1,
                        }),
                    );
                }}
                sortingFields={topBarOptions.sortingFields.tasks}
                query={updatedQuery}
                importing={importing}
                dropdown={(
                    <Dropdown
                        trigger={['click']}
                        destroyPopupOnHide
                        overlay={(
                            <CvatDropdownMenuPaper>
                                <Button
                                    className='cvat-create-task-button'
                                    type='primary'
                                    onClick={(): void => history.push('/tasks/create')}
                                    icon={<PlusOutlined />}
                                >
                                    {t('tasks-page_top-bar_tsx.Createanewtask', 'Create a new task')}
                                </Button>
                                <Button
                                    className='cvat-create-multi-tasks-button'
                                    type='primary'
                                    onClick={(): void => history.push('/tasks/create?many=true')}
                                    icon={<span className='anticon'><MultiPlusIcon /></span>}
                                >
                                    {t('tasks-page_top-bar_tsx.Createmultitasks', 'Create multi tasks')}
                                </Button>
                                <Button
                                    className='cvat-import-task-button'
                                    type='primary'
                                    disabled={importing}
                                    icon={<UploadOutlined />}
                                    onClick={() => dispatch(importActions.openImportBackupModal('task'))}
                                >
                                    {t('tasks-page_top-bar_tsx.Createmultitasks', 'Create from backup')}
                                    {importing && <LoadingOutlined />}
                                </Button>
                            </CvatDropdownMenuPaper>
                        )}
                    >
                        <Button type='primary' className='cvat-create-task-dropdown' icon={<PlusOutlined />} />
                    </Dropdown>
                )}
            />
            { fetching ? (<LoadingSkeleton />) : content }
        </div>
    );
}

export default React.memo(TasksPageComponent);
