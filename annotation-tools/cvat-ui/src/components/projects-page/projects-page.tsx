// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import Spin from 'antd/lib/spin';
import { CombinedState, Indexable } from 'reducers';
import { getProjectsAsync } from 'actions/projects-actions';
import { topBarOptions, updateHistoryFromQuery } from 'components/resource-sorting-filtering';
import Button from 'antd/lib/button';
import { LoadingOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import Dropdown from 'antd/lib/dropdown';
import { useTranslation } from 'react-i18next';
import EmptyListComponent from './empty-list';
import TopBarComponent from '../common/top-bar';
import ProjectListComponent from './project-list';
import { importActions } from '../../actions/import-actions';
import LoadingSkeleton from '../common/skeleton';

export default function ProjectsPageComponent(): JSX.Element {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const history = useHistory();
    const fetching = useSelector((state: CombinedState) => state.projects.fetching);
    const count = useSelector((state: CombinedState) => state.projects.current.length);
    const query = useSelector((state: CombinedState) => state.projects.gettingQuery);
    const tasksQuery = useSelector((state: CombinedState) => state.projects.tasksGettingQuery);
    const importing = useSelector((state: CombinedState) => state.import.projects.backup.importing);
    const [isMounted, setIsMounted] = useState(false);
    const anySearch = Object.keys(query).some((value: string) => value !== 'page' && (query as any)[value] !== null);

    const queryParams = new URLSearchParams(history.location.search);
    const updatedQuery = { ...query };
    for (const key of Object.keys(updatedQuery)) {
        (updatedQuery as Indexable)[key] = queryParams.get(key) || null;
        if (key === 'page') {
            updatedQuery.page = updatedQuery.page ? +updatedQuery.page : 1;
        }
    }

    useEffect(() => {
        dispatch(getProjectsAsync({ ...updatedQuery }));
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            history.replace({
                search: updateHistoryFromQuery(query),
            });
        }
    }, [query]);

    const content = count ? <ProjectListComponent /> : <EmptyListComponent notFound={anySearch} />;

    return (
        <div className='cvat-tasks-page'>
            <TopBarComponent
                onApplySearch={(search: string | null) => {
                    dispatch(
                        getProjectsAsync({
                            ...query,
                            search,
                            page: 1,
                        }, { ...tasksQuery, page: 1 }),
                    );
                }}
                onApplyFilter={(filter: string | null) => {
                    dispatch(
                        getProjectsAsync({
                            ...query,
                            filter,
                            page: 1,
                        }, { ...tasksQuery, page: 1 }),
                    );
                }}
                onApplySorting={(sorting: string | null) => {
                    dispatch(
                        getProjectsAsync({
                            ...query,
                            sort: sorting,
                            page: 1,
                        }, { ...tasksQuery, page: 1 }),
                    );
                }}
                sortingFields={topBarOptions.sortingFields.projects}
                query={updatedQuery}
                importing={importing}
                dropdown={(
                    <Dropdown
                        destroyPopupOnHide
                        trigger={['click']}
                        overlay={(
                            <div className='cvat-projects-page-control-buttons-wrapper'>
                                <Button
                                    id='cvat-create-project-button'
                                    className='cvat-create-project-button'
                                    type='primary'
                                    onClick={(): void => history.push('/projects/create')}
                                    icon={<PlusOutlined />}
                                >
                                    {t('projects-page_top-bar_tsx.Createanewproject', 'Create a new project')}
                                </Button>
                                <Button
                                    className='cvat-import-project-button'
                                    type='primary'
                                    disabled={importing}
                                    icon={<UploadOutlined />}
                                    onClick={() => dispatch(importActions.openImportBackupModal('project'))}
                                >
                                    {t('projects-page_top-bar_tsx.Createfrombackup', 'Create from backup')}
                                    {importing && <LoadingOutlined className='cvat-import-project-button-loading' />}
                                </Button>
                            </div>
                        )}
                    >
                        <Button type='primary' className='cvat-create-project-dropdown' icon={<PlusOutlined />} />
                    </Dropdown>
                )}
            />
            { fetching ? (<LoadingSkeleton />) : content }
        </div>
    );
}
