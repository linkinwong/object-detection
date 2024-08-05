// Copyright (C) 2022 Intel Corporation
// Copyright (C) 2022-2024 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import {Layout, Select, Col, Row, message, Button, Typography} from 'antd';
import Axios from "axios";
import $ from "jquery";

var id = '';
var textName = '';

const {Header, Content, Footer, Sider} = Layout;

const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#fff',
    height: 64,
    paddingInline: 48,
    lineHeight: '64px',
    backgroundColor: '#4096ff',
};

const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    minHeight: 120,
    lineHeight: '50px',
    color: '#fff',
    backgroundColor: '#0958d9',
};

const siderStyle: React.CSSProperties = {
    textAlign: 'center',
    lineHeight: '120px',
    color: '#fff',
    backgroundColor: '#1677ff',
};

const layoutStyle = {
    borderRadius: 8,
    overflow: 'hidden',
    width: 'calc(60% - 8px)',
    maxWidth: 'calc(60% - 8px)',
    height: 'calc(90% - 8px)',
    maxHeight: 'calc(90% - 8px)',
    margin: '20px auto',
};

const countWord = (text, word) => {
    const pattern = new RegExp(word, 'g');
    const matches = text.match(pattern);
    return matches ? matches.length : 0;
};

const changeWidthContent = () => {
    let contentHeight = $('.text-content').height();
    let lineHeight = $('.text-content').css('line-height');
    lineHeight = parseInt(lineHeight.substring(0, lineHeight.length - 2));
    let row = contentHeight / lineHeight;
    let html = '';
    for (let i = 0; i < row; i++) {
        html += i;
        if (i !== row - 1) {
            html += '<br/>';
        }
    }
    $('.text-row').html(html);
};

const getLabelSelectOption = (origin) => {
    var newList = [];
    origin.map((item, index) => {
        newList.push({
            value: item.id,
            label: item.name,
        });
    });
    return newList;
};

const getLabelByName = (labels, name) => {
    var label;
    labels.map((item, index) => {
        if (item.name === name) {
            label = item;
            return false;
        }
    });
    return label;
};

const getLabelById = (labels, id) => {
    var label;
    labels.map((item, index) => {
        if (item.id === id) {
            label = item;
            return false;
        }
    });
    return label;
};

class JobTextAnnotatorComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props,
            currentIndex: 0,
            text: '',
            textName: '',
        };
        this.selectedText = '';
        this.labelSelectOption = getLabelSelectOption(props.labels);
        id = props.id;
        textName = props.textName;
    }

    componentWillMount() {
        this.fetchData();
    }

    componentDidUpdate(prevProps, prevState) {
        // 检查state中的某个特定状态是否更新
        if (this.state.currentIndex !== prevState.currentIndex) {
            this.fetchData();
        }
        if (this.state.text !== prevState.text) {
            const {text} = this.state;
            if (text) {
                changeWidthContent();
                this.annotationRender();
                $('.text-content').click('mouseup', () => {
                    const title = $('.label-select .ant-select-selection-item').attr('title');
                    if (!title) {
                        // message.error('请先选择标签类型');
                        return;
                    }
                    const selectedLabel = getLabelByName(this.state.labels, title);
                    const selectedText = window.getSelection().toString();
                    if (!selectedText) {
                        return;
                    }
                    const range = window.getSelection().getRangeAt(0);
                    const annotationClassName = `text-annotation-${selectedLabel.id}`;
                    const labelDiv = $('<div>', {class: `text-label ${annotationClassName}`});
                    const len = $('.text-content').find(`.${annotationClassName}`).length;
                    labelDiv.text(selectedLabel.name + '-' + (len + 1));
                    labelDiv.css({
                        background: selectedLabel.color,
                    });
                    const span = $('<span>', {class: 'text-light'});
                    span.css({
                        background: selectedLabel.color,
                        position: 'relative',
                    });
                    span.attr({
                        'data-toggle': 'tooltip',
                        'data-placement': 'right',
                    });
                    if (range.commonAncestorContainer.parentElement.tagName === 'SPAN') {
                        return;
                    }
                    try {
                        range.surroundContents(span[0]);
                    } catch (e) {
                        if (e.name === 'InvalidStateError' &&
                            e.message === "Failed to execute 'surroundContents' on 'Range': The Range has partially selected a non-Text node.") {
                            message.error('标注区域有重合，请重新选择区域');
                            return;
                        }
                        throw e;
                    }
                    span.find('div').remove();
                    span.children('span').each((index, span) => {
                        const spanText = document.createTextNode(span.innerText);
                        span.parentNode.replaceChild(spanText, span);
                    });
                    let count = countWord(this.state.text, span.text());
                    span.attr('title', `出现次数: ${count}`);
                    let lineHeight = $('.text-content').css('line-height');
                    lineHeight = parseInt(lineHeight.substring(0, lineHeight.length - 2));
                    let top = '-60%';
                    if (span.css('height') * 0.6 > lineHeight) {
                        top = `-${lineHeight}px`;
                    }
                    span.css('top', top);
                    span.append(labelDiv);
                    window.getSelection().removeAllRanges();
                });
                const contentDiv = $('.text-content');
                const resize = new ResizeObserver(changeWidthContent);
                resize.observe(contentDiv[0]);
            }
        }
    }

    annotationRender = () => {
        const taskData = this.state.otherTypeData[this.state.currentIndex].taskData;
        const annotations = taskData.annotations.annotations;
        if (!annotations) {
            return;
        }
        let content = $('.text-content').text();
        for (const annotation of annotations) {
            for (const key in annotation) {
                if (annotation.hasOwnProperty(key)) { // 确保是对象自有属性，不是原型链上的属性
                    const regex = new RegExp(key, 'gi');
                    const labelId = parseInt(annotation[key].labelId);
                    const color = getLabelById(this.state.labels, labelId).color || 'yellow';
                    const count = countWord(this.state.text, key);
                    // eslint-disable-next-line max-len
                    let span = `<span style="position: relative; background: ${color}" title="出现次数: ${count}" dataToggle="tooltip" dataPlacement="right">${key}<div style="background: ${color}" class="text-label text-annotation-${labelId}">${annotation[key].annotation}</div></span>`;
                    content = content.replace(regex, span);
                }
            }
        }
        $('.text-content').html(content);
    };

    fetchData = () => {
        const task = this.state.otherTypeData[this.state.currentIndex];
        console.log('-----task', task, '---this.state', this.state);
        if (!task) return;
        Axios.get(`/text/data/${this.state.id}/${task.textName}`)
            .then(
                (response) => {
                    this.setState({
                        text: response.data,
                        textName: task.textName,
                    });
                },
            ).catch(error => console.error('Error fetching data: ', error));
    };
    onNext = () => {
        const currentIndex = this.state.currentIndex + 1 < this.state.otherTypeData.length ? this.state.currentIndex + 1 : this.state.currentIndex;
        this.setState({
            currentIndex,
        });
    };
    onPre = () => {
        const currentIndex = this.state.currentIndex > 0 ? this.state.currentIndex - 1 : this.state.currentIndex;
        this.setState({
            currentIndex,
        });
    };
    onSave = () => {
        const my = this;
        var textAnnotationDict = {};
        $('.text-content').children('span').each((index, span) => {
            span = $(span);
            let value = span.children('div').text();
            let key = span.text().trim();
            let labelId = span.children('div').attr('class').split(' ')[1].split('-')[2];
            key = key.replace(value, '');
            if (key) {
                textAnnotationDict[key] = {
                    annotation: value,
                    labelId: labelId,
                };
            }
        });
        const textName = this.state.textName;
        const content = {
            job: textName,
            job_end_time: new Date().getTime(),
            annotations: textAnnotationDict,
        };
        Axios.post(`/text/post_ret?id=${id}&filename=${textName}`, content).then(response => {
            message.success(`${textName} 保存成功. `);
            my.state.otherTypeData[this.state.currentIndex].taskData.annotations = [textAnnotationDict];
            const otherTypeData = my.state.otherTypeData;
            my.setState({otherTypeData});
        }).catch(error => {
            message.error(`${textName} 保存失败, `, error);
        });
    };
    onClear = (e) => {
        const title = $('.label-select .ant-select-selection-item').attr('title');
        if (title) {
            return;
        }
        var selection = window.getSelection();
        if (selection.rangeCount > 0) {
            var range = selection.getRangeAt(0);
            var clone = range.cloneContents();
            if ($(clone).children('span').length === 0) {
                return;
            }
            clone.childNodes.forEach(function (node) {
                if (node.nodeName !== 'SPAN') {
                    return true;
                }
                $(node).children('div').remove();
                $(node).replaceWith($(node).text());
            });
            range.deleteContents();
            range.insertNode(clone);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand("defaultParagraphSeparator", false, "br");
        }
        $('.text-content span[datatoggle="tooltip"]:empty').remove();
    };

    render() {
        return (
            <Layout style={layoutStyle} className="container">
                <Header style={headerStyle}>文本标注</Header>
                <Layout style={{border: '2px solid #1890ff'}}>
                    <Sider width="20%" style={siderStyle}>
                        <Row style={{lineHeight: '60px'}}>
                            <Col span={24}>
                                <Select
                                    showSearch
                                    allowClear
                                    style={{width: '80%'}}
                                    placeholder="请选择标签"
                                    optionFilterProp="children"
                                    filterOption={(input, option) => (option?.label ?? '').includes(input)}
                                    filterSort={(optionA, optionB) =>
                                        (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                                    }
                                    options={this.labelSelectOption}
                                    className="label-select"
                                />
                            </Col>
                        </Row>
                        <Row style={{lineHeight: '60px'}}>
                            <Col span={24}>
                                <Button style={{width: '80%'}} type="primary" className='text-del' onClick={this.onClear}>删除标记</Button>
                            </Col>
                        </Row>
                        <Row style={{lineHeight: '60px'}}>
                            <Col span={24}>
                                <Button style={{width: '80%'}} type="primary" className='text-save' onClick={this.onSave}>保 存</Button>
                            </Col>
                        </Row>
                        <Row style={{lineHeight: '60px'}}>
                            <Col span={24}>
                                <Button style={{width: '80%'}} type="primary" className='text-pre' onClick={this.onPre}> pre </Button>
                            </Col>
                        </Row>
                        <Row style={{lineHeight: '60px'}}>
                            <Col span={24}>
                                <Button style={{width: '80%'}} type="primary" className='text-next' onClick={this.onNext}> next </Button>
                            </Col>
                        </Row>
                    </Sider>
                    <Content style={contentStyle}>
                        <Row style={{height: '10%', justifyContent: 'center', alignItems: 'center'}}>
                            <Col span={3}>Title</Col>
                            <Col style={{textAlign: 'left', fontWeight: 600, fontSize: '1.875rem'}} span={21}>{this.state.textName}</Col>
                        </Row>
                        <Row style={{height: '90%', width: '100%', overflowY: 'scroll'}}>
                            <Col span={3} className='text-row'></Col>
                            <Col span={21} style={{height: '100%'}}>
                                <div dangerouslySetInnerHTML={{__html: this.state.text}} style={{overflowWrap: 'break-word', padding: '0 15px 0 0', textAlign: 'left'}} className={'text-content'}>
                                </div>
                            </Col>
                        </Row>
                    </Content>
                </Layout>
            </Layout>
        );
    }
}

// export default React.memo(JobTextAnnotatorComponent);
export default JobTextAnnotatorComponent;
