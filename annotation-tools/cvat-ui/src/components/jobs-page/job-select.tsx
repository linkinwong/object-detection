import React, {useState} from 'react';
import {Select, Space, Button} from 'antd';

const JobAudioSelect: React.FC = (props) => {
    const cityData = {};
    type CityName = keyof typeof cityData;
    const provinceData: CityName[] = [];
    const {labels} = props;
    for (let label of labels) {
        const title = label.name;
        cityData[title] = [title + 1, title + 2, title + 3, title + 4];
        provinceData.push(title);
    }

    const [cities, setCities] = useState(cityData[provinceData[0] as CityName]);
    const [secondCity, setSecondCity] = useState(cityData[provinceData[0]][0] as CityName);

    const handleProvinceChange = (value: CityName) => {
        setCities(cityData[value]);
        setSecondCity(cityData[value][0] as CityName);
    };

    const onSecondCityChange = (value: CityName) => {
        setSecondCity(value);
    };

    const onClick = (e) => {
        var regionEles = document.getElementsByClassName('wavesurfer-region-audio');
        if (!regionEles) {
            return;
        }
        const selectedLabelName = $('.wavesurfer-region-audio').attr('label') || $('.job-select .ant-select-selection-item').attr('title');
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
                'line-eight': '30px',
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
    };

    return (
        <Space wrap className='job-select'>
            <Select
                defaultValue={provinceData[0]}
                style={{width: 120}}
                onChange={handleProvinceChange}
                options={provinceData.map((province) => ({label: province, value: province}))}
            />
            <Select
                style={{width: 120}}
                value={secondCity}
                onChange={onSecondCityChange}
                options={cities.map((city) => ({label: city, value: city}))}
            />
            <Button type="primary" onClick={onClick}>确认标签</Button>
        </Space>
    );
};

export default JobAudioSelect;
