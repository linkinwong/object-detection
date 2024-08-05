'use strict';


/*
 * Purpose:
 *   Combines all the components of the interface. Creates each component, gets task
 *   data, updates components. When the user submits their work this class gets the workers
 *   annotations and other data and submits to the backend
 * Dependencies:
 *   AnnotationStages (src/annotation_stages.js), PlayBar & WorkflowBtns (src/components.js),
 *   HiddenImg (src/hidden_image.js), colormap (colormap/colormap.min.js) , Wavesurfer (lib/wavesurfer.min.js)
 * Globals variable from other files:
 *   colormap.min.js:
 *       magma // color scheme array that maps 0 - 255 to rgb values
 *
 */
function Annotator(jobId, taskId, userId, request_id) {
    this.playBar;
    this.stages;
    this.workflowBtns;
    this.jobList = [];
    this.jobId = jobId;
    this.taskId = taskId;
    this.userId = userId;
    this.request_id = request_id;
    this.currentJob;
    this.currentIndex = 0;
    this.jobStartTime;
    this.hiddenImage;
    // only automatically open instructions modal when first loaded
    this.instructionsViewed = false;
    // Boolean, true if currently sending http post request
    this.sendingResponse = false;

    // Create color map for spectrogram
    var spectrogramColorMap = colormap({
        colormap: magma,
        nshades: 256,
        format: 'rgb',
        alpha: 1,
    });

    // Create wavesurfer (audio visualization component)
    const height = 128;
    const minPxPerSec = 256;
    const wavesurferHeight = height;

    this.boxStyle = {
        height,
        minPxPerSec,
        wavesurferHeight,
        spectrogramColorMap,
    }

    // this.wavesurfer = Object.create(WaveSurfer);

    this.wavesurfer.init({
        container: '.audio_visual',
        waveColor: '#FF00FF',
        progressColor: '#FF00FF',
        fftSamples: height * 2,
        height: wavesurferHeight,
        fillParent: false,
        minPxPerSec,
        colorMap: spectrogramColorMap,
    });

    // Create labels (labels that appear above each region)
    var labels = Object.create(WaveSurfer.Labels);
    labels.init({
        wavesurfer: this.wavesurfer,
        container: '.labels'
    });

    // Create hiddenImage, an image that is slowly revealed to a user as they annotate
    // (only for this.currentJob.feedback === 'hiddenImage')
    this.hiddenImage = new HiddenImg('.hidden_img', 100);
    this.hiddenImage.create();

    // Create the play button and time that appear below the wavesurfer
    this.playBar = new PlayBar(this.wavesurfer);
    this.playBar.create();

    // Create the annotation stages that appear below the wavesurfer. The stages contain tags
    // the users use to label a region in the audio clip
    this.stages = new AnnotationStages(this.wavesurfer, this.hiddenImage);
    this.stages.create();

    // Create Workflow btns (submit and exit)
    this.workflowBtns = new WorkflowBtns();
    this.workflowBtns.create();
    this.workflowBtns.createLabels();

    this.addEvents();
    // eslint-disable-next-line no-undef
}

Annotator.prototype = {
    annotations: [],
    wavesurfer: Object.create(WaveSurfer),

    addWaveSurferEvents: function () {
        var my = this;

        // function that moves the vertical progress bar to the current time in the audio clip
        var updateProgressBar = function () {
            var progress = my.wavesurfer.getCurrentTime() / my.wavesurfer.getDuration();
            my.wavesurfer.seekTo(progress);
        };

        // Update vertical progress bar to the currentTime when the sound clip is
        // finished or paused since it is only updated on audioprocess
        this.wavesurfer.on('pause', updateProgressBar);
        this.wavesurfer.on('finish', updateProgressBar);

        // When a new sound file is loaded into the wavesurfer update the  play bar, update the
        // annotation stages back to stage 1, update when the user started the task, update the workflow buttons.
        // Also if the user is suppose to get hidden image feedback, append that component to the page
        this.wavesurfer.on('ready', async function () {
            my.playBar.update();
            my.stages.updateStage(1);
            my.updateJobTime();
            my.workflowBtns.update();
            if (my.currentJob.feedback === 'hiddenImage') {
                my.hiddenImage.append(my.currentJob.imgUrl);
            }

            $('.wavesurfer-region-audio-finish').hover((e) => {
                $(e.target.parentElement).addClass('wavesurfer-region-audio-deleting');
            }, (e) => {
                $(e.target.parentElement).removeClass('wavesurfer-region-audio-deleting');
            });

            await this.annotationsApi();


            $(document).on('keydown', (e) => {
                if (e.keyCode === 46) {
                    const region_id = $('.wavesurfer-region-audio-deleting').attr('data-id');
                    delete my.wavesurfer.regions.list[region_id];
                    $('.wavesurfer-region-audio-deleting').remove();
                }
            });
        });



        this.wavesurfer.on('click', function (e) {
            my.stages.clickDeselectCurrentRegion();
        });
    },

    updateJobTime: function () {
        this.jobStartTime = new Date().getTime();
    },

    // Event Handler, if the user clicks submit annotations call submitAnnotations
    addWorkflowBtnEvents: function () {
        $(this.workflowBtns).on('submit-annotations', this.submitAnnotations.bind(this));
        $(this.workflowBtns).on('save-labels', this.saveLabels.bind(this));
    },

    addEvents: function () {
        this.addWaveSurferEvents();
        this.addWorkflowBtnEvents();
    },


    updateAnnLabels() {
        console.log('------updateAnnLabels', this.annotations);
        // 加载已标注结果
        const list = this.annotations;
        if (list?.length > 0) {
            var region = this.wavesurfer.addRegion(list);
            this.stages.updateStage(3, region);
        }
    },

    // Update the task specific data of the interfaces components
    update: function () {

        const {
            proximityTags,
            annotationTags,
            alwaysShowTags,
            annotations
        } = this.currentJob || {}

        this.stages.reset(
            proximityTags || [],
            annotationTags || [],
            annotations,
            alwaysShowTags || [],
        );

        $('#wav_url').attr('href', this.currentJob.url);
        $('#wav_url').attr('target', '_blank');
        $('#wav_url').html(this.currentJob.filename);


        // Update the visualization type and the feedback type and load in the new audio clip
        this.wavesurfer.params.visualization = this.currentJob.visualization; // invisible, spectrogram, waveform
        this.wavesurfer.load(this.currentJob.url);
    },

    listenerAnnotations: function () {
        window.addEventListener('message', (event) => {
            if (event.data.target === 'audio-container') {
                // console.log('audio-container---------msg', event.data);
                const {request_id, userId, annotations: data, labels} = event.data;
                this.annotationLabels = labels;
                this.annotations.push(...data || []);
                this.currentJob.annotations = this.annotations;
                this.update();
            }
        });
    },

    sendReadyMsg: function () {
        window.parent.postMessage({
            target: 'audio-iframe',
        }, '*');
    },

    // Update the interface with the next task's data
    loadNextJob: function () {
        var my = this;
        var path = `/api/jobs/${this.jobId}/data`;
        $.getJSON(path)
            .done(function (data) {
                console.log('----data', data);
                if (data.ret) {
                    my.annotationsApi();

                    my.currentJob = data;
                    my.jobList.push(my.currentJob);
                    my.currentIndex = my.jobList.length - 1;
                    my.wavesurfer.regions.realClickId = null;
                    my.update();
                    // todo toggle with manual
                    // my.loadAnnotation();
                }
            });
    },

    loadAnnotation: function (json) {
        var that = this;
        fetch(that.currentJob.url, {
            method: 'GET',
            headers: {
                'Accept': 'application/octet-stream'
            }
        })
            .then(response => response.blob())
            .then(blob => {
                // 第二个POST请求
                return fetch('/audio2text/test', {
                    method: 'POST',
                    headers: {
                        'X-Request-Id': that.request_id,
                        'X-User-Id': that.userId,
                        'Content-Type': 'application/octet-stream'
                    },
                    body: blob // 将blob作为请求体发送
                });
            })
            .then(response => response.json())
            .then(data => {
            })
            .catch(error => {
                console.error('Error:', error);
            });

    },

    // Collect data about users annotations and submit it to the backend
    submitAnnotations: function () {
        // Check if all the regions have been labeled before submitting
        if (this.stages.annotationDataValidationCheck()) {
            if (this.sendingResponse) {
                // If it is already sending a post with the data, do nothing
                return;
            }
            this.sendingResponse = true;
            // Get data about the annotations the user has created
            const as = this.stages.getAnnotations()

            var content = {
                // job: this.currentJob,
                // start
                // end
                // content
                // label
                start: this.jobStartTime,
                end: new Date().getTime(),
                content: '',
                label: '',
                annotations: as,
                // deleted_annotations: this.stages.getDeletedAnnotations(),
                // // List of the different types of actions they took to create the annotations
                // annotation_events: this.stages.getEvents(),
                // // List of actions the user took to play and pause the audio
                // play_events: this.playBar.getEvents(),
                // // Boolean, if at the end, the user was shown what city the clip was recorded in
                // final_solution_shown: this.stages.aboveThreshold()
            };

            this.annotationsApi('POST', content);
        }
    },

    saveLabels: function () {
        var regionEles = document.getElementsByClassName('wavesurfer-region-audio');
        if (!regionEles.length) {
            return;
        }
        const selectedLabelName = $('.wavesurfer-region-audio').attr('label') || $('.ant-select-selection-item').attr('title');
        let backgroundColor = 'rgb(204, 204, 204)';
        if (selectedLabelName) {
            for (const label of labels) {
                if (label.name !== selectedLabelName) {
                    continue;
                }
                backgroundColor = label.color;
                break;
            }
        }

        const tagEle = $('<div>', {
            html: selectedLabelName,
            css: {
                'background-color': backgroundColor,
                height: '20%',
                'text-align': 'center',
                'line-height': '30px',
            },
        });
        regionEles[0].firstChild.style.height = '80%';
        regionEles[0].firstChild.style.border = `1px solid ${backgroundColor}`;
        regionEles[0].appendChild(tagEle[0]);
        regionEles[0].onclick = function (e) {
            if ($('.wavesurfer-region-audio-edit').length) {
                $('.wavesurfer-region-audio-edit').remove();
                return;
            }

            const len = $('.annotation').children().length;
            const top = $('.annotation').children()[len - 1].offsetTop;
            const popoverEle = $('<div>', {
                class: 'wavesurfer-region-audio-edit',
                id: 'draggable',
            });
            popoverEle.css('top', -top);
            const labelEle = $('<label>');
            labelEle.html('标注数据');
            const closeEle = $('<span>', {
                css: {
                    float: 'right',
                },
                html: '&times;',
                'aria-hidden': true,
            });
            closeEle.on('click', function (be) {
                $(be.target.parentNode).remove();
            });
            const textEle = $('<textarea>', {});
            textEle.val($(e.target.parentNode).attr('title'));
            textEle.addClass('form-control-textarea');
            textEle.on('blur', function (be) {
                $(e.target.parentNode).attr('title', $(this).val());
            });
            popoverEle.append(labelEle);
            popoverEle.append(closeEle);
            popoverEle.append(textEle);
            $('.annotation')[0].appendChild(popoverEle[0]);
            $('#draggable').draggable();
            textEle.focus();
        };
        if (!$('.wavesurfer-region-audio').attr('label')) {
            const regionEletop = $(`.audio-type[title="${selectedLabelName}"]`).css('top');
            regionEles[0].style.top = regionEletop;
            $(regionEles[0]).attr('label', selectedLabelName);
        }
        regionEles[0].className = 'wavesurfer-region-audio-finish';
    },

    // Make POST request, passing back the content data. On success load in the next task
    annotationsApi: function (type = 'GET', content) {
        const isSimpleReq = type === 'GET';
        var my = this;
        $.ajax({
            type: type,
            url: `/api/jobs/${my.jobId}/audio_annotations`,
            contentType: 'application/json',
            xhrFields: {
                withCredentials: true
            },
            headers: {
                'Authorization': `Token ${localStorage.token.substr(1, localStorage.token.length - 2)}`,
            },
            data: isSimpleReq ? null : JSON.stringify(content),
            success: function (data) {
                if (type === 'GET') {
                    my.annotations = data;
                    my.currentJob.annotations = data;
                    my.update();
                    my.updateAnnLabels();
                } else {
                    Message.notifyPositive();
                }
            },
            error: function (data) {
                console.log('error', data);
                Message.notifyNegative();
            },
            complete: function () {
                // No longer sending response
                my.sendingResponse = false;
            },
        });
    },

};

function main() {
    let ret;
    const [_, __, taskId, jobId] = location.hash.replace('#', '').split('/');
    const userId = window.location.search.split('?userId=')[1];
    const url = `${window.location.origin}/api/labels?task_id=${taskId}`;
    const request_id = [userId, taskId, jobId].join('_');

    var annotator = new Annotator(jobId, taskId, userId, request_id);

    annotator.loadNextJob();

    // annotator.sendReadyMsg();
    // annotator.listenerAnnotations();
}

main();

