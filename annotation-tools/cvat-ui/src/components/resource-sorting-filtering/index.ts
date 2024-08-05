// Copyright (C) 2022 Intel Corporation
//
// SPDX-License-Identifier: MIT

import './styles.scss';
import { Indexable } from 'reducers';
import SortingComponent from './sorting';
import ResourceFilterHOC from './filtering';

const defaultVisibility = {
    predefined: false,
    recent: false,
    builder: false,
    sorting: false,
};

function updateHistoryFromQuery(query: Indexable): string {
    const search = new URLSearchParams({
        ...(query.filter ? { filter: query.filter } : {}),
        ...(query.search ? { search: query.search } : {}),
        ...(query.sort ? { sort: query.sort } : {}),
        ...(query.page ? { page: `${query.page}` } : {}),
    });

    return search.toString();
}

const topBarOptions = {
    sortingFields: {
        tasks: ['ID', 'Owner', 'Status', 'Assignee', 'Updated date', 'Subset', 'Mode', 'Dimension', 'Project ID', 'Name', 'Project name'],
        projects: ['ID', 'Assignee', 'Owner', 'Status', 'Name', 'Updated date'],
        jobs: ['ID', 'Assignee', 'Updated date', 'Stage', 'State', 'Task ID', 'Project ID', 'Task name', 'Project name'],
    },
};

export {
    topBarOptions,
    SortingComponent,
    ResourceFilterHOC,
    defaultVisibility,
    updateHistoryFromQuery,
};
