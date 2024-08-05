/**
 * Regions are visual overlays on the waveform that can be used to mark segments of audio.
 * Regions can be clicked on, dragged and resized.
 * You can set the color and content of each region, as well as their HTML content.
 */

import BasePlugin, { type BasePluginEvents } from '../base-plugin'
import { makeDraggable } from '../draggable'
import EventEmitter from '../event-emitter'
import createElement from '../dom'

export type RegionsPluginOptions = undefined

export type RegionsPluginEvents = BasePluginEvents & {
  /** When a region is created */
  'region-created': [region: Region]
  /** When a region is being updated */
  'region-update': [region: Region, side?: 'start' | 'end']
  /** When a region is done updating */
  'region-updated': [region: Region]
  /** When a region is removed */
  'region-removed': [region: Region]
  /** When a region is clicked */
  'region-clicked': [region: Region, e: MouseEvent]
  /** When a region is double-clicked */
  'region-double-clicked': [region: Region, e: MouseEvent]
  /** When playback enters a region */
  'region-in': [region: Region]
  /** When playback leaves a region */
  'region-out': [region: Region]
}

export type RegionEvents = {
  /** Before the region is removed */
  remove: []
  /** When the region's parameters are being updated */
  update: [side?: 'start' | 'end']
  /** When dragging or resizing is finished */
  'update-end': []
  /** On play */
  play: []
  /** On mouse click */
  click: [event: MouseEvent]
  /** Double click */
  dblclick: [event: MouseEvent]
  /** Mouse over */
  over: [event: MouseEvent]
  /** Mouse leave */
  leave: [event: MouseEvent]
}

export type RegionParams = {
  /** The id of the region, any string */
  id?: string
  label?: string
  /** The start position of the region (in seconds) */
  start: number
  /** The end position of the region (in seconds) */
  end?: number
  /** Allow/dissallow dragging the region */
  drag?: boolean
  createByDrag?: boolean
  /** Allow/dissallow resizing the region */
  resize?: boolean
  /** The color of the region (CSS color) */
  color?: string
  /** Content string or HTML element */
  content?: string | HTMLElement
  /** Min length when resizing (in seconds) */
  minLength?: number
  /** Max length when resizing (in seconds) */
  maxLength?: number
  /** The index of the channel */
  channelIdx?: number
  /** Allow/Disallow contenteditable property for content */
  contentEditable?: boolean
}

class SingleRegion extends EventEmitter<RegionEvents> implements Region {
  public element: HTMLElement
  public id: string
  public label: string
  public start: number
  public end: number
  public drag: boolean
  public createByDrag: boolean
  public resize: boolean
  public color: string
  public content?: HTMLElement
  public minLength = 0
  public maxLength = Infinity
  public channelIdx: number
  public contentEditable = false
  public subscriptions: (() => void)[] = []

  constructor(params: RegionParams, private totalDuration: number, private numberOfChannels = 0) {
    super()

    this.subscriptions = []
    this.id = params.id || `region-${Math.random().toString(32).slice(2)}`
    this.label = params.label || ''
    this.start = this.clampPosition(params.start)
    this.end = this.clampPosition(params.end ?? params.start)
    this.drag = params.drag ?? true
    this.createByDrag = params.createByDrag ?? true
    this.resize = params.resize ?? true
    this.color = params.color ?? 'rgba(0, 0, 0, 0.1)'
    this.minLength = params.minLength ?? this.minLength
    this.maxLength = params.maxLength ?? this.maxLength
    this.channelIdx = params.channelIdx ?? -1
    this.contentEditable = params.contentEditable ?? this.contentEditable
    this.element = this.initElement()
    this.setContent(params.content)
    this.setPart()

    this.renderPosition()
    this.initMouseEvents()
  }

  private clampPosition(time: number): number {
    return Math.max(0, Math.min(this.totalDuration, time))
  }

  private setPart() {
    const isMarker = this.start === this.end
    this.element.setAttribute('part', `${isMarker ? 'marker' : 'region'} ${this.id}`)
  }

  private addResizeHandles(element: HTMLElement) {
    const handleStyle = {
      position: 'absolute',
      zIndex: '2',
      width: '6px',
      height: '100%',
      top: '0',
      cursor: 'ew-resize',
      wordBreak: 'keep-all',
    }

    const leftHandle = createElement(
      'div',
      {
        part: 'region-handle region-handle-left',
        style: {
          ...handleStyle,
          left: '0',
          borderLeft: '2px solid rgba(0, 0, 0, 0.5)',
          borderRadius: '2px 0 0 2px',
        },
      },
      element,
    )

    const rightHandle = createElement(
      'div',
      {
        part: 'region-handle region-handle-right',
        style: {
          ...handleStyle,
          right: '0',
          borderRight: '2px solid rgba(0, 0, 0, 0.5)',
          borderRadius: '0 2px 2px 0',
        },
      },
      element,
    )

    // Resize
    const resizeThreshold = 1
    this.subscriptions.push(
      makeDraggable(
        leftHandle,
        (dx) => this.onResize(dx, 'start'),
        () => null,
        () => this.onEndResizing(),
        resizeThreshold,
      ),
      makeDraggable(
        rightHandle,
        (dx) => this.onResize(dx, 'end'),
        () => null,
        () => this.onEndResizing(),
        resizeThreshold,
      ),
    )
  }

  private removeResizeHandles(element: HTMLElement) {
    const leftHandle = element.querySelector('[part*="region-handle-left"]')
    const rightHandle = element.querySelector('[part*="region-handle-right"]')
    if (leftHandle) {
      element.removeChild(leftHandle)
    }
    if (rightHandle) {
      element.removeChild(rightHandle)
    }
  }

  private initElement() {
    const isMarker = this.start === this.end

    let elementTop = 0
    let elementHeight = 100

    if (this.channelIdx >= 0 && this.channelIdx < this.numberOfChannels) {
      elementHeight = 100 / this.numberOfChannels
      elementTop = elementHeight * this.channelIdx
    }

    const element = createElement('div', {
      style: {
        padding: '5px',
        position: 'absolute',
        top: `${elementTop}%`,
        height: `${elementHeight}%`,
        backgroundColor: isMarker ? 'none' : this.color,
        borderLeft: isMarker ? '2px solid ' + this.color : 'none',
        borderRadius: '2px',
        boxSizing: 'border-box',
        transition: 'background-color 0.2s ease',
        cursor: this.drag ? 'grab' : 'default',
        pointerEvents: 'all',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '2px',
      },
    });

    // add a delete icon
    const deleteIcon = createElement('span', {
      style: {
        position: 'absolute',
        top: '-7px',
        right: '0',
        cursor: 'pointer',
        display: 'none',
        fontSize: '15px',
        zIndex: '3',
        color: '#fff',
      },
      textContent: '×',
    })
    element.appendChild(deleteIcon);

    element.addEventListener('mouseover',function(){
      deleteIcon.style.display = 'block';
    })
    element.addEventListener('mouseleave',function(){
      deleteIcon.style.display = 'none';
    })
    element.addEventListener('click',(ee) =>{
      if (ee.target === deleteIcon) {
        this.remove();
      }
    });

    // Add resize handles
    if (!isMarker && this.resize) {
      this.addResizeHandles(element)
    }

    return element
  }

  private renderPosition() {
    const start = (this.start / this.totalDuration) || 0
    const end = ((this.totalDuration - this.end) / this.totalDuration) || 0
    this.element.style.left = `${start * 100}%`
    this.element.style.right = `${end * 100}%`
  }

  private toggleCursor(toggle: boolean) {
    if (!this.drag || !this.element?.style) return
    this.element.style.cursor = toggle ? 'grabbing' : 'grab'
  }

  private initMouseEvents() {
    const { element } = this
    if (!element) return

    element.addEventListener('click', (e) => this.emit('click', e))
    element.addEventListener('mouseenter', (e) => this.emit('over', e))
    element.addEventListener('mouseleave', (e) => this.emit('leave', e))
    element.addEventListener('dblclick', (e) => this.emit('dblclick', e))
    element.addEventListener('pointerdown', () => this.toggleCursor(true))
    element.addEventListener('pointerup', () => this.toggleCursor(false))

    // Drag
    this.subscriptions.push(
      makeDraggable(
        element,
        (dx) => this.onMove(dx),
        () => this.toggleCursor(true),
        () => {
          this.toggleCursor(false)
          this.drag && this.emit('update-end')
        },
      ),
    )

    if (this.contentEditable && this.content) {
      this.content.addEventListener('click', (e) => this.onContentClick(e))
      this.content.addEventListener('blur', () => this.onContentBlur())
    }
  }

  public _onUpdate(dx: number, side?: 'start' | 'end') {
    if (!this.element.parentElement) return
    const { width } = this.element.parentElement.getBoundingClientRect()
    const deltaSeconds = (dx / width) * this.totalDuration
    const newStart = !side || side === 'start' ? this.start + deltaSeconds : this.start
    const newEnd = !side || side === 'end' ? this.end + deltaSeconds : this.end
    const length = newEnd - newStart

    if (
      newStart >= 0 &&
      newEnd <= this.totalDuration &&
      newStart <= newEnd &&
      length >= this.minLength &&
      length <= this.maxLength
    ) {
      this.start = newStart
      this.end = newEnd

      this.renderPosition()
      this.emit('update', side)
    }
  }

  private onMove(dx: number) {
    if (!this.drag) return
    this._onUpdate(dx)
  }

  private onResize(dx: number, side: 'start' | 'end') {
    if (!this.resize) return
    this._onUpdate(dx, side)
  }

  private onEndResizing() {
    if (!this.resize) return
    this.emit('update-end')
  }

  private onContentClick(event: MouseEvent) {
    event.stopPropagation()
    const contentContainer = event.target as HTMLDivElement
    contentContainer.focus()
    this.emit('click', event)
  }

  public onContentBlur() {
    this.emit('update-end')
  }

  public _setTotalDuration(totalDuration: number) {
    this.totalDuration = totalDuration
    this.renderPosition()
  }

  /** Play the region from the start */
  public play() {
    this.emit('play')
  }


  public createContentDom(content: string = '点击输入标注'): HTMLElement {
    return  createElement('div', {
      style: {
        // padding: `4px ${isMarker ? 0.2 : 0.4}em`,
        display: 'inline-block',
        width: 'calc(100%-3px)',
        marginRight: '3px',
        overflow: 'auto',
        fontSize: '12px',
        flex: '1',
        cursor: 'text',
        color: '#e5e7eb',
      },
      textContent: content,
    });
  }

  /** Set the HTML content of the region */
  public setContent(content: RegionParams['content'], container: HTMLElement = this.element) {
    this.content?.remove()
    if (!content) {
      if (this.createByDrag) {
        content = '点击输入标注'
      } else {
        return;
      }
    }
    if (typeof content === 'string') {
      const isMarker = this.start === this.end
      this.content = this.createContentDom(content);
    } else {
      this.content = content
    }
    if (this.contentEditable) {
      this.content.contentEditable = 'true'
    }
    this.content.setAttribute('part', 'region-content')
    container.appendChild(this.content)

    if (this.label) {
      const label = createElement('div', {
        style: {
          width: '100%',
          textAlign: 'center',
          color: '#fff',
          cursor: 'text',
          background: '#00cc52',
          height: '14px',
          lineHeight: '14px',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          overflowX: 'auto',
        },
        textContent: this.label,
      });
      label.contentEditable = 'true'

      container.appendChild(label)

      label.addEventListener('click', (e) => {
        e.stopPropagation();
      })

    }
  }

  /** Update the region's options */
  public setOptions(options: Omit<RegionParams, 'minLength' | 'maxLength'>) {
    if (options.color) {
      this.color = options.color
      this.element.style.backgroundColor = this.color
    }

    if (options.drag !== undefined) {
      this.drag = options.drag
      this.element.style.cursor = this.drag ? 'grab' : 'default'
    }

    if (options.start !== undefined || options.end !== undefined) {
      const isMarker = this.start === this.end
      this.start = this.clampPosition(options.start ?? this.start)
      this.end = this.clampPosition(options.end ?? (isMarker ? this.start : this.end))
      this.renderPosition()
      this.setPart()
    }

    if (options.content) {
      this.setContent(options.content)
    }

    if (options.id) {
      this.id = options.id
      this.setPart()
    }

    if (options.resize !== undefined && options.resize !== this.resize) {
      const isMarker = this.start === this.end
      this.resize = options.resize
      if (this.resize && !isMarker) {
        this.addResizeHandles(this.element)
      } else {
        this.removeResizeHandles(this.element)
      }
    }
  }

  /** Remove the region */
  public remove() {
    this.emit('remove')
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    try {
      if (this.element.parentElement?.children.length === 1) {
        this.element.parentElement?.remove();
      } else {
        this.element.remove()
      }
    } catch (e) {
      console.error('-----e', e);
    }

    // This violates the type but we want to clean up the DOM reference
    // w/o having to have a nullable type of the element
    this.element = null as unknown as HTMLElement
  }
}

class RegionsPlugin extends BasePlugin<RegionsPluginEvents, RegionsPluginOptions> {
  private regions: Region[] = []
  private regionsContainer: HTMLElement

  /** Create an instance of RegionsPlugin */
  constructor(options?: RegionsPluginOptions) {
    super(options)
    this.regionsContainer = this.initRegionsContainer(options)
  }

  /** Create an instance of RegionsPlugin */
  public static create(options?: RegionsPluginOptions) {
    return new RegionsPlugin(options)
  }

  /** Called by wavesurfer, don't call manually */
  onInit() {
    if (!this.wavesurfer) {
      throw Error('WaveSurfer is not initialized')
    }
    this.wavesurfer.getRegionsWrapper().appendChild(this.regionsContainer)

    let activeRegions: Region[] = []
    this.subscriptions.push(
      this.wavesurfer.on('timeupdate', (currentTime) => {
        // Detect when regions are being played
        const playedRegions = this.regions.filter(
          (region) =>
            region.start <= currentTime &&
            (region.end === region.start ? region.start + 0.05 : region.end) >= currentTime,
        )

        // Trigger region-in when activeRegions doesn't include a played regions
        playedRegions.forEach((region) => {
          if (!activeRegions.includes(region)) {
            this.emit('region-in', region)
          }
        })

        // Trigger region-out when activeRegions include a un-played regions
        activeRegions.forEach((region) => {
          if (!playedRegions.includes(region)) {
            this.emit('region-out', region)
          }
        })

        // Update activeRegions only played regions
        activeRegions = playedRegions
      }),
    )
  }

  private initRegionsContainer(options): HTMLElement {
    const labels = options.labels;

    const c = createElement('div', {
      style: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '3',
        pointerEvents: 'none',
      },
    });

    if (labels !== undefined && labels > 0) {
      for (let i = 0; i < labels; i++) {
        const item = createElement('div', {
          style: {
            position: 'relative',
            width: '100%',
            height: '200px',
            pointerEvents: 'none',
          },
        });
        c.appendChild(item);
      }
    }

    return c;
  }

  private initLabelElement(): HTMLElement {

    const vw = this.wavesurfer;
    return createElement('div', {
      style: {
        background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAACWCAYAAABO4tERAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAL6ADAAQAAAABAAAAlgAAAAD1g6ySAAADX0lEQVR4Ae2cy47iMBBFHYR4CLaINRv4/59DPCQy3HQq464kxI0h2RxLI6fFFLGvy8dF2UlxOBzK8/kcHo9H8GU+n4ftdhtms5n/KJRlGe73e5jStjidTs92lOF6vYbL5dLqRFEUYblchtVq1duJqWyrxpusQ51QB9SRvpF41Ylv2BbH47GUunFJ6cRisag6MaVtsd/vS1OlqyFyJf1Th3zRCExpW+x2u6pVrxqiyWwu8ddOfNO2abypqk6s1+sgt/AjkdKQMW1bjY87IUwKl76oE0Lk7XbzH1V/S4AxbGd9HLcGqvZFjdtsNr1rwFi2cF4jk4LXT68RcF6KejJpJL69RjS0gfMjrxGN8l04HIPVOfeF8xb3+AVNk/ibvwWI52O/TVmsPvVbgHh+qjWihUo1ZMyY3Fzunfu2Gh9/GZw3NepaCn/qtwDxvERNQSTxfJQvgvNw/o31Bc47lFdp8r68PZyv0Uw8H7tNymJFPP/cpWloMxWrc+7bNN6GXl9GPD9Cbp+8DXmbF5vYtuOo+RgX8vPk5zs2KJT7tPmkldsXOO8V0cQaI+cD580vyc+7HXdtUMD5rolpqrAP605cwXnvLlKE8zYuSpRIJozHrj7T4hfn9snPS5WUlAf5efLz8pW6aCL1LVZDrM6xJZ63EbCaeN5FlxIGzksBX+D8wBMUIlqc22cfNofVObZw3k9eqUnexqkiUYjnnSjE8ykLHZyP3SaH1Tm2cD4eBV3DeeL52ide5cn1X1IwR96GvE3tTqpyWJ1jC+ejQagu4Tycr30CztcbwnFMHs+XlIUutiVvk8PqHFs4H/utruE8nK99As7D+f8heIPKHN5OZds03nCnhnB+nvPz5g8/tbyC/PxvTcjbJCWuiOdjt4Hzb6wvrUXKFJWaY+yl2v2s/st9OT/P+Xmek7KZ86yVBPr2u8hynrFqaDMVq3Pu2zTeBNeXEc8Tz5s//NTyCuL535oQzxPPt16c+c0z8HDeT0ApQjzvVPGsdh/znFTnS/TtoRap50vKNiTnbThvE/lNDqtzbInno0GoLqXmGGsEeRvyNuRtotlH3uZ5AMLmhMTwBc53KTIGq3PuC+fNp/2LFnTMRWGwQmn5ti9DYfSQLe+rjBUdUtM/05pjy7nKHFbn2P4D3LrPCNRXmbUAAAAASUVORK5CYII=)',
        borderTop: `solid 1px ${vw?.options.waveColor}`,
        position: 'relative',
        width: '100%',
        height: '100px',
        overflow: 'hidden',
        color: 'fff',
        pointerEvents: 'none',
      },
    });
  }

  /** Get all created regions */
  public getRegions(): Region[] {
    return this.regions
  }

  private avoidOverlapping(region: Region) {
    if (!region.content) return

    setTimeout(() => {
      // Check that the label doesn't overlap with other labels
      // If it does, push it down until it doesn't
      const div = region.content as HTMLElement
      const box = div.getBoundingClientRect()

      const overlap = this.regions
        .map((reg) => {
          if (reg === region || !reg.content) return 0

          const otherBox = reg.content.getBoundingClientRect()
          if (box.left < otherBox.left + otherBox.width && otherBox.left < box.left + box.width) {
            return otherBox.height
          }
          return 0
        })
        .reduce((sum, val) => sum + val, 0)

      div.style.marginTop = `${0}px`
    }, 10)
  }

  private adjustScroll(region: Region) {
    const scrollContainer = this.wavesurfer?.getWrapper()?.parentElement
    if (!scrollContainer) return
    const { clientWidth, scrollWidth } = scrollContainer
    if (scrollWidth <= clientWidth) return
    const scrollBbox = scrollContainer.getBoundingClientRect()
    const bbox = region.element.getBoundingClientRect()
    const left = bbox.left - scrollBbox.left
    const right = bbox.right - scrollBbox.left
    if (left < 0) {
      scrollContainer.scrollLeft += left
    } else if (right > clientWidth) {
      scrollContainer.scrollLeft += right - clientWidth
    }
  }

  private virtualAppend(region: Region, element: HTMLElement) {
    const renderIfVisible = () => {
      if (!this.wavesurfer) return
      const clientWidth = this.wavesurfer.getWidth()
      const scrollLeft = this.wavesurfer.getScroll()
      // todo calculate scrollWidth when needed
      const scrollWidth = 0
      const duration = this.wavesurfer.getDuration()
      const start = Math.round((region.start / duration) * scrollWidth)
      const width = Math.round(((region.end - region.start) / duration) * scrollWidth) || 1

      // Check if the region is between the scrollLeft and scrollLeft + clientWidth
      const isVisible = start + width > scrollLeft && start < scrollLeft + clientWidth

      if (isVisible) {
        const R = this.wavesurfer.renderer;
        const wrapper = R.annotationsWrapper;

        // drag to add region.
        let drag2region = (!region.label && !region.content);

        const anWrapper = drag2region ? null : wrapper.querySelector(`[id=${region.label}]`)
        if (anWrapper) {
          anWrapper.appendChild(element)
        } else {
          const item = this.initLabelElement();
          item.setAttribute('id', region.label)
          item.appendChild(element)

          if (drag2region) {
            const id = 'drag2region';
            const JW = wrapper.querySelector(`[id=${id}]`);
            // append to the first wrapper
            if (JW) {
              JW.appendChild(element)
            } else {
              item.textContent = '点击输入标注'
              item.setAttribute('id', id);
              wrapper.insertBefore(item, wrapper.firstChild);
            }
          } else {
            wrapper.appendChild(item)
          }
        }
      } else {
        element.remove()
      }
    }

    requestAnimationFrame(() => {
      if (!this.wavesurfer) return
      renderIfVisible()

      const unsubscribe = this.wavesurfer.on('scroll', renderIfVisible)
      this.subscriptions.push(region.once('remove', unsubscribe), unsubscribe)
    })
  }

  private saveRegion(region: Region) {
    this.virtualAppend(region, region.element)
    this.regions.push(region)

    const regionSubscriptions = [
      region.on('update', (side) => {
        // Undefined side indicates that we are dragging not resizing
        if (!side) {
          this.adjustScroll(region)
        }
        this.emit('region-update', region, side)
      }),

      region.on('update-end', () => {
        this.avoidOverlapping(region)
        this.emit('region-updated', region)
      }),

      region.on('play', () => {
        this.wavesurfer?.play()
        this.wavesurfer?.setTime(region.start)
      }),

      region.on('click', (e) => {
        this.emit('region-clicked', region, e)
      }),

      region.on('dblclick', (e) => {
        this.emit('region-double-clicked', region, e)
      }),

      // Remove the region from the list when it's removed
      region.once('remove', () => {
        regionSubscriptions.forEach((unsubscribe) => unsubscribe())
        this.regions = this.regions.filter((reg) => reg !== region)
        this.emit('region-removed', region)
      }),
    ]

    this.subscriptions.push(...regionSubscriptions)

    this.emit('region-created', region)
  }

  /** Create a region with given parameters */
  public addRegion(options: RegionParams): Region {
    if (!this.wavesurfer) {
      throw Error('WaveSurfer is not initialized')
    }

    const duration = this.wavesurfer.getDuration()
    const numberOfChannels = this.wavesurfer?.getDecodedData()?.numberOfChannels
    const region = new SingleRegion(options, duration, numberOfChannels)

    if (!duration) {
      this.subscriptions.push(
        this.wavesurfer.once('ready', (duration) => {
          region._setTotalDuration(duration)
          this.saveRegion(region)
        }),
      )
    } else {
      this.saveRegion(region)
    }

    return region
  }

  /**
   * Enable creation of regions by dragging on an empty space on the waveform.
   * Returns a function to disable the drag selection.
   */
  public enableDragSelection(options: Omit<RegionParams, 'start' | 'end'>, threshold = 3): () => void {
    const wrapper = this.wavesurfer?.getRegionsWrapper()
    if (!wrapper || !(wrapper instanceof HTMLElement)) return () => undefined

    const initialSize = 5
    let region: Region | null = null
    let startX = 0

    return makeDraggable(
      wrapper,

      // On drag move
      (dx, _dy, x) => {
        if (region) {
          // Update the end position of the region
          // If we're dragging to the left, we need to update the start instead
          region._onUpdate(dx, x > startX ? 'end' : 'start')
        }
      },

      // On drag start
      (x) => {
        startX = x
        if (!this.wavesurfer) return
        const duration = this.wavesurfer.getDuration()
        const numberOfChannels = this.wavesurfer?.getDecodedData()?.numberOfChannels
        const { width } = this.wavesurfer.getRegionsWrapper().getBoundingClientRect()
        // Calculate the start time of the region
        const start = (x / width) * duration
        // Give the region a small initial size
        const end = ((x + initialSize) / width) * duration

        // Create a region but don't save it until the drag ends
        region = new SingleRegion(
          {
            ...options,
            // createByDrag: true,
            start,
            end,
          },
          duration,
          numberOfChannels,
        )
        // Just add it to the DOM for now
        this.regionsContainer.appendChild(region.element)
      },

      // On drag end
      () => {
        if (region) {
          this.saveRegion(region)
          region = null
        }
      },

      threshold,
    )
  }

  /** Remove all regions */
  public clearRegions() {
    this.regions.forEach((region) => region.remove())
  }

  /** Destroy the plugin and clean up */
  public destroy() {
    this.clearRegions()
    super.destroy()
    this.regionsContainer.remove()
  }
}

export default RegionsPlugin
export type Region = SingleRegion
