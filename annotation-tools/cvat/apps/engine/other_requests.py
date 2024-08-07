from .log import ServerLogManager
import requests
from cvat.settings.base import OCR_URL, ASR_URL, FACE_URL, OBJECT_URL, SEGMENT_URL, AITOOLS_TIMEOUT, EXPORT_AUDIO_URL, \
    EXPORT_TEXT_URL, VIDEO_TRACK_URL


slogger = ServerLogManager(__name__)


class AITools(object):
    @staticmethod
    def _request(url, path, headers):
        try:
            with open(path, 'rb') as fp:
                response = requests.post(url, data=fp, headers=headers, timeout=AITOOLS_TIMEOUT)
            slogger.glob.info(f'response: {response.status_code}, {response.text}')
            data = response.json()
            return data
        except Exception as e:
            slogger.glob.error(f'Request failed: {e}')
            raise

    @staticmethod
    def ocr(path, language, headers):
        headers = {
            'Content-Type': f'application/octet-stream, types_n:{language}',
            **headers,
        }
        return AITools._request(OCR_URL, path, headers)

    @staticmethod
    def asr(path, headers):
        headers = {
            'Content-Type': 'application/octet-stream',
            **headers,
        }
        return AITools._request(ASR_URL, path, headers)

    @staticmethod
    def face(path, headers):
        headers = {
            'Content-Type': 'application/octet-stream',
            **headers,
        }
        res_data = AITools._request(FACE_URL, path, headers)
        _res_data = [list(zip(*sorted(item.items(), key=lambda x: int(x[0]))))[1] for item in res_data]
        ret = []
        for item in _res_data:
            _ret = []
            for _item in item:
                _ret.extend(_item)
            ret.append(_ret)
        return ret

    @staticmethod
    def object(path, headers):
        headers = {
            'Content-Type': 'application/octet-stream, types_n:det',
            **headers,
        }
        res_data = AITools._request(OBJECT_URL, path, headers)
        ret = []
        for index, cls in enumerate(res_data['class_id']):
            ret.append({
                'content': cls,
                'point': res_data['xyxy'][index],
            })
        return ret

    @staticmethod
    def segment(path, headers):
        headers = {
            'Content-Type': 'application/octet-stream, types_n:seg',
            **headers,
        }
        res_data = AITools._request(SEGMENT_URL, path, headers)
        mask_data = res_data.get('mask', [])
        contents = res_data.get('class_id', [])
        ret = []
        for index, _mask in enumerate(mask_data):
            _t = []
            [_t.extend(_m) for _m in _mask]
            ret.append({
                'content': contents[index],
                'point': _t,
            })

        return ret

    @staticmethod
    def video_track(path, headers):
        headers = {
            'Content-Type': 'application/octet-stream',
            **headers,
        }
        return AITools._request(VIDEO_TRACK_URL, path, headers)
        # mes = f"res={res_data}"
        # slogger.glob.error(mes)
        # ret = []
        # for item in res_data:
        #     point = item[2:-1]
        #     point[2] += point[0]
        #     point[3] += point[1]
        #     ret.append({
        #         'frame': item[0],
        #         'content': item[1],
        #         'point': point
        #     })
        # print(f'video_track={ret}')
        # return ret


class File(object):
    @staticmethod
    def _request(url, path, params):
        with open(path, 'w', encoding='utf8') as fp:
            response = requests.get(url, json=params, timeout=AITOOLS_TIMEOUT)
            data = response.text
            fp.write(data)


class ExportFile(File):
    @staticmethod
    def audio(path, params):
        ExportFile._request(EXPORT_AUDIO_URL, path, params)

    @staticmethod
    def text(path, params):
        ExportFile._request(EXPORT_TEXT_URL, path, params)

