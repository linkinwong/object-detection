// @ts-nocheck
import { useMemo, useState, useCallback, useRef, useEffect, memo } from 'react';

import { useWavesurfer } from './region/wavesurfer-react';

/*     "wavesurfer.js": "^7.8.2" */
import RegionsPlugin from './region/plugins/regions';
import Timeline from './region/plugins/timeline'
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom.esm'
/*     "wavesurfer.js": "^7.8.2" */

import { updateAnnotationMsg } from 'utils/annotation-msg';

import Axios from "axios";
import {message, Button} from "antd";
const formatTime = (seconds) => [seconds / 60, seconds % 60].map((v) => `0${Math.floor(v)}`.slice(-2)).join(':')

function App(props) {
    const { job, userId, ws } = props;
    const request_id = useMemo(() => [userId, job.taskId, job.id].join('_'), [props.userId]);

    const containerRef = useRef(null);
    const annoRef = useRef({});

    const random = (min, max) => Math.random() * (max - min) + min
    const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`

    const annoDataRef = useRef([]);

    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [waveData, setWaveData] = useState({});
    const [annotations, setAnnotations] = useState([]); // [ { id, start, end, label, content, job }
    const { wavesurfer, isPlaying, currentTime, isReady } = useWavesurfer({
        container: containerRef,
        mediaControls: !0,
        hideScrollbar: !0,
        autoScroll: !0,
        height: 100,
        waveColor: 'rgb(200, 0, 200)',
        progressColor: 'rgb(206,78,206)',
        url: waveData.url,
        plugins: useMemo(() => [Timeline.create({ beforebegin: !0 })], []),
    });

    const region = useMemo(() => {
        if (!wavesurfer) return null;
        return wavesurfer.registerPlugin(RegionsPlugin.create({
            contentEditable: true,
            drag: true,
            resize: true,
        }));
    }, [wavesurfer]);

    const switchPlayer = () => {
        if (isPlaying) {
            wavesurfer.pause();
        } else {
            wavesurfer.play();
        }
    };

    useEffect(() => {
        queryData();
    }, [])

    useEffect(() => {
        if (waveData.url) queryAnno();
    }, [waveData.url])

    useEffect(() => {
        if (!isReady || !annoDataRef.current.length) return;
        if (!region) return;
        region.clearRegions();
        annoDataRef.current.forEach((anno, index) => {
            region.addRegion({
                label: anno.label,
                start: anno.start,
                end: anno.end,
                contentEditable: !0,
                content: anno.content,
                color: randomColor(),
            })
        })

    }, [annoDataRef.current, region, isReady])


    useEffect(() => {

        if (!isReady) return;
        // Create some regions at specific time ranges
        wavesurfer.on('decode', () => {
            // document.querySelector('input[type="range"]').oninput = (e) => {
            //     const minPxPerSec = Number(e.target.value)
            //     wavesurfer.zoom(minPxPerSec)
            // }
        })

        region.enableDragSelection({
            color: 'rgba(255, 0, 0, 0.1)',
            contentEditable: !0,
        })

        /*region.on('region-created', (region) => {
            if (!region.content) {
                const div = document.createElement('div');
                div.innerText = '输入标注内容';
                div.setAttribute('contentEditable', 'true');
                div.style.padding = '2px';
                region.setContent(div)
            }
            console.log('region-created region', region)
            console.log('region-created region', region.content)
        })*/

        region.on('region-update', (region) => {
        })

        region.on('region-clicked', (region, e) => {
            e.stopPropagation() // prevent triggering a click on the waveform
            region.play()
            // region.setOptions({ color: randomColor() })
        })
        // Reset the active region when the user clicks anywhere in the waveform
        wavesurfer.on('interaction', () => {
        })

    }, [isReady, region]);

    const queryAnno = async () => {
        Axios.get(`/api/jobs/${job.id}/audio_annotations`)
        .then((response) => {
            if (!response.data) return null;
            const annotations = response.data;
            duplicateAnnoSelf(annotations);
        }).catch((error) => {
            console.log(error);
        });
    }

    const saveAnno = async () => {
        setSaveLoading(!0);
        let annotations = []
        const rs = region.getRegions();
        if (rs?.length) {
            annotations = rs.filter(i => i.content).map(i => ({
                start: i.start,
                end: i.end,
                label: i.label,
                content: i.content.innerText,
            }))
        }
        Axios.post(`/api/jobs/${job.id}/audio_annotations`, {
            annotations,
        })
        .then((response) => {
            message.success('保存成功');
        }).catch((error) => {
            console.log(error);
            message.error('保存失败');
        })
            .finally(() => {
                setSaveLoading(!1);
            })
    }

    const queryData = () => {
        Axios.get(`/api/jobs/${job.id}/data`)
        .then((response) => {
            if (!response.data) return null;
            setWaveData(response.data);
        }).catch((error) => {
            console.log(error);
        });
    }

    async function fetchDataAndPostBlob() {
        try {
            setLoading(!0);
            const postResponse = await Axios.get(`/api/jobs/${job.id}/AITools?type=asr&frameFilename=${waveData.filename}`);
            const { status } = postResponse.data;
            message.success(status || '请求成功');
        } catch (error) {
            console.error('Error:', error);
            message.error(error || '请求失败');
        }
        setLoading(!1);
    }

    const duplicateAnnoSelf = useCallback((list) => {
        const r = [...list || [], ...annoDataRef.current];
        const t = [];
        if (r.length) {
            for(const i of r) {
                if (t.length) {
                    const index = t.findIndex(j => j.start === i.start && j.end === i.end);
                    if (index === -1) {
                        t.push(i);
                    } else {
                        t[index] = i;
                    }
                } else {
                    t.push(i);
                }
            }
        }
        annoDataRef.current = t;
        // setAnnotations(t);
        return t;
    }, [annoDataRef.current]);


    const { msg, instance } = ws;

    useEffect(() => {
        if (msg[request_id]?.list) {
            updateAnnotationMsg(ws, request_id, 0, (list) => {
                if (list.length === 0) return;
                duplicateAnnoSelf(list)
            });

        } else {
            if (instance) {
                instance.on(async (msg) => {
                    updateAnnotationMsg(ws, request_id, 10, (list) => {
                        duplicateAnnoSelf(list)
                    });
                });
            }
        }
    }, [request_id, instance]);


    return (
        <div className='flex flex-col w-full gap-4 relative p-4 bg-white h-full'>
            <div className='w-full flex items-center justify-between'>
                <Button type="ghost" onClick={fetchDataAndPostBlob} disabled={loading} loading={loading}>AI自动标注</Button>
                <Button type="primary" onClick={saveAnno} disabled={saveLoading} loading={saveLoading}>保存标注</Button>
            </div>

            <div ref={containerRef}></div>

            <div className="hidden" ref={annoRef}>
                {
                    annotations.map((anno) => (
                        <div key={anno.id} style={{ height: '100%', width: '100%', position: 'absolute', top: 0, 'z-index': 4,  'margin-top': '0 !important', padding: '2px', display: 'flex', 'flex-direction': 'column', 'justify-content': 'space-between', color: '#fff' }}>

                            <div contentEditable="true">
                                {anno.content}
                            </div>

                            <div style={{ 'text-align': 'center', background: wavesurfer?.waveColor }}>
                                {anno.label}
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}


export default memo(App);
