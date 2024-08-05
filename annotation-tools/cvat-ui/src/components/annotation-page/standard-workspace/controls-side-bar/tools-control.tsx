// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { ReactPortal } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import Icon, {
    EnvironmentFilled,
    EnvironmentOutlined,
    LoadingOutlined,
    QuestionCircleOutlined,
    PoweroffOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons';
import Popover from 'antd/lib/popover';
import Select from 'antd/lib/select';
import Tooltip from 'antd/lib/tooltip';
import Button from 'antd/lib/button';
import Space from 'antd/lib/space';
import Modal from 'antd/lib/modal';
import Text from 'antd/lib/typography/Text';
import Tabs from 'antd/lib/tabs';
import { Row, Col } from 'antd/lib/grid';
import notification from 'antd/lib/notification';
import message from 'antd/lib/message';
import Dropdown from 'antd/lib/dropdown';
import Switch from 'antd/lib/switch';
import lodash from 'lodash';
import { storeMsgAction } from 'actions/ws-actions';

import { AIToolsIcon } from 'icons';
import { Canvas, convertShapesForInteractor } from 'cvat-canvas-wrapper';
import {
    getCore, Label, MLModel, ObjectState, Job,
} from 'cvat-core-wrapper';
import openCVWrapper, { MatType } from 'utils/opencv-wrapper/opencv-wrapper';
import {
    CombinedState, ActiveControl, ObjectType, ShapeType, ToolsBlockerState,
} from 'reducers';
import {
    interactWithCanvas,
    switchNavigationBlocked as switchNavigationBlockedAction,
    fetchAnnotationsAsync,
    updateAnnotationsAsync,
    createAnnotationsAsync,
} from 'actions/annotation-actions';
import DetectorRunner, { DetectorRequestBody } from 'components/model-runner-modal/detector-runner';
import LabelSelector from 'components/label-selector/label-selector';
import CVATTooltip from 'components/common/cvat-tooltip';

import ApproximationAccuracy, {
    thresholdFromAccuracy,
} from 'components/annotation-page/standard-workspace/controls-side-bar/approximation-accuracy';
import { switchToolsBlockerState } from 'actions/settings-actions';
import { AIToolsAutoAnnotation, AIToolsLoading } from 'actions/annotation-actions';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import withVisibilityHandling from './handle-popover-visibility';
import ToolsTooltips from './interactor-tooltips';
import Axios from "axios";
import { updateAnnotationMsg } from 'utils/annotation-msg';

interface StateToProps {
    id: any;
    ws: any;
    canvasInstance: Canvas;
    labels: Label[];
    languages: [];
    states: ObjectState[];
    activeLabelID: number;
    frameFilename: string;
    jobInstance: Job;
    isActivated: boolean;
    isAIToolsLoading: boolean;
    frame: number;
    colors: [];
    interactors: MLModel[];
    detectors: MLModel[];
    trackers: MLModel[];
    curZOrder: number;
    defaultApproxPolyAccuracy: number;
    toolsBlockerState: ToolsBlockerState;
    frameIsDeleted: boolean;
}

interface DispatchToProps {
    wsStoreMsg(m: any): void;
    onInteractionStart(activeInteractor: MLModel, activeLabelID: number): void;
    updateAnnotations(statesToUpdate: any[]): void;
    createAnnotations(statesToCreate: any[]): void;
    fetchAnnotations(): void;
    onSwitchToolsBlockerState(toolsBlockerState: ToolsBlockerState): void;
    onAIToolsAutoAnnotation(states): void;
    onAIToolsLoading(loading): void;
    switchNavigationBlocked(navigationBlocked: boolean): void;
}

const MIN_SUPPORTED_INTERACTOR_VERSION = 2;
const core = getCore();
const CustomPopover = withVisibilityHandling(Popover, 'tools-control');

var stateTem = {
    shapeType: 'rectangle',
    points: [],
    content: '',
    zOrder: 0,
    objectType: 'shape',
    label: {},
    frame: 0,
    rotation: 0,
    occluded: false,
    outside: false,
    clientID: 0,
    group: { id: 0, color: '#E0E0E0' },
};

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            job: { instance: jobInstance, labels },
            colors,
            canvas: { instance: canvasInstance, activeControl },
            player: {
                frame: {
                    number: frame,
                    data: { deleted: frameIsDeleted },
                    filename: frameFilename,
                },
            },
            annotations: {
                zLayer: { cur: curZOrder },
                states,
            },
            drawing: { activeLabelID },
            isAIToolsLoading,
        },
        models: {
            interactors, detectors, trackers,
        },
        settings: {
            workspace: { toolsBlockerState, defaultApproxPolyAccuracy },
        },
        ws,
        auth: {
            user: {
                id,
            }
        }
    } = state;
    const languages = [{id: 1, name: '中文'}, {id: 2, name: '英文'}];
    return {
        ws,
        id,
        interactors,
        detectors,
        trackers,
        isActivated: activeControl === ActiveControl.AI_TOOLS,
        isAIToolsLoading,
        activeLabelID,
        labels,
        states,
        canvasInstance: canvasInstance as Canvas,
        jobInstance,
        frameFilename,
        frame,
        colors,
        curZOrder,
        defaultApproxPolyAccuracy,
        toolsBlockerState,
        frameIsDeleted,
        languages,
    } as StateToProps;
}

const mapDispatchToProps = {
    wsStoreMsg: storeMsgAction,
    onInteractionStart: interactWithCanvas,
    updateAnnotations: updateAnnotationsAsync,
    createAnnotations: createAnnotationsAsync,
    fetchAnnotations: fetchAnnotationsAsync,
    onSwitchToolsBlockerState: switchToolsBlockerState,
    onAIToolsAutoAnnotation: AIToolsAutoAnnotation,
    onAIToolsLoading: AIToolsLoading,
    switchNavigationBlocked: switchNavigationBlockedAction,
};

type Props = StateToProps & DispatchToProps;
interface TrackedShape {
    clientID: number;
    serverlessState: any;
    shapePoints: number[];
    trackerModel: MLModel;
}

interface State {
    activeInteractor: MLModel | null;
    activeLabelID: number;
    activeLanguageID: string;
    activeTracker: MLModel | null;
    convertMasksToPolygons: boolean;
    trackedShapes: TrackedShape[];
    fetching: boolean;
    pointsReceived: boolean;
    approxPolyAccuracy: number;
    mode: 'detection' | 'interaction' | 'tracking';
    portals: React.ReactPortal[];
}

function trackedRectangleMapper(shape: number[]): number[] {
    return shape.reduce(
        (acc: number[], value: number, index: number): number[] => {
            if (index % 2) {
                // y
                acc[1] = Math.min(acc[1], value);
                acc[3] = Math.max(acc[3], value);
            } else {
                // x
                acc[0] = Math.min(acc[0], value);
                acc[2] = Math.max(acc[2], value);
            }
            return acc;
        },
        [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
    );
}

function registerPlugin(): (callback: null | (() => void)) => void {
    let onTrigger: null | (() => void) = null;
    const listener = {
        name: 'Remove annotations listener',
        description: 'Tracker needs to know when annotations is reset in the job',
        cvat: {
            classes: {
                Job: {
                    prototype: {
                        annotations: {
                            clear: {
                                leave(self: any, result: any) {
                                    if (typeof onTrigger === 'function') {
                                        onTrigger();
                                    }
                                    return result;
                                },
                            },
                        },
                    },
                },
            },
        },
    };

    core.plugins.register(listener);

    return (callback: null | (() => void)) => {
        onTrigger = callback;
    };
}

const onRemoveAnnotations = registerPlugin();

export class ToolsControlComponent extends React.PureComponent<Props, State> {
    private interaction: {
        id: string | null;
        isAborted: boolean;
        latestResponse: {
            rle: number[];
            points: number[][];
            bounds?: [number, number, number, number];
        };
        lastestApproximatedPoints: number[][];
        latestRequest: null | {
            interactor: MLModel;
            data: {
                frame: number;
                neg_points: number[][];
                pos_points: number[][];
            };
        } | null;
        hideMessage: (() => void) | null;
    };
    private readonly AIToolsOptions: [];
    private AIToolsSelected: string;
    private request_id: string;

    public constructor(props: Props) {
        super(props);
        this.state = {
            convertMasksToPolygons: false,
            activeInteractor: props.interactors.length ? props.interactors[0] : null,
            activeTracker: props.trackers.length ? props.trackers[0] : null,
            activeLabelID: props.labels.length ? props.labels[0].id : null,
            activeLanguageID: props.languages.length ? props.languages[0].id : null,
            approxPolyAccuracy: props.defaultApproxPolyAccuracy,
            trackedShapes: [],
            fetching: false,
            pointsReceived: false,
            mode: 'interaction',
            portals: [],
        };
        this.interaction = {
            id: null,
            isAborted: false,
            latestResponse: {
                rle: [],
                points: [],
            },
            lastestApproximatedPoints: [],
            latestRequest: null,
            hideMessage: null,
        };
        this.AIToolsOptions = [
            {
                label: 'OCR',
                options: [
                    { label: '中文', value: 'ch' },
                    { label: '英文', value: 'en' },
                ],
            },
            {
                label: '人脸识别',
                options: [{ label: '人脸识别', value: 'face' }],
            },
            {
                label: '对象检测',
                options: [{ label: '对象检测', value: 'object' }],
            },
            {
                label: '语义分割',
                options: [{ label: '语义分割', value: 'segment' }],
            },
            {
                label: '视频追踪',
                options: [{ label: '视频追踪', value: 'video_track' }],
            },
        ];
        this.AIToolsSelected = 'ch';
        const { id: userId, jobInstance } = props;
        const { taskId, id } = jobInstance;
        this.request_id = [userId, taskId, id].join('_');
    }

    public componentDidMount(): void {
        const {  canvasInstance, ws, id: userId, wsStoreMsg, jobInstance } = this.props;
        onRemoveAnnotations(() => {
            this.setState({ trackedShapes: [] });
        });

        this.setState({
            portals: this.collectTrackerPortals(),
        });
        canvasInstance.html().addEventListener('canvas.interacted', this.interactionListener);
        canvasInstance.html().addEventListener('canvas.canceled', this.cancelListener);

        const { instance, msg } = ws;
        /**
         * 消息会全局缓存
         * 当前有消息接收，则 onmessage驱动直接更新
         * 当前有annotation缓存，则手动触发更新（考虑消息接收时不在当前页面的情况）
         * 可能存在问题
         *   手动更新数据量会很大，需要分批次渲染
         */

        // 初始化读取全部缓存数据填充
        updateAnnotationMsg(ws, this.request_id, 0, (data: []) => {
            this.onClickAITools('video_track', data);
        });

        // 当前有消息接收，则 onmessage驱动直接更新
        if (instance) {
            instance.on(async (msg: any) => {
                updateAnnotationMsg(ws, this.request_id, 60, (data: []) => {
                    this.onClickAITools('video_track', data);
                });
            });
        }
    }

    public componentDidUpdate(prevProps: Props, prevState: State): void {
        const {
            ws, id: userId, jobInstance, isActivated, defaultApproxPolyAccuracy, canvasInstance, states,
        } = this.props;
        const { approxPolyAccuracy, mode, activeTracker } = this.state;

        if (prevProps.states !== states || prevState.activeTracker !== activeTracker) {
            this.setState({
                portals: this.collectTrackerPortals(),
            });
        }

        /*if (jobInstance !== prevProps.jobInstance) {
            // 切换任务
            updateAnnotationMsg(ws, this.request_id, 0, (data: []) => {
                this.onClickAITools('video_track', data);
            });
        }*/

        if (prevProps.isActivated && !isActivated) {
            window.removeEventListener('contextmenu', this.contextmenuDisabler);
            // hide interaction message if exists
            if (this.interaction.hideMessage) {
                this.interaction.hideMessage();
                this.interaction.hideMessage = null;
            }
        } else if (!prevProps.isActivated && isActivated) {
            // reset flags when start interaction/tracking
            this.interaction = {
                id: null,
                isAborted: false,
                latestResponse: { rle: [], points: [] },
                lastestApproximatedPoints: [],
                latestRequest: null,
                hideMessage: null,
            };

            this.setState({
                approxPolyAccuracy: defaultApproxPolyAccuracy,
                pointsReceived: false,
            });
            window.addEventListener('contextmenu', this.contextmenuDisabler);
        }

        if (prevState.approxPolyAccuracy !== approxPolyAccuracy) {
            if (isActivated && mode === 'interaction' && this.interaction.latestResponse.points.length) {
                this.approximateResponsePoints(this.interaction.latestResponse.points)
                    .then((points: number[][]) => {
                        this.interaction.lastestApproximatedPoints = points;
                        canvasInstance.interact({
                            enabled: true,
                            intermediateShape: {
                                shapeType: ShapeType.POLYGON,
                                points: this.interaction.lastestApproximatedPoints.flat(),
                            },
                            onChangeToolsBlockerState: this.onChangeToolsBlockerState,
                        });
                    });
            }
        }

        this.checkTrackedStates(prevProps);
    }

    public componentWillUnmount(): void {
        // 切换页面，清空当前 request_id 停止更新
        const { canvasInstance, wsStoreMsg } = this.props;
        wsStoreMsg({ request_id: this.request_id, isCurrentJobPath: false });
        this.request_id = '';
        onRemoveAnnotations(null);
        canvasInstance.html().removeEventListener('canvas.interacted', this.interactionListener);
        canvasInstance.html().removeEventListener('canvas.canceled', this.cancelListener);
    }

    private contextmenuDisabler = (e: MouseEvent): void => {
        if (
            e.target &&
            (e.target as Element).classList &&
            (e.target as Element).classList.toString().includes('ant-modal')
        ) {
            e.preventDefault();
        }
    };

    private cancelListener = async (): Promise<void> => {
        const { fetching } = this.state;
        if (fetching) {
            // user pressed ESC
            this.setState({ fetching: false });
            this.interaction.isAborted = true;
        }
    };

    private runInteractionRequest = async (interactionId: string): Promise<void> => {
        const { jobInstance, canvasInstance } = this.props;
        const { activeInteractor, fetching, convertMasksToPolygons } = this.state;

        const { id, latestRequest } = this.interaction;
        if (id !== interactionId || !latestRequest || fetching) {
            // current interaction request is not relevant (new interaction session has started)
            // or a user didn't add more points
            // or one server request is on processing
            return;
        }

        const { interactor, data } = latestRequest;
        this.interaction.latestRequest = null;

        try {
            this.interaction.hideMessage = message.loading({
                content: `Waiting a response from ${activeInteractor?.name}..`,
                duration: 0,
                className: 'cvat-tracking-notice',
            });
            try {
                // run server request
                this.setState({ fetching: true });
                const response = await core.lambda.call(
                    jobInstance.taskId,
                    interactor,
                    { ...data, job: jobInstance.id },
                );

                // if only mask presented, let's receive points
                if (response.mask && !response.points) {
                    const left = response.bounds ? response.bounds[0] : 0;
                    const top = response.bounds ? response.bounds[1] : 0;
                    response.points = await this.receivePointsFromMask(response.mask, left, top);
                }

                // approximation with cv.approxPolyDP
                const approximated = await this.approximateResponsePoints(response.points);
                const rle = core.utils.mask2Rle(response.mask.flat());
                if (response.bounds) {
                    rle.push(...response.bounds);
                } else {
                    const height = response.mask.length;
                    const width = response.mask[0].length;
                    rle.push(0, 0, width - 1, height - 1);
                }

                response.mask = rle;

                if (this.interaction.id !== interactionId || this.interaction.isAborted) {
                    // new interaction session or the session is aborted
                    return;
                }

                this.interaction.latestResponse = {
                    bounds: response.bounds,
                    points: response.points,
                    rle,
                };
                this.interaction.lastestApproximatedPoints = approximated;

                this.setState({ pointsReceived: !!response.points.length });
            } finally {
                if (this.interaction.id === interactionId && this.interaction.hideMessage) {
                    this.interaction.hideMessage();
                    this.interaction.hideMessage = null;
                }

                this.setState({ fetching: false });
            }

            if (this.interaction.lastestApproximatedPoints.length) {
                canvasInstance.interact({
                    enabled: true,
                    intermediateShape: {
                        shapeType: convertMasksToPolygons ? ShapeType.POLYGON : ShapeType.MASK,
                        points: convertMasksToPolygons ? this.interaction.lastestApproximatedPoints.flat() :
                            this.interaction.latestResponse.rle,
                    },
                    onChangeToolsBlockerState: this.onChangeToolsBlockerState,
                });
            }

            setTimeout(() => this.runInteractionRequest(interactionId));
        } catch (error: any) {
            notification.error({
                description: <ReactMarkdown>{error.message}</ReactMarkdown>,
                message: 'Interaction error occurred',
                duration: null,
            });
        }
    };

    private onInteraction = (e: Event): void => {
        const { frame, isActivated } = this.props;
        const { activeInteractor } = this.state;

        if (!isActivated) {
            return;
        }

        if (!this.interaction.id) {
            this.interaction.id = lodash.uniqueId('interaction_');
        }

        const { shapesUpdated, isDone, shapes } = (e as CustomEvent).detail;
        if (isDone) {
            // make an object from current result
            // do not make one more request
            // prevent future requests if possible
            this.interaction.isAborted = true;
            this.interaction.latestRequest = null;
            if (this.interaction.lastestApproximatedPoints.length) {
                this.constructFromPoints();
            }
        } else if (shapesUpdated) {
            const interactor = activeInteractor as MLModel;
            this.interaction.latestRequest = {
                interactor,
                data: {
                    frame,
                    pos_points: convertShapesForInteractor(shapes, 0),
                    neg_points: convertShapesForInteractor(shapes, 2),
                },
            };

            this.runInteractionRequest(this.interaction.id);
        }
    };

    private onTracking = async (e: Event): Promise<void> => {
        const { trackedShapes, activeTracker } = this.state;
        const {
            isActivated, jobInstance, frame, curZOrder, fetchAnnotations,
        } = this.props;

        if (!isActivated) {
            return;
        }

        const { activeLabelID } = this.state;
        const [label] = jobInstance.labels.filter((_label: any): boolean => _label.id === activeLabelID);

        const { isDone, shapesUpdated } = (e as CustomEvent).detail;
        if (!isDone || !shapesUpdated) {
            return;
        }

        try {
            const { points } = (e as CustomEvent).detail.shapes[0];
            const state = new core.classes.ObjectState({
                shapeType: ShapeType.RECTANGLE,
                objectType: ObjectType.TRACK,
                source: core.enums.Source.SEMI_AUTO,
                zOrder: curZOrder,
                label,
                points,
                frame,
                occluded: false,
                attributes: {},
                descriptions: [`Trackable (${activeTracker?.name})`],
            });

            const [clientID] = await jobInstance.annotations.put([state]);
            this.setState({
                trackedShapes: [
                    ...trackedShapes,
                    {
                        clientID,
                        serverlessState: null,
                        shapePoints: points,
                        trackerModel: activeTracker as MLModel,
                    },
                ],
            });

            // update annotations on a canvas
            fetchAnnotations();
        } catch (error: any) {
            notification.error({
                description: <ReactMarkdown>{error.message}</ReactMarkdown>,
                message: 'Tracking error occurred',
                duration: null,
            });
        }
    };

    private interactionListener = async (e: Event): Promise<void> => {
        const { mode } = this.state;

        if (mode === 'interaction') {
            await this.onInteraction(e);
        }

        if (mode === 'tracking') {
            await this.onTracking(e);
        }
    };

    private setActiveInteractor = (value: string): void => {
        const { interactors } = this.props;
        const [interactor] = interactors.filter((_interactor: MLModel) => _interactor.id === value);

        if (interactor.version < MIN_SUPPORTED_INTERACTOR_VERSION) {
            notification.warning({
                message: 'Interactor API is outdated',
                description: 'Probably, you should consider updating the serverless function',
            });
        }

        this.setState({
            activeInteractor: interactor,
        });
    };

    private setActiveTracker = (value: string): void => {
        const { trackers } = this.props;
        this.setState({
            activeTracker: trackers.filter((tracker: MLModel) => tracker.id === value)[0],
        });
    };

    private onChangeToolsBlockerState = (event: string): void => {
        const { isActivated, onSwitchToolsBlockerState } = this.props;
        if (isActivated && event === 'keydown') {
            onSwitchToolsBlockerState({ algorithmsLocked: true });
        } else if (isActivated && event === 'keyup') {
            onSwitchToolsBlockerState({ algorithmsLocked: false });
        }
    };

    private AIToolsOcr = (curClientID, curPoints, response, annotations) => {
        const data = response.data.data.val;
        const { createAnnotations, labels } = this.props;
        const { onAIToolsAutoAnnotation, frame } = this.props;
        stateTem.label = labels.length ? labels[0] : {};
        stateTem.frame = frame;
        stateTem.shapeType = 'rectangle';
        stateTem.objectType = 'shape';
        let tAnnotations = [];
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (curPoints.some((subArr) => subArr.every((val, index) => val === item.point[index]))) {
                continue;
            }
            stateTem.points = item.point;
            stateTem.content = item.content;
            stateTem.clientID = curClientID + i + 1;
            const objectState = new core.classes.ObjectState(stateTem);
            tAnnotations.push(objectState);
        }
        if (tAnnotations.length) {
            // eslint-disable-next-line no-param-reassign
            annotations = [].concat(annotations, tAnnotations);
            createAnnotations(annotations);
            onAIToolsAutoAnnotation(annotations);
        }
    };

    private AIToolsFace = (curClientID, curPoints, response, annotations) => {
        const { data } = response.data;
        const { createAnnotations, labels } = this.props;
        const { onAIToolsAutoAnnotation, frame } = this.props;
        stateTem.label = labels.length ? labels[0] : {};
        stateTem.frame = frame;
        stateTem.shapeType = 'points';
        stateTem.objectType = 'shape';
        let tAnnotations = [];
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (curPoints.some((subArr) => subArr.every((val, index) => val === item[index]))) {
                continue;
            }
            stateTem.points = item;
            stateTem.clientID = curClientID + i + 1;
            const objectState = new core.classes.ObjectState(stateTem);
            tAnnotations.push(objectState);
        }
        if (tAnnotations.length) {
            // eslint-disable-next-line no-param-reassign
            annotations = [].concat(annotations, tAnnotations);
            createAnnotations(annotations);
            onAIToolsAutoAnnotation(annotations);
        }
    };

    private AIToolsObject = (curClientID, curPoints, response, annotations) => {
        const data = response.data.data;
        const { createAnnotations, labels } = this.props;
        const { onAIToolsAutoAnnotation, frame } = this.props;
        stateTem.label = labels.length ? labels[0] : {};
        stateTem.frame = frame;
        stateTem.shapeType = 'rectangle';
        stateTem.objectType = 'shape';
        let tAnnotations = [];
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (curPoints.some((subArr) => subArr.every((val, index) => val === item.point[index]))) {
                continue;
            }
            stateTem.points = item.point;
            stateTem.content = item.content;
            stateTem.clientID = curClientID + i + 1;
            const objectState = new core.classes.ObjectState(stateTem);
            tAnnotations.push(objectState);
        }
        if (tAnnotations.length) {
            // eslint-disable-next-line no-param-reassign
            annotations = [].concat(annotations, tAnnotations);
            createAnnotations(annotations);
            onAIToolsAutoAnnotation(annotations);
        }
    };

    private AIToolsSegment = (curClientID, curPoints, response, annotations) => {
        const { data } = response.data;
        const { createAnnotations, labels } = this.props;
        const { onAIToolsAutoAnnotation, frame } = this.props;
        stateTem.label = labels.length ? labels[0] : {};
        stateTem.frame = frame;
        stateTem.shapeType = 'polygon';
        stateTem.objectType = 'shape';
        let tAnnotations = [];
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (curPoints.some((subArr) => subArr.every((val, index) => val === item.point[index]))) {
                continue;
            }
            stateTem.points = item.point;
            stateTem.content = item.content;
            stateTem.clientID = curClientID + i + 1;
            const objectState = new core.classes.ObjectState(stateTem);
            tAnnotations.push(objectState);
        }
        if (tAnnotations.length) {
            // eslint-disable-next-line no-param-reassign
            annotations = [].concat(annotations, tAnnotations);
            createAnnotations(annotations);
            onAIToolsAutoAnnotation(annotations);
        }
    };

    private AIToolsVideoTrack = (curClientID, curPoints, data, annotations) => {
        if (!data?.length) return;
        const { createAnnotations, states, labels, colors } = this.props;
        const { onAIToolsAutoAnnotation, frame } = this.props;
        stateTem.label = labels.length ? labels[0] : {};
        stateTem.shapeType = 'rectangle';
        stateTem.objectType = 'shape';
        let tAnnotations = [];

        for (let i = 0; i < data.length; i++) {
            const item = data[i];

            if (curPoints.some((subArr) => subArr.every((val, index) => val === item.point[index]))) {
                continue;
            }
            stateTem.points = item.point;
            stateTem.content = item.content;
            stateTem.frame =  item.frame - 1;
            stateTem.clientID = curClientID + i + 1;
            stateTem.group = {
                id: item.content,
                color: colors[item.content % colors.length],
            };
            const objectState = new core.classes.ObjectState(stateTem);
            tAnnotations.push(objectState);
        }

        if (tAnnotations.length) {
            createAnnotations(tAnnotations);
            onAIToolsAutoAnnotation(tAnnotations);
        }
    };

    private onClickAITools = (type: string, data: object): void => {
        const timeout = 60000;
        // eslint-disable-next-line react/destructuring-assignment
        let annotations = this.props.states;
        const { jobInstance, frameFilename, wsStoreMsg, id: userID } = this.props;
        const { taskId, id } = jobInstance;
        const tPoints = annotations.map((item) => item.points);
        const sIndex = tPoints.length ? annotations[tPoints.length - 1].clientID : 0;

        if (type === 'video_track') {
            this.AIToolsSelected = type;
            this.AIToolsVideoTrack(sIndex, tPoints, data, annotations);
            return;
        }

        const { onAIToolsLoading, ws: { msg } } = this.props;
        onAIToolsLoading(true);
        const url = `/api/jobs/${id}/AITools?type=${this.AIToolsSelected}` +
        `&frameFilename=${frameFilename}` +
        `&taskId=${taskId}&user_id=${userID}&id=${id}`;

        Axios.get(url, {
            timeout,
        }).then((response) => {
            // todo store the request_id
            onAIToolsLoading(false);
            const option = this.AIToolsOptions.find(
                dict => dict.options.find(option => option.value === this.AIToolsSelected)
            );
            message.success(`AI Tools 执行完成 ${option.label}`);
            switch (this.AIToolsSelected) {
                case 'ch':
                case 'en': {
                    this.AIToolsOcr(sIndex, tPoints, response, annotations);
                    break;
                }
                case 'face': {
                    this.AIToolsFace(sIndex, tPoints, response, annotations);
                    break;
                }
                case 'object': {
                    this.AIToolsObject(sIndex, tPoints, response, annotations);
                    break;
                }
                case 'segment': {
                    this.AIToolsSegment(sIndex, tPoints, response, annotations);
                    break;
                }
                case 'video_track': {
                    wsStoreMsg({ request_id: this.request_id });
                    break;
                }
                default: {
                    message.error(`AI Tools 类型错误 ${this.AIToolsSelected}`);
                }
            }
        }).catch((error) => {
            if (error.code === 'ECONNABORTED') {
                message.error('请求超时');
            } else {
                message.error(error.message);
            }
            onAIToolsLoading(false);
        });
    };

    private collectTrackerPortals(): React.ReactPortal[] {
        const { states, fetchAnnotations } = this.props;
        const { trackedShapes, activeTracker } = this.state;

        const trackedClientIDs = trackedShapes.map((trackedShape: TrackedShape) => trackedShape.clientID);
        const portals = !activeTracker ?
            [] :
            states
                .filter((objectState) => objectState.objectType === 'track' && objectState.shapeType === 'rectangle')
                .map((objectState: any): React.ReactPortal | null => {
                    const { clientID } = objectState;
                    const selectorID = `#cvat-objects-sidebar-state-item-${clientID}`;
                    let targetElement = window.document.querySelector(
                        `${selectorID} .cvat-object-item-button-prev-keyframe`,
                    ) as HTMLElement;

                    const isTracked = trackedClientIDs.includes(clientID);
                    if (targetElement) {
                        targetElement = targetElement.parentElement?.parentElement as HTMLElement;
                        return ReactDOM.createPortal(
                            <Col>
                                {isTracked ? (
                                    <CVATTooltip overlay='Disable tracking'>
                                        <EnvironmentFilled
                                            onClick={() => {
                                                const filteredStates = trackedShapes.filter(
                                                    (trackedShape: TrackedShape) => trackedShape.clientID !== clientID,
                                                );
                                                /* eslint no-param-reassign: ["error", { "props": false }] */
                                                objectState.descriptions = [];
                                                objectState.save().then(() => {
                                                    this.setState({
                                                        trackedShapes: filteredStates,
                                                    });
                                                });
                                                fetchAnnotations();
                                            }}
                                        />
                                    </CVATTooltip>
                                ) : (
                                    <CVATTooltip overlay={`Enable tracking using ${activeTracker.name}`}>
                                        <EnvironmentOutlined
                                            onClick={() => {
                                                objectState.descriptions = [`Trackable (${activeTracker.name})`];
                                                objectState.save().then(() => {
                                                    this.setState({
                                                        trackedShapes: [
                                                            ...trackedShapes,
                                                            {
                                                                clientID,
                                                                serverlessState: null,
                                                                shapePoints: objectState.points,
                                                                trackerModel: activeTracker,
                                                            },
                                                        ],
                                                    });
                                                });
                                                fetchAnnotations();
                                            }}
                                        />
                                    </CVATTooltip>
                                )}
                            </Col>,
                            targetElement,
                        );
                    }

                    return null;
                })
                .filter((portal: ReactPortal | null) => portal !== null);

        return portals as React.ReactPortal[];
    }

    private async checkTrackedStates(prevProps: Props): Promise<void> {
        const {
            frame,
            jobInstance,
            states: objectStates,
            trackers,
            fetchAnnotations,
            switchNavigationBlocked,
        } = this.props;
        const { trackedShapes } = this.state;
        let withServerRequest = false;

        type AccumulatorType = {
            statefull: {
                [index: string]: {
                    // tracker id
                    clientIDs: number[];
                    states: any[];
                    shapes: number[][];
                };
            };
            stateless: {
                [index: string]: {
                    // tracker id
                    clientIDs: number[];
                    shapes: number[][];
                };
            };
        };

        if (prevProps.frame !== frame && trackedShapes.length) {
            // 1. find all trackable objects on the current frame
            // 2. divide them into two groups: with relevant state, without relevant state
            const trackingData = trackedShapes.reduce<AccumulatorType>(
                (acc: AccumulatorType, trackedShape: TrackedShape): AccumulatorType => {
                    const {
                        serverlessState, shapePoints, clientID, trackerModel,
                    } = trackedShape;
                    const [clientState] = objectStates.filter((_state: any): boolean => _state.clientID === clientID);

                    if (
                        !clientState ||
                        clientState.keyframes.prev !== frame - 1 ||
                        clientState.keyframes.last >= frame
                    ) {
                        return acc;
                    }

                    if (clientState && !clientState.outside) {
                        const { points } = clientState;
                        withServerRequest = true;
                        const stateIsRelevant =
                            serverlessState !== null &&
                            points.length === shapePoints.length &&
                            points.every((coord: number, i: number) => coord === shapePoints[i]);
                        if (stateIsRelevant) {
                            const container = acc.statefull[trackerModel.id] || {
                                clientIDs: [],
                                shapes: [],
                                states: [],
                            };
                            container.clientIDs.push(clientID);
                            container.shapes.push(points);
                            container.states.push(serverlessState);
                            acc.statefull[trackerModel.id] = container;
                        } else {
                            const container = acc.stateless[trackerModel.id] || {
                                clientIDs: [],
                                shapes: [],
                            };
                            container.clientIDs.push(clientID);
                            container.shapes.push(points);
                            acc.stateless[trackerModel.id] = container;
                        }
                    }

                    return acc;
                },
                {
                    statefull: {},
                    stateless: {},
                },
            );

            try {
                if (withServerRequest) {
                    switchNavigationBlocked(true);
                }
                // 3. get relevant state for the second group
                for (const trackerID of Object.keys(trackingData.stateless)) {
                    let hideMessage = null;
                    try {
                        const [tracker] = trackers.filter((_tracker: MLModel) => _tracker.id === trackerID);
                        if (!tracker) {
                            throw new Error(`Suitable tracker with ID ${trackerID} not found in tracker list`);
                        }

                        const trackableObjects = trackingData.stateless[trackerID];
                        const numOfObjects = trackableObjects.clientIDs.length;
                        hideMessage = message.loading({
                            content: `${tracker.name}: states are being initialized for ${numOfObjects} ${
                                numOfObjects > 1 ? 'objects' : 'object'
                            } ..`,
                            duration: 0,
                            className: 'cvat-tracking-notice',
                        });
                        // eslint-disable-next-line no-await-in-loop
                        const response = await core.lambda.call(jobInstance.taskId, tracker, {
                            frame: frame - 1,
                            shapes: trackableObjects.shapes,
                            job: jobInstance.id,
                        });

                        const { states: serverlessStates } = response;
                        const statefullContainer = trackingData.statefull[trackerID] || {
                            clientIDs: [],
                            shapes: [],
                            states: [],
                        };

                        Array.prototype.push.apply(statefullContainer.clientIDs, trackableObjects.clientIDs);
                        Array.prototype.push.apply(statefullContainer.shapes, trackableObjects.shapes);
                        Array.prototype.push.apply(statefullContainer.states, serverlessStates);
                        trackingData.statefull[trackerID] = statefullContainer;
                        delete trackingData.stateless[trackerID];
                    } catch (error: any) {
                        notification.error({
                            message: 'Tracker initialization error',
                            description: <ReactMarkdown>{error.message}</ReactMarkdown>,
                            duration: null,
                        });
                    } finally {
                        if (hideMessage) hideMessage();
                    }
                }

                for (const trackerID of Object.keys(trackingData.statefull)) {
                    // 4. run tracking for all the objects
                    let hideMessage = null;
                    try {
                        const [tracker] = trackers.filter((_tracker: MLModel) => _tracker.id === trackerID);
                        if (!tracker) {
                            throw new Error(`Suitable tracker with ID ${trackerID} not found in tracker list`);
                        }

                        const trackableObjects = trackingData.statefull[trackerID];
                        const numOfObjects = trackableObjects.clientIDs.length;
                        hideMessage = message.loading({
                            content: `${tracker.name}: ${numOfObjects} ${
                                numOfObjects > 1 ? 'objects are' : 'object is'
                            } being tracked..`,
                            duration: 0,
                            className: 'cvat-tracking-notice',
                        });
                        // eslint-disable-next-line no-await-in-loop
                        const response = await core.lambda.call(jobInstance.taskId, tracker, {
                            frame,
                            shapes: trackableObjects.shapes,
                            states: trackableObjects.states,
                            job: jobInstance.id,
                        });

                        response.shapes = response.shapes.map(trackedRectangleMapper);
                        for (let i = 0; i < trackableObjects.clientIDs.length; i++) {
                            const clientID = trackableObjects.clientIDs[i];
                            const shape = response.shapes[i];
                            const state = response.states[i];
                            const [objectState] = objectStates.filter(
                                (_state: any): boolean => _state.clientID === clientID,
                            );
                            const [trackedShape] = trackedShapes.filter(
                                (_trackedShape: TrackedShape) => _trackedShape.clientID === clientID,
                            );
                            objectState.points = shape;
                            objectState.save().then(() => {
                                trackedShape.serverlessState = state;
                                trackedShape.shapePoints = shape;
                            });
                        }
                    } catch (error: any) {
                        notification.error({
                            message: 'Tracking error',
                            description: <ReactMarkdown>{error.message}</ReactMarkdown>,
                            duration: null,
                        });
                    } finally {
                        if (hideMessage) hideMessage();
                        fetchAnnotations();
                    }
                }
            } finally {
                if (withServerRequest) {
                    switchNavigationBlocked(false);
                }
            }
        }
    }

    private async constructFromPoints(): Promise<void> {
        const { convertMasksToPolygons } = this.state;
        const {
            frame, labels, curZOrder, activeLabelID, createAnnotations,
        } = this.props;

        if (convertMasksToPolygons) {
            const object = new core.classes.ObjectState({
                frame,
                objectType: ObjectType.SHAPE,
                source: core.enums.Source.SEMI_AUTO,
                label: labels.length ? labels.filter((label: any) => label.id === activeLabelID)[0] : null,
                shapeType: ShapeType.POLYGON,
                points: this.interaction.lastestApproximatedPoints.flat(),
                occluded: false,
                zOrder: curZOrder,
            });

            createAnnotations([object]);
        } else {
            const object = new core.classes.ObjectState({
                frame,
                objectType: ObjectType.SHAPE,
                source: core.enums.Source.SEMI_AUTO,
                label: labels.length ? labels.filter((label: any) => label.id === activeLabelID)[0] : null,
                shapeType: ShapeType.MASK,
                points: this.interaction.latestResponse.rle,
                occluded: false,
                zOrder: curZOrder,
            });

            createAnnotations([object]);
        }
    }

    private async initializeOpenCV(): Promise<void> {
        if (!openCVWrapper.isInitialized) {
            const hide = message.loading('OpenCV client initialization..', 0);
            try {
                await openCVWrapper.initialize(() => {});
            } catch (error: any) {
                notification.error({
                    message: 'Could not initialize OpenCV',
                    description: <ReactMarkdown>{error.message}</ReactMarkdown>,
                    duration: null,
                });
            } finally {
                hide();
            }
        }
    }

    private async receivePointsFromMask(
        mask: number[][],
        left: number,
        top: number,
    ): Promise<number[]> {
        await this.initializeOpenCV();

        const src = openCVWrapper.mat.fromData(mask[0].length, mask.length, MatType.CV_8UC1, mask.flat());
        try {
            const polygons = openCVWrapper.contours.findContours(src, true);
            return polygons[0].map((val: number, idx: number) => {
                if (idx % 2) {
                    return val + top;
                }

                return val + left;
            });
        } finally {
            src.delete();
        }
    }

    private async approximateResponsePoints(points: number[][]): Promise<number[][]> {
        const { approxPolyAccuracy } = this.state;
        if (points.length > 3) {
            await this.initializeOpenCV();
            const threshold = thresholdFromAccuracy(approxPolyAccuracy);
            return openCVWrapper.contours.approxPoly(points, threshold);
        }

        return points;
    }

    private renderMasksConvertingBlock(): JSX.Element {
        const { convertMasksToPolygons } = this.state;
        return (
            <Row className='cvat-interactors-setups-container'>
                <Switch
                    checked={convertMasksToPolygons}
                    onChange={(checked: boolean) => {
                        this.setState({ convertMasksToPolygons: checked });
                    }}
                />
                <Text>
                    将掩码转换为多边形
                </Text>
            </Row>
        );
    }

    private renderLabelBlock(): JSX.Element {
        const { labels } = this.props;
        const { activeLabelID } = this.state;
        return (
            <>
                <Row justify='start'>
                    <Col>
                        <Text className='cvat-text-color'>Label</Text>
                    </Col>
                </Row>
                <Row justify='center'>
                    <Col span={24}>
                        <LabelSelector
                            style={{ width: '100%' }}
                            labels={labels}
                            value={activeLabelID}
                            onChange={(value: any) => this.setState({ activeLabelID: value.id })}
                        />
                    </Col>
                </Row>
            </>
        );
    }

    // private renderLanguageBlock(): JSX.Element {
    //     const { languages } = this.props;
    //     const { activeLanguageID } = this.state;
    //     return (
    //         <>
    //             <Row justify='start'>
    //                 <Col>
    //                     <Text className='cvat-text-color'>Language</Text>
    //                 </Col>
    //             </Row>
    //             <Row justify='center'>
    //                 <Col span={24}>
    //                     <LabelSelector
    //                         style={{ width: '100%' }}
    //                         labels={languages}
    //                         value={activeLanguageID}
    //                         onChange={(value: any) => this.setState({ activeLanguageID: value.id })}
    //                     />
    //                 </Col>
    //             </Row>
    //         </>
    //     );
    // }
    private renderLanguageBlock(): JSX.Element {
        const {languages} = this.props;
        const {activeLanguageID} = this.state;
        return (
            <div>
                <Row justify='start'>
                    <Space>
                        <Text className='cvat-text-color'>Language</Text>
                        <LabelSelector
                            style={{width: '100%'}}
                            labels={languages}
                            value={activeLanguageID}
                            onChange={(value: any) => this.setState({activeLanguageID: value.id})}
                        />
                        <Tooltip placement="topLeft" title='执行AI自动标注'>
                            <Button type='primary'
                                    icon={this.props.isAIToolsLoading ? <PoweroffOutlined/> : <PlayCircleOutlined/>}
                                    loading={this.props.isAIToolsLoading} onClick={this.onClickAutoAnnotation}>
                            </Button>
                        </Tooltip>
                    </Space>
                </Row>
            </div>
        );
    }

    private renderAIToolsBlock(): JSX.Element {
        const handleChange = (value: string) => {
            this.AIToolsSelected = value;
        };
        return (
            <div>
                <Row justify='start'>
                    <Space>
                        <Select
                            defaultValue='ch'
                            style={{ width: 150 }}
                            onChange={handleChange}
                            options={this.AIToolsOptions}
                        />
                        <Tooltip placement='topLeft' title='执行'>
                            <Button type='primary'
                                    icon={this.props.isAIToolsLoading ? <PoweroffOutlined /> : <PlayCircleOutlined />}
                                    loading={this.props.isAIToolsLoading} onClick={this.onClickAITools}>
                            </Button>
                        </Tooltip>
                    </Space>
                </Row>
            </div>
        );
    }

    private renderTrackerBlock(): JSX.Element {
        const {
            trackers, canvasInstance, jobInstance, frame, onInteractionStart,
        } = this.props;
        const { activeTracker, activeLabelID, fetching } = this.state;
        if (!trackers.length) {
            return (
                <Row justify='center' align='middle' style={{ marginTop: '5px' }}>
                    <Col>
                        <Text type='warning' className='cvat-text-color'>
                            没有可用的追踪器
                        </Text>
                    </Col>
                </Row>
            );
        }

        return (
            <>
                <Row justify='start'>
                    <Col>
                        <Text className='cvat-text-color'>Tracker</Text>
                    </Col>
                </Row>
                <Row align='middle' justify='center'>
                    <Col span={24}>
                        <Select
                            style={{ width: '100%' }}
                            defaultValue={trackers[0].name}
                            onChange={this.setActiveTracker}
                        >
                            {trackers.map(
                                (tracker: MLModel): JSX.Element => (
                                    <Select.Option value={tracker.id} title={tracker.description} key={tracker.id}>
                                        {tracker.name}
                                    </Select.Option>
                                ),
                            )}
                        </Select>
                    </Col>
                </Row>
                <Row align='middle' justify='end'>
                    <Col>
                        <Button
                            type='primary'
                            loading={fetching}
                            className='cvat-tools-track-button'
                            disabled={!activeTracker || fetching || frame === jobInstance.stopFrame}
                            onClick={() => {
                                this.setState({ mode: 'tracking' });

                                if (activeTracker) {
                                    canvasInstance.cancel();
                                    canvasInstance.interact({
                                        shapeType: 'rectangle',
                                        enabled: true,
                                    });

                                    onInteractionStart(activeTracker, activeLabelID);
                                    const { onSwitchToolsBlockerState } = this.props;
                                    onSwitchToolsBlockerState({ buttonVisible: false });
                                }
                            }}
                        >
                            追踪
                        </Button>
                    </Col>
                </Row>
            </>
        );
    }

    private renderInteractorBlock(): JSX.Element {
        const { interactors, canvasInstance, onInteractionStart } = this.props;
        const {
            activeInteractor, activeLabelID, fetching,
        } = this.state;
        if (!interactors.length) {
            return (
                <Row justify='center' align='middle' style={{ marginTop: '5px' }}>
                    <Col>
                        <Text type='warning' className='cvat-text-color'>
                            没有可用的交互器
                        </Text>
                    </Col>
                </Row>
            );
        }

        const minNegVertices = activeInteractor ? (activeInteractor.params.canvas.minNegVertices as number) : -1;

        return (
            <>
                <Row justify='start'>
                    <Col>
                        <Text className='cvat-text-color'>Interactor</Text>
                    </Col>
                </Row>
                <Row align='middle' justify='space-between'>
                    <Col span={22}>
                        <Select
                            style={{ width: '100%' }}
                            defaultValue={interactors[0].name}
                            onChange={this.setActiveInteractor}
                        >
                            {interactors.map(
                                (interactor: MLModel): JSX.Element => (
                                    <Select.Option
                                        value={interactor.id}
                                        title={interactor.description}
                                        key={interactor.id}
                                    >
                                        {interactor.name}
                                    </Select.Option>
                                ),
                            )}
                        </Select>
                    </Col>
                    <Col span={2} className='cvat-interactors-tips-icon-container'>
                        <Dropdown
                            destroyPopupOnHide
                            overlay={(
                                <ToolsTooltips
                                    name={activeInteractor?.name}
                                    withNegativePoints={minNegVertices >= 0}
                                    {...(activeInteractor?.tip || {})}
                                />
                            )}
                        >
                            <QuestionCircleOutlined />
                        </Dropdown>
                    </Col>
                </Row>
                <Row align='middle' justify='end'>
                    <Col>
                        <Button
                            type='primary'
                            loading={fetching}
                            className='cvat-tools-interact-button'
                            disabled={!activeInteractor ||
                                fetching ||
                                activeInteractor.version < MIN_SUPPORTED_INTERACTOR_VERSION}
                            onClick={() => {
                                this.setState({ mode: 'interaction' });

                                if (activeInteractor) {
                                    canvasInstance.cancel();
                                    activeInteractor.onChangeToolsBlockerState = this.onChangeToolsBlockerState;
                                    canvasInstance.interact({
                                        shapeType: 'points',
                                        enabled: true,
                                        ...activeInteractor.params.canvas,
                                    });
                                    onInteractionStart(activeInteractor, activeLabelID);
                                }
                            }}
                        >
                            交互
                        </Button>
                    </Col>
                </Row>
            </>
        );
    }

    private renderDetectorBlock(): JSX.Element {
        const {
            jobInstance, detectors, curZOrder, frame, labels, createAnnotations,
        } = this.props;
        if (!detectors.length) {
            return (
                <Row justify='center' align='middle' style={{ marginTop: '5px' }}>
                    <Col>
                        <Text type='warning' className='cvat-text-color'>
                            没有可用的交互器
                        </Text>
                    </Col>
                </Row>
            );
        }

        return (
            <DetectorRunner
                withCleanup={false}
                models={detectors}
                labels={labels}
                dimension={jobInstance.dimension}
                runInference={async (model: MLModel, body: DetectorRequestBody) => {
                    function loadAttributes(
                        attributes: { name: string; value: string }[],
                        label: Label,
                    ): Record<number, string> {
                        return attributes.reduce((acc, { name, value }) => {
                            const attributeSpec = label.attributes.find((_attr) => _attr.name === name);

                            if (!attributeSpec) {
                                return acc;
                            }

                            switch (attributeSpec.inputType) {
                                case 'number': {
                                    const [min, max, step] = attributeSpec.values;
                                    if (
                                        Number.isFinite(+value) &&
                                        +value >= +min &&
                                        +value <= +max &&
                                        !(+value % +step)
                                    ) {
                                        return {
                                            ...acc,
                                            [attributeSpec.id as number]: `${value}`,
                                        };
                                    }

                                    return acc;
                                }
                                case 'text': {
                                    return {
                                        ...acc,
                                        [attributeSpec.id as number]: `${value}`,
                                    };
                                }
                                case 'select':
                                case 'radio': {
                                    if (attributeSpec.values.includes(value)) {
                                        return {
                                            ...acc,
                                            [attributeSpec.id as number]: value,
                                        };
                                    }
                                    return acc;
                                }
                                case 'checkbox':
                                    return {
                                        ...acc,
                                        [attributeSpec.id as number]: `${value}`.toLowerCase() === 'true' ? 'true' : 'false',
                                    };
                                default:
                                    return acc;
                            }
                        }, {} as Record<number, string>);
                    }

                    try {
                        this.setState({ mode: 'detection', fetching: true });
                        const result = await core.lambda.call(jobInstance.taskId, model, {
                            ...body, frame, job: jobInstance.id,
                        });

                        type SerializedShape = {
                            type: ShapeType;
                            rotation?: number;
                            attributes: { name: string; value: string }[];
                            label: string;
                            outside?: boolean;
                            points?: number[];
                            mask?: number[];
                            elements: SerializedShape[];
                        };

                        const states = result.map(
                            (data: SerializedShape): ObjectState | null => {
                                const jobLabel = jobInstance.labels
                                    .find((jLabel: Label): boolean => jLabel.name === data.label);

                                if (!jobLabel) return null;

                                const objectData = {
                                    label: jobLabel,
                                    objectType: ObjectType.SHAPE,
                                    frame,
                                    occluded: false,
                                    rotation: [
                                        ShapeType.RECTANGLE, ShapeType.ELLIPSE,
                                    ].includes(data.type) ? (data.rotation || 0) : 0,
                                    source: core.enums.Source.AUTO,
                                    attributes: loadAttributes(data.attributes, jobLabel),
                                    zOrder: curZOrder,
                                };

                                if (data.type === ShapeType.SKELETON && jobLabel.type === ShapeType.SKELETON) {
                                    // find a center of the skeleton
                                    // to set this center as outside points position
                                    const center = data.elements.reduce<[number, number]>((acc, { points }) => {
                                        if (points) {
                                            return [acc[0] + points[0], acc[1] + points[1]];
                                        }
                                        return acc;
                                    }, [0, 0]).map((el) => el / (data.elements.length || 1));

                                    const elements = (jobLabel.structure?.sublabels || []).map((sublabel) => {
                                        const element = data.elements.find((el) => el.label === sublabel.name);
                                        return {
                                            label: sublabel,
                                            objectType: ObjectType.SHAPE,
                                            shapeType: sublabel.type,
                                            attributes: {},
                                            frame,
                                            source: core.enums.Source.AUTO,
                                            points: [...center],
                                            occluded: false,
                                            outside: true,
                                            ...(element ? {
                                                attributes: loadAttributes(element.attributes, sublabel),
                                                points: element.points,
                                                outside: !!element.outside || false,
                                            } : {}),
                                        };
                                    }).map((elementData) => new core.classes.ObjectState({ ...elementData }));

                                    if (elements.every((element) => element.outside)) {
                                        return null;
                                    }

                                    return new core.classes.ObjectState({
                                        ...objectData,
                                        shapeType: ShapeType.SKELETON,
                                        points: [],
                                        elements,
                                    });
                                }

                                if (data.type === 'mask' && data.points && body.convMaskToPoly) {
                                    return new core.classes.ObjectState({
                                        ...objectData,
                                        shapeType: 'polygon',
                                        points: data.points,
                                    });
                                }

                                if (data.type === 'mask') {
                                    const [left, top, right, bottom] = (data.mask as number[]).splice(-4);
                                    const rle = core.utils.mask2Rle(data.mask);
                                    rle.push(left, top, right, bottom);
                                    return new core.classes.ObjectState({
                                        ...objectData,
                                        shapeType: data.type,
                                        points: rle,
                                    });
                                }

                                return new core.classes.ObjectState({
                                    ...objectData,
                                    shapeType: data.type,
                                    points: data.points,
                                });
                            },
                        ).filter((state: any) => state);

                        createAnnotations(states.filter((state: ObjectState | null) => !!state));
                        const { onSwitchToolsBlockerState } = this.props;
                        onSwitchToolsBlockerState({ buttonVisible: false });
                    } catch (error: any) {
                        notification.error({
                            description: <ReactMarkdown>{error.message}</ReactMarkdown>,
                            message: 'Detection error occurred',
                            duration: null,
                        });
                    } finally {
                        this.setState({ fetching: false });
                    }
                }}
            />
        );
    }

    // private renderPopoverContent(): JSX.Element {
    //     return (
    //         <div className='cvat-tools-control-popover-content'>
    //             <Row justify='start'>
    //                 <Col>
    //                     <Text className='cvat-text-color' strong>
    //                         AI Tools
    //                     </Text>
    //                 </Col>
    //             </Row>
    //             <Tabs type='card' tabBarGutter={8}>
    //                 <Tabs.TabPane key='interactors' tab='Interactors'>
    //                     {this.renderMasksConvertingBlock()}
    //                     {this.renderLabelBlock()}
    //                     {this.renderLanguageBlock()}
    //                     {this.renderInteractorBlock()}
    //                 </Tabs.TabPane>
    //                 <Tabs.TabPane key='detectors' tab='Detectors'>
    //                     {this.renderDetectorBlock()}
    //                 </Tabs.TabPane>
    //                 <Tabs.TabPane key='trackers' tab='Trackers'>
    //                     {this.renderLabelBlock()}
    //                     {this.renderTrackerBlock()}
    //                 </Tabs.TabPane>
    //             </Tabs>
    //         </div>
    //     );
    // }
    private renderPopoverContent(): JSX.Element {
        return (
            <div className='cvat-tools-control-popover-content'>
                <Row justify='start'>
                    <Col>
                        <Text className='cvat-text-color' strong>
                            AI Tools
                        </Text>
                    </Col>
                </Row>
                <Row justify='center'>
                    {this.renderAIToolsBlock()}
                </Row>
            </div>
        );
    }

    public render(): JSX.Element | null {
        const {
            interactors, detectors, trackers, isActivated, canvasInstance, labels, frameIsDeleted,
        } = this.props;
        const {
            fetching, approxPolyAccuracy, pointsReceived, mode, portals, convertMasksToPolygons,
        } = this.state;

        // if (![...interactors, ...detectors, ...trackers].length) return null;

        const dynamicPopoverProps = isActivated ?
            {
                overlayStyle: {
                    display: 'none',
                },
            } :
            {};

        const dynamicIconProps = isActivated ?
            {
                className: 'cvat-tools-control cvat-active-canvas-control',
                onClick: (): void => {
                    canvasInstance.interact({ enabled: false });
                },
            } :
            {
                className: 'cvat-tools-control',
            };

        const showAnyContent = labels.length && !frameIsDeleted;
        const showInteractionContent = isActivated && mode === 'interaction' && pointsReceived && convertMasksToPolygons;
        const showDetectionContent = fetching && mode === 'detection';

        const interactionContent: JSX.Element | null = showInteractionContent ? (
            <ApproximationAccuracy
                approxPolyAccuracy={approxPolyAccuracy}
                onChange={(value: number) => {
                    this.setState({ approxPolyAccuracy: value });
                }}
            />
        ) : null;

        const detectionContent: JSX.Element | null = showDetectionContent ? (
            <Modal
                title='Making a server request'
                zIndex={Number.MAX_SAFE_INTEGER}
                visible
                destroyOnClose
                closable={false}
                footer={[]}
            >
                <Text>
                    正在等待服务器响应..
                </Text>
                <LoadingOutlined style={{ marginLeft: '10px' }} />
            </Modal>
        ) : null;

        return showAnyContent ? (
            <>
                <CustomPopover {...dynamicPopoverProps} placement='right' content={this.renderPopoverContent()}>
                    <Icon {...dynamicIconProps} component={AIToolsIcon} />
                </CustomPopover>
                {interactionContent}
                {detectionContent}
                {portals}
            </>
        ) : (
            <Icon className='cvat-tools-control cvat-disabled-canvas-control' component={AIToolsIcon} />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ToolsControlComponent);
