
const { Select, Space, Button } = antd;
const { useState, useEffect } = React;

const root = ReactDOM.createRoot(document.getElementById('iiiiiframe'));
root.render(
    <JobAudioSelect />
);

function JobAudioSelect(props) {

    const [configMap, setConfigMap] = useState({
        labels: [],
        provinceData: [],
        cityData: {},
    });

    const [cities, setCities] = useState();
    const [secondCity, setSecondCity] = useState([]);


    const { labels, provinceData, cityData } = configMap;

    useEffect(() => {
        if (configMap.labels.length) {
            setCities(cityData[provinceData[0]]);
            setSecondCity(cityData[provinceData[0]][0]);
        }
    }, [configMap])

    useEffect(() => {
        window.addEventListener('message', (event) => {
            const { request_id, userId, labels: data } = event.data;
            console.log('----audio-labels', data);
            if (event.data.target !== 'audio-labels') return;
            if (data?.length) {
                for (let label of data) {
                    const title = label.name;
                    cityData[title] = [title + 1, title + 2, title + 3, title + 4];
                    provinceData.push(title);
                }
                setConfigMap({
                    labels: data,
                    provinceData,
                    cityData,
                });
            }
        });
    }, [])


    const handleProvinceChange = (value) => {
        setCities(cityData[value]);
        setSecondCity(cityData[value][0]);
    };

    const onSecondCityChange = (value) => {
        setSecondCity(value);
    };

    const onClick = (e) => {
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
    };

    if (!labels?.length || !cities) {
        return null;
    }

    return (
        <Space wrap>
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
}

