// Copyright (C) 2020-2022 Intel Corporation
//
// SPDX-License-Identifier: MIT


import { ThunkAction } from 'redux-thunk';
import { ActionCreator, Dispatch } from 'redux';
import { CombinedState } from '../reducers';
import { Socket, wsAction } from 'reducers/websocketReducer';

export function connectAction(): ThunkAction<any, any, any, any> {
    return async (dispatch: ActionCreator<Dispatch>, getState: () => CombinedState): Promise<void> => {

        let {
            ws: {
                instance,
            },
            auth: {
                user: { id },
            }
        } = getState();

        if (!instance) {
            // todo replace with your prd websocket server
            if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
                instance = new Socket('ws://60.10.135.150:23723/websocket/');
            } else {
                instance = new Socket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:${location.port}/websocket/`);
            }
        }

        await dispatch({
            type: wsAction.OPEN_WEBSOCKET,
            payload: {
                instance,
            },
        });

        instance.open(() => {
            instance.send({
                type: 'register',
                user_id: `${id}`,
            });
        });

    };
}

export function transEndAction(): ThunkAction<any, any, any, any> {
    return async (dispatch: ActionCreator<Dispatch>, getState: () => CombinedState): Promise<void> => {

        let {
            ws: {
                instance,
            },
            auth: {
                user: { id },
            }
        } = getState();

        if (instance) {
            instance.send({
                type: 'transfend',
                user_id: `${id}`,
            });
        }
    };
}


/**
 * {
 *     "request_id": "1_7_7",
 *     "data": [
 *         [
 *             0,
 *             11,
 *             "SPEAKER_00",
 *             "109876543210"
 *         ]
 *     ],
 *     "user_id": "1",
 *     "type": "nuclio_data",
 *     "server_type": "asr"
 * }
 * @param newMsg
 */
export function storeMsgAction(newMsg: any): ThunkAction<any, any, any, any> {
    return async (dispatch: ActionCreator<Dispatch>, getState: () => CombinedState): Promise<void> => {
        const {
            ws: {
                instance,
                msg,
            }
        } = getState();

        const { request_id, list, isCurrentJobPath, end_type, type } = newMsg;

        /**
         * msg[request_id] 对象引用不变，只push
         */
        if (!request_id) return;
        if (!msg[request_id]) msg[request_id] = {};

        const item = msg[request_id];
        if (end_type) item.end_type = end_type;
        if (type) item.type = type;

        item.isCurrentJobPath = isCurrentJobPath;

        if (!item.list) item.list = [];
        if (list) item.list.push(...list);

        dispatch({
            type: wsAction.STORE_MSG,
            payload: {
                msg,
            },
        });
    };
}
