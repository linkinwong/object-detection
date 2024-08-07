// Copyright (C) 2022 Intel Corporation
// Copyright (C) 2022-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Job } from 'cvat-core-wrapper';
import AudioAnnotator from "./audio-annotator";

import { Layout } from 'antd';

interface Props {
    job: Job;
    id: number;
    onJobUpdate: (job: Job) => void;
}

function JobAudioAnnotatorComponent(props: any) {
    return (
        <AudioAnnotator {...props} />
    );
}

export default React.memo(JobAudioAnnotatorComponent);
