// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useState } from 'react';

import Input from 'antd/lib/input';
import { SortingComponent, ResourceFilterHOC, defaultVisibility } from 'components/resource-sorting-filtering';
import { JobsQuery, ProjectsQuery, TasksQuery } from 'reducers';
// todo localstorage specific to tasks
import {
    localStorageRecentKeyword, localStorageRecentCapacity, predefinedFilterValues, config,
} from './tasks-filter-configuration';

const FilteringComponent = ResourceFilterHOC(
    config, localStorageRecentKeyword, localStorageRecentCapacity, predefinedFilterValues,
);

interface VisibleTopBarProps {
    onApplyFilter(filter: string | null): void;

    onApplySorting(sorting: string | null): void;

    onApplySearch(search: string | null): void;

    query: TasksQuery | ProjectsQuery | JobsQuery;
    importing: boolean;
    sortingFields: string[];

    dropdown?: JSX.Element;
}

export default function TopBarComponent(props: VisibleTopBarProps): JSX.Element {
    const {
        query, onApplyFilter, onApplySorting, onApplySearch, sortingFields, dropdown,
    } = props;
    const [visibility, setVisibility] = useState(defaultVisibility);

    return (
        <div className='w-full flex flex-col align-center gap-4 mb-4'>
            <div className='w-full gap-2 flex align-center justify-between'>
                <SortingComponent
                    visible={visibility.sorting}
                    onVisibleChange={(visible: boolean) => (
                        setVisibility({ ...defaultVisibility, sorting: visible })
                    )}
                    defaultFields={query.sort?.split(',') || ['-ID']}
                    onApplySorting={onApplySorting}
                    sortingFields={sortingFields}
                />
                <FilteringComponent
                    value={query.filter}
                    predefinedVisible={visibility.predefined}
                    builderVisible={visibility.builder}
                    recentVisible={visibility.recent}
                    onPredefinedVisibleChange={(visible: boolean) => (
                        setVisibility({ ...defaultVisibility, predefined: visible })
                    )}
                    onBuilderVisibleChange={(visible: boolean) => (
                        setVisibility({ ...defaultVisibility, builder: visible })
                    )}
                    onRecentVisibleChange={(visible: boolean) => (
                        setVisibility({ ...defaultVisibility, builder: visibility.builder, recent: visible })
                    )}
                    onApplyFilter={onApplyFilter}
                />
            </div>

            <div className='w-full gap-2 flex justify-between items-center cvat-tasks-page-filters-wrapper'>
                <Input.Search
                    enterButton
                    onSearch={(phrase: string) => {
                        onApplySearch(phrase);
                    }}
                    defaultValue={query.search || ''}
                    className='cvat-tasks-page-search-bar'
                    placeholder='Search ...'
                />
                {dropdown}
            </div>
        </div>
    );
}
