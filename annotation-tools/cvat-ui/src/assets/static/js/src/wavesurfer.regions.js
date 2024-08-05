/*! wavesurfer.js 1.1.1 (Mon, 04 Apr 2016 09:49:47 GMT)
* https://github.com/katspaugh/wavesurfer.js
* @license CC-BY-3.0 */
'use strict';

const getAudioTypeElementRange = () => {
    var ret = {};
    for (const element of $('.audio-type')) {
        let key = $(element).attr('id');
        let value = [element.offsetTop, element.offsetTop + element.offsetHeight];
        ret[key] = value;
    }

    return ret;
};

const getRealClickElementId = (x, y, range) => {
    let ret;
    for (let id in range) {
        if (y > range[id][0] && y < range[id][1]) {
            ret = id;
            break;
        }
    }
    return ret;
};

/* Regions manager */
WaveSurfer.Regions = {
    init: function (wavesurfer) {
        this.wavesurfer = wavesurfer;
        this.wrapper = this.wavesurfer.drawer.wrapper;
        this.currentEle;
        this.audioTypeElementRange = getAudioTypeElementRange();
        this.realClickId;

        /* Id-based hash of regions. */
        this.list = {};

        this.addEvents();
    },

    /* Add a region. */
    add: function (params) {
        console.log('-------add-a-region', params);
        var region = Object.create(WaveSurfer.Region);
        if (Array.isArray(params)) {
            var that = this;
            params.forEach(function (item, index) {
                region.init(item, that.wavesurfer, that.realClickId);
            });
        } else {
            region.init(params, this.wavesurfer, this.realClickId);
        }

        this.list[region.id] = region;

        region.on('remove', (function () {
            delete this.list[region.id];
        }).bind(this));

        return region;
    },

    /* Remove all regions. */
    clear: function () {
        Object.keys(this.list).forEach(function (id) {
            this.list[id].remove();
        }, this);
    },

    addEvents: function () {
        var my = this;
        this.wrapper.addEventListener('click', function (e) {
            my.wavesurfer.fireEvent('click', e);
            this.currentEle = e.target;
        });
    },

    enableDragSelection: function (params) {
        var my = this;
        var drag;
        var start;
        var region;

        function eventDown(e) {
            drag = true;
            if (typeof e.targetTouches !== 'undefined' && e.targetTouches.length === 1) {
                e.clientX = e.targetTouches[0].clientX;
            }
            start = my.wavesurfer.drawer.handleEvent(e);
            region = null;

            my.realClickId = getRealClickElementId(e.offsetX, e.offsetY, my.audioTypeElementRange);
        }

        this.wrapper.addEventListener('mousedown', eventDown);
        this.wrapper.addEventListener('touchstart', eventDown);
        this.on('disable-drag-selection', function () {
            my.wrapper.removeEventListener('touchstart', eventDown);
            my.wrapper.removeEventListener('mousedown', eventDown);
        });
        function eventUp(e) {
            drag = false;

            if (region) {
                region.fireEvent('update-end', e);
                my.wavesurfer.fireEvent('region-update-end', region, e);
            }

            region = null;
        }
        document.body.addEventListener('mouseup', eventUp);
        this.wrapper.addEventListener('touchend', eventUp);
        this.on('disable-drag-selection', function () {
            my.wrapper.removeEventListener('touchend', eventUp);
            document.body.removeEventListener('mouseup', eventUp);
        });
        function eventMove(e) {
            if (!drag) { return; }

            if (!region) {
                region = my.add(params || {});
            }

            var duration = my.wavesurfer.getDuration();
            if (typeof e.targetTouches !== 'undefined' && e.targetTouches.length === 1) {
                e.clientX = e.targetTouches[0].clientX;
            }
            var end = my.wavesurfer.drawer.handleEvent(e);
            region.update({
                start: Math.min(end * duration, start * duration),
                end: Math.max(end * duration, start * duration)
            });
        }
        this.wrapper.addEventListener('mousemove', eventMove);
        this.wrapper.addEventListener('touchmove', eventMove);
        this.on('disable-drag-selection', function () {
            my.wrapper.removeEventListener('touchmove', eventMove);
            my.wrapper.removeEventListener('mousemove', eventMove);
        });
    },

    disableDragSelection: function () {
        this.fireEvent('disable-drag-selection');
    }
};

WaveSurfer.util.extend(WaveSurfer.Regions, WaveSurfer.Observer);

WaveSurfer.Region = {
    /* Helper function to assign CSS styles. */
    style: WaveSurfer.Drawer.style,

    init: function (params, wavesurfer, realClickId) {
        console.log('----------WaveSurfer.Region-init', params)
        this.params = params || false;
        this.wavesurfer = wavesurfer;
        this.wrapper = wavesurfer.drawer.wrapper;
        this.width = wavesurfer.drawer.wrapper.scrollWidth;
        this.realClickId = realClickId;

        this.id = params.id == null ? WaveSurfer.util.getId() : params.id;
        this.start = Number(params.start) || 0;
        this.end = params.end == null ?
            // small marker-like region
            this.start + (4 / this.width) * this.wavesurfer.getDuration() :
            Number(params.end);
        this.resize = params.resize === undefined ? true : Boolean(params.resize);
        this.drag = params.drag === undefined ? true : Boolean(params.drag);
        this.loop = Boolean(params.loop);
        this.color = params.color || '#7C7C7C';
        this.data = params.data || {};
        this.title = params.title;
        this.attributes = params.attributes || {};
        this.annotation = params.annotation || [];
        this.proximity = params.proximity || '';

        this.maxLength = params.maxLength;
        this.minLength = params.minLength;

        this.bindInOut();
        this.render();
        this.wavesurfer.on('zoom', this.updateRender.bind(this));
        this.wavesurfer.fireEvent('region-created', this);

    },

    /* Update region params. */
    update: function (params) {
        console.log('-------Update region', params)
        if (null != params.start) {
            this.start = Number(params.start);
        }
        if (null != params.end) {
            this.end = Number(params.end);
        }
        if (null != params.loop) {
            this.loop = Boolean(params.loop);
        }
        if (null != params.color) {
            this.color = params.color;
        }
        if (null != params.data) {
            this.data = params.data;
        }
        if (null != params.resize) {
            this.resize = Boolean(params.resize);
        }
        if (null != params.drag) {
            this.drag = Boolean(params.drag);
        }
        if (null != params.maxLength) {
            this.maxLength = Number(params.maxLength);
        }
        if (null != params.minLength) {
            this.minLength = Number(params.minLength);
        }
        if (null != params.attributes) {
            this.attributes = params.attributes;
        }
        if (null != params.annotation) {
            var index = this.annotation.indexOf(params.annotation);
            if (index < 0) {
                this.annotation.push(params.annotation);
            } else {
                this.annotation.splice(index, 1);
            }
        }
        if (null != params.proximity) {
            this.proximity = params.proximity;
        }
        this.updateRender();
        this.fireEvent('update');
        this.wavesurfer.fireEvent('region-updated', this);
    },

    /* Remove a single region. */
    remove: function () {
        if (this.element) {
            try {
                this.wrapper.removeChild(this.element);
            } catch (e) {
                console.log('this.element is null');
            }
            this.element = null;
            this.fireEvent('remove');
            this.wavesurfer.un('zoom', this.updateRender.bind(this));
            this.wavesurfer.fireEvent('region-removed', this);
        }
    },

    /* Play the audio region. */
    play: function () {
        this.wavesurfer.play(this.start, this.end);
        this.fireEvent('play');
        this.wavesurfer.fireEvent('region-play', this);
    },

    /* Play the region in loop. */
    playLoop: function () {
        this.play();
        this.once('out', this.playLoop.bind(this));
    },

    /* Render a region as a DOM element. */
    render: function () {
        // $('.wavesurfer-region-audio').remove();
        // $('.wavesurfer-region-audio-finish:not([label])').remove();
        var regionEl = document.createElement('div');
        regionEl.className = 'wavesurfer-region-audio';
        let labels = {};

        let regionColor = 'green';
        let labelTitle = $('.ant-select-selection-item').attr('title')
        let clickLabelTop = $(`#${this.realClickId}`).css('top');
        const clickLabelTitle = $(`#${this.realClickId}`).attr('title');
        $(regionEl).attr({
            label: clickLabelTitle,
        })
        if (clickLabelTop) {
            regionColor = labels[clickLabelTitle] || regionColor;
        } else if (!clickLabelTop && this.params.annotation) {
            clickLabelTop = $(`.audio-type[title="${this.params.annotation[0]}"]`).css('top');
            regionColor = labels[this.params.annotation[0]] || regionColor;
        } else if (labelTitle) {
            regionColor = labels[labelTitle] || regionColor;
        } else if (labels) {
            regionColor = Object.values(labels)[0] || regionColor;
        }
        this.style(regionEl, {
            position: 'absolute',
            zIndex: 2,
            height: '128px',
            top: clickLabelTop,
        });
        if (this.resize) {
            let handle = regionEl.appendChild(document.createElement('div'));
            let css = {
                width: this.end - this.start,
                height: '100%',
                border: '1px solid ' + regionColor,
            }
            if (this.params && Object.keys(this.params).length !== 0) {
                regionEl.className = 'wavesurfer-region-audio-finish';
                if (this.params?.annotation?.length) {
                    $(regionEl).attr({
                        label: this.params.annotation[0],
                        'data-id': this.params.id
                    });
                }
                regionEl.onclick = function (e) {
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
                css.height = '80%';

                const tagEle = document.createElement('div');
                $(tagEle).append(this.params.content, '&emsp;', this.params.annotation[0])
                tagEle.style.backgroundColor = regionColor;
                tagEle.style = 'height: 30%; display: block; color: white; text-align: center';
                regionEl.appendChild(tagEle);
            }
            this.style(handle, css);
        }
        this.element = this.wrapper.appendChild(regionEl);

        this.updateRender();
        this.bindEvents(regionEl);
    },

    formatTime: function (start, end) {
        return (start == end ? [start] : [start, end]).map(function (time) {
            return [
                Math.floor((time % 3600) / 60), // minutes
                ('00' + Math.floor(time % 60)).slice(-2) // seconds
            ].join(':');
        }).join('-');
    },

    /* Update element's position, width, color. */
    updateRender: function (pxPerSec) {
        var dur = this.wavesurfer.getDuration();
        var width;
        if (pxPerSec) {
            width = Math.round(this.wavesurfer.getDuration() * pxPerSec);
        } else {
            width = this.width;
        }

        if (this.start < 0) {
            this.start = 0;
            this.end = this.end - this.start;
        }
        if (this.end > dur) {
            this.end = dur;
            this.start = dur - (this.end - this.start);
        }

        if (this.minLength != null) {
            this.end = Math.max(this.start + this.minLength, this.end);
        }

        if (this.maxLength != null) {
            this.end = Math.min(this.start + this.maxLength, this.end);
        }

        if (this.element != null) {
            var regionWidth = ~~((this.end - this.start) / dur * width);
            this.style(this.element, {
                left: ~~(this.start / dur * width) + 'px',
                width: regionWidth + 'px',
                cursor: this.drag ? 'move' : 'default',
                zIndex: width - regionWidth,
            });

            for (var attrname in this.attributes) {
                this.element.setAttribute('data-region-' + attrname, this.attributes[attrname]);
            }

            // this.element.title = this.formatTime(this.start, this.end);
            this.element.title = this.title || this.formatTime(this.start, this.end);
        }
    },

    /* Bind audio events. */
    bindInOut: function () {
        var my = this;

        my.firedIn = false;
        my.firedOut = false;

        var onProcess = function (time) {
            if (!my.firedOut && my.firedIn && (my.start >= Math.round(time * 100) / 100 || my.end <= Math.round(time * 100) / 100)) {
                my.firedOut = true;
                my.firedIn = false;
                my.fireEvent('out');
                my.wavesurfer.fireEvent('region-out', my);
            }
            if (!my.firedIn && my.start <= time && my.end > time) {
                my.firedIn = true;
                my.firedOut = false;
                my.fireEvent('in');
                my.wavesurfer.fireEvent('region-in', my);
            }
        };

        this.wavesurfer.backend.on('audioprocess', onProcess);

        this.on('remove', function () {
            my.wavesurfer.backend.un('audioprocess', onProcess);
        });

        /* Loop playback. */
        this.on('out', function () {
            if (my.loop) {
                my.wavesurfer.play(my.start);
            }
        });
    },

    /* Bind DOM events. */
    bindEvents: function () {
        var my = this;

        this.element.addEventListener('mouseenter', function (e) {
            my.fireEvent('mouseenter', e);
            my.wavesurfer.fireEvent('region-mouseenter', my, e);
        });

        this.element.addEventListener('mouseleave', function (e) {
            my.fireEvent('mouseleave', e);
            my.wavesurfer.fireEvent('region-mouseleave', my, e);
        });

        this.element.addEventListener('click', function (e) {
            if ($(this).hasClass('current_region')) {
                // stop this click from propgagating and deselecting the current region
                e.stopPropagation();
            }

            e.preventDefault();
            my.fireEvent('click', e);
            my.wavesurfer.fireEvent('region-click', my, e);
        });

        this.element.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            e.preventDefault();
            my.fireEvent('dblclick', e);
            my.wavesurfer.fireEvent('region-dblclick', my, e);
        });

        /* Drag or resize on mousemove. */
        (this.drag || this.resize) && (function () {
            var duration = my.wavesurfer.getDuration();
            var drag;
            var resize;
            var moved;
            var startTime;

            var onDown = function (e) {
                if (my.drag) {
                    e.stopPropagation();
                }
                startTime = my.wavesurfer.drawer.handleEvent(e) * duration;

                if (e.target.tagName.toLowerCase() == 'handle') {
                    if (e.target.classList.contains('wavesurfer-handle-start')) {
                        resize = 'start';
                    } else {
                        resize = 'end';
                    }
                } else {
                    drag = true;
                }
            };
            var onUp = function (e) {
                if (drag || resize) {
                    var regionUpdateType = resize ? resize : 'drag';
                    drag = false;
                    resize = false;
                    e.stopPropagation();
                    e.preventDefault();

                    if (moved && (my.drag || my.resize)) {
                        my.fireEvent('update-end', e);
                        my.wavesurfer.fireEvent('region-update-end', my, e, regionUpdateType);
                        moved = false;
                    }
                }
            };
            var onMove = function (e) {
                if (drag || resize) {
                    moved = true;
                    var time = my.wavesurfer.drawer.handleEvent(e) * duration;
                    var delta = time - startTime;
                    startTime = time;

                    // Drag
                    if (my.drag && drag) {
                        my.onDrag(delta);
                    }

                    // Resize
                    if (my.resize && resize) {
                        my.onResize(delta, resize);
                    }
                }
            };

            my.element.addEventListener('mousedown', onDown);
            my.wrapper.addEventListener('mousemove', onMove);
            document.body.addEventListener('mouseup', onUp);

            my.on('remove', function () {
                document.body.removeEventListener('mouseup', onUp);
                my.wrapper.removeEventListener('mousemove', onMove);
            });

            my.wavesurfer.on('destroy', function () {
                document.body.removeEventListener('mouseup', onUp);
            });
        }());
    },

    onDrag: function (delta) {
        this.update({
            start: this.start + delta,
            end: this.end + delta
        });
    },

    onResize: function (delta, direction) {
        if (direction == 'start') {
            this.update({
                start: Math.min(this.start + delta, this.end),
                end: Math.max(this.start + delta, this.end)
            });
        } else {
            this.update({
                start: Math.min(this.end + delta, this.start),
                end: Math.max(this.end + delta, this.start)
            });
        }
    }
};

WaveSurfer.util.extend(WaveSurfer.Region, WaveSurfer.Observer);


/* Augment WaveSurfer with region methods. */
WaveSurfer.initRegions = function () {
    if (!this.regions) {
        this.regions = Object.create(WaveSurfer.Regions);
        this.regions.init(this);
    }
};

WaveSurfer.addRegion = function (options) {
    this.initRegions();
    return this.regions.add(options);
};

WaveSurfer.clearRegions = function () {
    this.regions && this.regions.clear();
};

WaveSurfer.enableDragSelection = function (options) {
    this.initRegions();
    this.regions.enableDragSelection(options);
};

WaveSurfer.disableDragSelection = function () {
    this.regions.disableDragSelection();
};
