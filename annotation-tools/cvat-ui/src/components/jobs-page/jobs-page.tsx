// Copyright (C) 2022 Intel Corporation
// Copyright (C) 2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import '../common/top-bar/styles.scss';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

import Pagination from 'antd/lib/pagination';
import Empty from 'antd/lib/empty';
import Text from 'antd/lib/typography/Text';

import { Job } from 'cvat-core-wrapper';
import { topBarOptions, updateHistoryFromQuery } from 'components/resource-sorting-filtering';
import { CombinedState, Indexable } from 'reducers';
import { getJobsAsync, updateJobAsync } from 'actions/jobs-actions';

import { useTranslation } from 'react-i18next';
import TopBarComponent from '../common/top-bar';
import JobsContentComponent from './jobs-content';
import LoadingSkeleton from '../common/skeleton';

function JobsPageComponent(): JSX.Element {
    const dispatch = useDispatch();
    const history = useHistory();
    const [isMounted, setIsMounted] = useState(false);
    const query = useSelector((state: CombinedState) => state.jobs.query);
    const fetching = useSelector((state: CombinedState) => state.jobs.fetching);
    const count = useSelector((state: CombinedState) => state.jobs.count);
    const onJobUpdate = useCallback((job: Job) => {
        dispatch(updateJobAsync(job));
    }, []);

    const queryParams = new URLSearchParams(history.location.search);
    const updatedQuery = { ...query };
    for (const key of Object.keys(updatedQuery)) {
        (updatedQuery as Indexable)[key] = queryParams.get(key) || null;
        if (key === 'page') {
            updatedQuery.page = updatedQuery.page ? +updatedQuery.page : 1;
        }
    }

    useEffect(() => {
        dispatch(getJobsAsync({ ...updatedQuery }));
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            history.replace({
                search: updateHistoryFromQuery(query),
            });
        }
    }, [query]);
    const { t } = useTranslation();

    const content = count ? (
        <div className='flex flex-col gap-4 items-center'>
            <JobsContentComponent onJobUpdate={onJobUpdate} />
            <Pagination
                className='cvat-jobs-page-pagination'
                onChange={(page: number) => {
                    dispatch(getJobsAsync({
                        ...query,
                        page,
                    }));
                }}
                showSizeChanger={false}
                total={count}
                pageSize={12}
                current={query.page}
                showQuickJumper
            />
        </div>
    ) : <Empty description={<Text>{t('jobs-page_jobs-page_tsx.Noresultsmatchedyour', 'No results matched your search...')}</Text>} />;

    return (
        <div className='cvat-tasks-page'>
            <TopBarComponent
                query={updatedQuery}
                onApplySearch={(search: string | null) => {
                    dispatch(
                        getJobsAsync({
                            ...query,
                            search,
                            page: 1,
                        }),
                    );
                }}
                onApplyFilter={(filter: string | null) => {
                    dispatch(
                        getJobsAsync({
                            ...query,
                            filter,
                            page: 1,
                        }),
                    );
                }}
                onApplySorting={(sorting: string | null) => {
                    dispatch(
                        getJobsAsync({
                            ...query,
                            sort: sorting,
                            page: 1,
                        }),
                    );
                }}
                importing={false}
                sortingFields={topBarOptions.sortingFields.jobs}
            />
            { fetching ? <LoadingSkeleton /> : content }
        </div>
    );
}

export default React.memo(JobsPageComponent);
