'use strict';

/**
 * Purpose:
 *   Add labels of the annotation above the corresponding regions
 * Dependencies:
 *   WaveSurfer (lib/wavesurfer.min.js), WaveSurfer.Regions (src/wavesurfer.regions.js)
 */

WaveSurfer.AudioTypes = {
    style: WaveSurfer.Drawer.style,

    init: function (params) {
        this.params = params;
        var wavesurfer = this.wavesurfer = params.wavesurfer;

        if (!this.wavesurfer) {
            throw Error('No WaveSurfer intance provided');
        }

        var drawer = this.drawer = this.wavesurfer.drawer;

        this.container = 'string' == typeof params.container ?
            document.querySelector(params.container) : params.container;

        if (!this.container) {
            throw Error('No container for WaveSurfer timeline');
        }
        $(this.container).attr('title', params.title);

        this.width = drawer.width;
        this.pixelRatio = this.drawer.params.pixelRatio;
        this.labelsElement = null;
        this.labels = {};
        this.rowHeight = this.params.rowHeight || 20;
        this.maxRows = this.params.maxRows || 6;
        this.height = this.params.height || (this.rowHeight * this.maxRows);

        // Create & append wrapper element to container
        this.createWrapper();
        // Create & append label container element to wrapper element
        this.render();

        // When the user scrolls in the wavesurfer, make the labels scroll with it
        drawer.wrapper.addEventListener('scroll', function (e) {
            this.updateScroll(e);
        }.bind(this));

        // // Replace the label container with a empty one when the wavesurfer is redrawn
        // wavesurfer.on('redraw', this.render.bind(this));
        // // Destory the wrapper when the wavesurfer is destroyed
        // wavesurfer.on('destroy', this.destroy.bind(this));
        // // Add a label when a region is created
        // wavesurfer.on('region-created', this.add.bind(this));
        // // Update a label when its region is updated
        // wavesurfer.on('region-updated', this.rearrange.bind(this));
        // // Rearrange labels when a region is deleted
        // wavesurfer.on('region-removed', this.rearrange.bind(this));
    },

    // Remove the wrapper element
    destroy: function () {
        this.unAll();
        if (this.wrapper && this.wrapper.parentNode) {
            this.wrapper.parentNode.removeChild(this.wrapper);
            this.wrapper = null;
        }
    },

    // Create & append the wrapper element
    createWrapper: function () {
        var prevWrapper = this.container.querySelector('audio_type_container');
        if (prevWrapper) {
            this.container.removeChild(prevWrapper);
        }

        this.wrapper = this.container.appendChild(
            document.createElement('audio_type_container')
        );
        this.style(this.wrapper, {
            display: 'block',
            position: 'relative',
            height: this.height + 'px'
        });

        if (this.wavesurfer.params.fillParent || this.wavesurfer.params.scrollParent) {
            this.style(this.wrapper, {
                width: '100%',
                overflow: 'hidden',
            });
        }
    },

    // Remove the label container element
    clear: function () {
        if (this.labelsTitleElement) {
            this.labelsTitleElement.parentElement.removeChild(this.labelsTitleElement);
            this.labelsTitleElement = null;
        }
        if (this.labelsElement) {
            this.labelsElement.parentElement.removeChild(this.labelsElement);
            this.labelsElement = null;
        }
    },

    // Create and append the label container element
    render: function () {
        this.clear();

        let scrollEle = document.getElementsByClassName('annotation')[0]
        let tEle = document.createElement('h5');
        tEle.style.position = 'absolute';
        tEle.style.left = this.params.titleLeft;
        tEle.style.top = this.params.titleTop;
        tEle.style.color = 'white';
        tEle.textContent = this.params.title;
        this.labelsTitleElement = scrollEle.appendChild(tEle);

        this.labelsElement = this.wrapper.appendChild(document.createElement('div'));
        this.style(this.labelsElement, {
            height: this.height + 'px',
            width: '100%',
            left: 0,
            border: '1px solid gray',
            backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAACWCAYAAABO4tERAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAL6ADAAQAAAABAAAAlgAAAAD1g6ySAAADX0lEQVR4Ae2cy47iMBBFHYR4CLaINRv4/59DPCQy3HQq464kxI0h2RxLI6fFFLGvy8dF2UlxOBzK8/kcHo9H8GU+n4ftdhtms5n/KJRlGe73e5jStjidTs92lOF6vYbL5dLqRFEUYblchtVq1duJqWyrxpusQ51QB9SRvpF41Ylv2BbH47GUunFJ6cRisag6MaVtsd/vS1OlqyFyJf1Th3zRCExpW+x2u6pVrxqiyWwu8ddOfNO2abypqk6s1+sgt/AjkdKQMW1bjY87IUwKl76oE0Lk7XbzH1V/S4AxbGd9HLcGqvZFjdtsNr1rwFi2cF4jk4LXT68RcF6KejJpJL69RjS0gfMjrxGN8l04HIPVOfeF8xb3+AVNk/ibvwWI52O/TVmsPvVbgHh+qjWihUo1ZMyY3Fzunfu2Gh9/GZw3NepaCn/qtwDxvERNQSTxfJQvgvNw/o31Bc47lFdp8r68PZyv0Uw8H7tNymJFPP/cpWloMxWrc+7bNN6GXl9GPD9Cbp+8DXmbF5vYtuOo+RgX8vPk5zs2KJT7tPmkldsXOO8V0cQaI+cD580vyc+7HXdtUMD5rolpqrAP605cwXnvLlKE8zYuSpRIJozHrj7T4hfn9snPS5WUlAf5efLz8pW6aCL1LVZDrM6xJZ63EbCaeN5FlxIGzksBX+D8wBMUIlqc22cfNofVObZw3k9eqUnexqkiUYjnnSjE8ykLHZyP3SaH1Tm2cD4eBV3DeeL52ide5cn1X1IwR96GvE3tTqpyWJ1jC+ejQagu4Tycr30CztcbwnFMHs+XlIUutiVvk8PqHFs4H/utruE8nK99As7D+f8heIPKHN5OZds03nCnhnB+nvPz5g8/tbyC/PxvTcjbJCWuiOdjt4Hzb6wvrUXKFJWaY+yl2v2s/st9OT/P+Xmek7KZ86yVBPr2u8hynrFqaDMVq3Pu2zTeBNeXEc8Tz5s//NTyCuL535oQzxPPt16c+c0z8HDeT0ApQjzvVPGsdh/znFTnS/TtoRap50vKNiTnbThvE/lNDqtzbInno0GoLqXmGGsEeRvyNuRtotlH3uZ5AMLmhMTwBc53KTIGq3PuC+fNp/2LFnTMRWGwQmn5ti9DYfSQLe+rjBUdUtM/05pjy7nKHFbn2P4D3LrPCNRXmbUAAAAASUVORK5CYII=')",
        });
    },

    updateScroll: function () {
        this.wrapper.scrollLeft = this.drawer.wrapper.scrollLeft;
    },

    // Create & append a label element that is associated with the given region
    add: function (region) {
        var label = Object.create(WaveSurfer.Label);
        label.init(region, this.labelsElement);

        this.labels[region.id] = label;

        region.on('remove', (function () {
            this.labels[region.id].remove();
            delete this.labels[region.id];
        }).bind(this));

        return label;
    },

    // Rearrange the labels to reduce overlap
    rearrange: function () {
        // First place all label elements in bottom row
        for (var id in this.labels) {
            // 2 px above wavesurfer canvas
            this.labels[id].row = 0;
        }

        this.assignRows();

        for (var id in this.labels) {
            this.labels[id].updateRender(2 + (this.rowHeight * (this.labels[id].row % this.maxRows)));
        }
    },

    // Assign a label a row to reduce overlap. Wider labels are prioritized to lower rows.
    assignRows: function() {
        for (var id in this.labels) {
            this.labels[id].row = 0;
        }

        for (var row=0; row < (this.maxRows * 2); row++) {
            for (var id1 in this.labels) {
                var label = this.labels[id1];

                for (var id2 in this.labels) {
                    var otherLabel = this.labels[id2];
                    if ((otherLabel === label) || (otherLabel.row !== label.row)) {
                        continue;
                    }

                    if ((label.left() <=  otherLabel.right() && label.left() >=  otherLabel.left()) ||
                        (label.right() >=  otherLabel.left() && label.right()  <= otherLabel.right()) ||
                        (label.right() >=  otherLabel.right() && label.left()  <= otherLabel.left())) {
                        if (label.region.element.offsetWidth < otherLabel.region.element.offsetWidth) {
                            label.row += 1;
                        }
                    }
                }
            }
        }
    }
};

WaveSurfer.util.extend(WaveSurfer.AudioTypes, WaveSurfer.Observer);

/**
 * Purpose:
 *   Individual label elements
 * Dependencies:
 *   WaveSurfer (lib/wavesurfer.min.js), WaveSurfer.Region (src/wavesurfer.regions.js), Font Awesome
 */
WaveSurfer.AudioType = {
    style: WaveSurfer.Drawer.style,

    init: function (region, container, wavesurfer) {
        this.container = container;
        this.wavesurfer = region.wavesurfer;
        this.element = null;
        this.playBtn = null;
        this.text = null;
        region.annotationLabel = this;
        this.region = region;
        this.render();
        this.row = 0;
    },

    // Create and append individual label element
    render: function() {
        var labelEl = document.createElement('tag');

        this.element = this.container.appendChild(labelEl);
        this.style(this.element, {
            position: 'absolute',
            whiteSpace: 'nowrap',
            // backgroundColor: '#7C7C7C',
            // color: '#ffffff',
            backgroundColor: 'blue',
            padding: '0px 5px',
            borderRadius: '2px',
            fontSize: '12px',
            textTransform: 'uppercase',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
        });

        // Add play button inside the label
        this.playBtn = this.element.appendChild(document.createElement('i'));
        this.playBtn.className = 'fa fa-play-circle'; // Font Awesome Icon
        this.style(this.playBtn, {
            marginRight: '5px',
            cursor: 'pointer'
        });

        this.text = this.element.appendChild(document.createElement('span'));
        this.text.innerHTML = '?';

        // add delete region to the right
        this.deleteRegion = labelEl.appendChild(document.createElement('i'));
        this.deleteRegion.className = 'fa fa-times-circle'

        this.style(this.deleteRegion, {
            position: 'absolute',
            marginTop: '3px',
            right: '0px',
            marginRight: '5px',
            cursor: 'pointer'
        });

        // Place the label on the bottom row
        this.updateRender(2);
        this.bindEvents();
    },

    // Update the label element with it's corresponding region's annotation. Also update the label elements position.
    // The bottom parameter is how many pixels away from the label container's bottom the label element will be placed
    updateRender: function(bottom) {
        this.text.innerHTML = ((this.region.annotation.length && this.region.annotation) || '?');
        this.style(this.element, {
            left: this.region.element.offsetLeft + 'px',
            bottom: bottom + 'px',
            width: this.region.element.offsetWidth + 'px',
            backgroundColor: this.region.color,
            zIndex: this.wavesurfer.drawer.wrapper.scrollWidth - this.element.offsetWidth,
        });
    },

    left: function() {
        return this.element.offsetLeft;
    },

    right: function() {
        return this.element.offsetLeft + this.element.offsetWidth;
    },

    remove: function() {
        this.container.removeChild(this.element);
    },

    // Add event handlers for when the user clicks the labels play btn or double clicks the label
    bindEvents: function() {
        var my = this;
        // If the user click the play button in the label, play the sound for the associated region
        this.playBtn.addEventListener('click', function (e) {
            my.region.play();
        });
        // If the user dbl clicks the label, trigger the dblclick event for the assiciated region
        this.element.addEventListener('dblclick', function (e) {
            my.region.wavesurfer.fireEvent('label-dblclick', my.region, e);
        });

        this.deleteRegion.addEventListener('click', function (e) {
            e.stopPropagation();
            my.region.remove();
        });
    }
};

WaveSurfer.util.extend(WaveSurfer.AudioType, WaveSurfer.Observer);
