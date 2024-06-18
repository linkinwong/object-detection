from objective_xzt_recognizer import  main_recognize_examinee_id, main_recognize_scantron_by_examinee
from objective_xzt_scorer import Score_XZT_Model
import segmentation.Layout4Card.api as OuterSegmentation
import segmentation.blankSegmentation.blank_segmentation as BlankSegmentation
import scoreblocks.singleCharacterRecognition as SingleCharacterRecognition
import scoreblocks.fillblankmodel as FillBlankModel
import scoreblocks.candemo as CanDemo
import scoreblocks.essayscoremodel as EssayScoreModel
import PIL.Image
import cv2
import os

# os.chdir('/Users/pingzhang/AI/OCRAutoScore')
os.chdir("/data/alan/OCRAutoScore")


class scoresystem:
    def __init__(self):
        # 模型
        self.outer_segmentation = OuterSegmentation.OuterSegmentation()
        self.blank_segmentation = BlankSegmentation.Model()
        self.single_character_recognition = SingleCharacterRecognition.Model(
            "scoreblocks/CharacterRecognition/SpinalVGG_dict.pth", "SpinalVGG"
        )
        self.fill_blank_model = FillBlankModel.model()
        self.candemo = CanDemo.model()
        self.essay_score_model = EssayScoreModel.model()
        # 答案
        # answer是一个数组，每项是一个字典，字典格式如下：
        # {'section': 'xzt', # section的意思是题目类型，xzt是选择题，tkt是填空题，zwt是作文题
        # 'value': [...]} # value里面的值是各小题的正确答案
        self.answer = None
        self.score_xzt_model = Score_XZT_Model()

    def set_answer(self, answer):
        self.answer = answer

    @staticmethod
    def scale_image(img, target_width=640):
        # 同步缩放到宽度640，保持不变形
        height, width = img.shape[:2]
        new_width = target_width
        new_height = int((new_width / width) * height)
        resized_img = cv2.resize(img, (new_width, new_height))
        return resized_img

    def tkt_score(self, section_img, section_answer):
        # 2.填空分割
        blank_segmentation_result = self.blank_segmentation.process_img(
            section_img
        )  # blank_segmentation_result是一个数组，每项都是图片ndarray
        score_result = {"section": "tkt"}
        right_array = []
        
        for i in range(len(blank_segmentation_result)):
            cv2.imwrite(f"/data/alan/OCRAutoScore/debug/image_process_steps_learn/tkt_small_seg_{i}.png", blank_segmentation_result[i])
        # 3.OCR单词识别
        for i in range(len(blank_segmentation_result)):
            recognition_result = self.fill_blank_model.recognize_text(
                blank_segmentation_result[i]
            )

            print('64  填空题识别的结果 result', recognition_result)
            if recognition_result is not None:
                if recognition_result[1] == section_answer[i]:
                    right_array.append(1)
                else:
                    judge_index = self.fill_blank_model.judge_with_clip(
                        section_answer[i],
                        recognition_result[1],
                        blank_segmentation_result[i],
                    )
                    if judge_index == 0:
                        right_array.append(1)
                    else:
                        right_array.append(0)
            else:
                right_array.append(0)
        score_result["value"] = right_array
        return score_result

    def tkt_math_score(self, section_img, section_answer):
        # 2.填空分割
        blank_segmentation_result = self.blank_segmentation.process_img(
            section_img
        )  # blank_segmentation_result是一个数组，每项都是图片ndarray
        score_result = {"section": "tkt_math"}
        right_array = []
        # 3.数学公式识别
        for i in range(len(blank_segmentation_result)):
            recognition_result = self.candemo.output_img(blank_segmentation_result[i])
            # print('81  数学公式填空题识别的结果 result', recognition_result)
            if recognition_result is not None:
                if recognition_result[1] == section_answer[i]:
                    right_array.append(1)
                else:
                    judge_index = self.fill_blank_model.judge_with_clip(
                        section_answer[i],
                        recognition_result[1],
                        blank_segmentation_result[i],
                    )
                    if judge_index == 0:
                        right_array.append(1)
                    else:
                        right_array.append(0)
            else:
                right_array.append(0)
        score_result["value"] = right_array
        return score_result

    def zwt_score(self, section_img):
        score_result = {"section": "zwt"}
        right_array = []
        # 用ppocr获得全部英文
        essay = ""
        str_set = self.fill_blank_model.ocr.ocr(section_img)[0]
        if str_set is not None:
            for str_item in str_set:
                essay += str_item[1][0]
            
            # print('106  作文题OCR的结果 essay', essay)
            # 用模型判断
            result = self.essay_score_model.getscore([essay])
            # print('113  作文题评分的结果 result', result)
            if result != None:
                result = result / 12 * 100
                right_array.append(result)
            else:
                right_array.append(0)
        else:
            right_array.append(0)
        score_result["value"] = right_array
        return score_result

    def get_score(self, img_path):
        img = cv2.imread(img_path)
        # 如果宽比高还长，那么是双页版，需要截取第一页
        
        height, width, _ = img.shape
        if width> 1.2* height:
            img = img[:, : width//2]
        cv2.imwrite("/data/alan/OCRAutoScore/debug/image_process_steps_learn/1_left_half.png", img)
        scaled_img = scoresystem.scale_image(img,1650)
        img_path = "/data/alan/OCRAutoScore/debug/image_process_steps_learn/1_scaled_img.png"
        cv2.imwrite(img_path, scaled_img)

        img = PIL.Image.open(img_path)
        # print('127  图片的size是：', img.size)
        total_result = []
        # 这个是返回的批改结果，格式为数组，每个数组元素都是一个字典，字典格式为：
        # {'section':科目, 'value':[一个01数组，1表示对应index的小题对，0表示对应index的小题错]}

        # 获取填空题答案
        answer_set_index = 0
        # 1.外框分割
        outer_segmentation_results = self.outer_segmentation.get_segmentation(img)
        # print('136, 分割处理后的数据结构为outer_segmentation_results： ', outer_segmentation_results)
        CLS_ID_NAME_MAP = {
            0: "student_id",
            1: "subjective_problem",
            2: "fillin_problem",
            3: "objective_problem",
        }
        # 从results中提取出标签为: 'objective_problem'的box，并从原图中裁剪出来，然后展示到屏幕上

        for outer_segmentation_result in outer_segmentation_results:
            # print(
            #     "132  outer_segment_result.boxes",
            #     len(outer_segmentation_result.boxes),
            #     outer_segmentation_result.boxes,
            # )
            xzt_boxes = []
            for box in outer_segmentation_result.boxes:
                cls_id = box.cls.cpu().numpy()[0]
                x1, y1, x2, y2 = box.xyxy.cpu().numpy()[0]
                cls_name = CLS_ID_NAME_MAP[cls_id]

                # print("136  cls_name=", cls_name, (x1, y1, x2, y2))

                if cls_name == "student_id":
                    print('158  进入考生id填涂区域！！')
                    box_conf = box.conf.item()
                    if box_conf >= 0.25:  # 
                        xyxy = box.xyxy.cpu().numpy()[0].astype(int)
                        # 下面识别考生编号的填涂， values是选择的数字列表 
                        values = main_recognize_examinee_id(xyxy, img_path)
                        total_result.append({'section': 'id', 'value': values})

                if cls_name == "fillin_problem":  # 填空题模型
                    continue
                    for answer in self.answer[answer_set_index:]:
                        if answer["section"] == "tkt":  # 题目类型相符
                            # answer_set_index = self.answer.index(answer)
                            section_answer = answer["value"]
                            section_img = outer_segmentation_result.orig_img
                            section_img = section_img[
                                int(y1) : int(y2), int(x1) : int(x2)
                            ]
                            cv2.imwrite("/data/alan/OCRAutoScore/debug/image_process_steps_learn/tkt_seg.png", section_img)
                            score_result = self.tkt_score(section_img, section_answer)
                            total_result.append(score_result)
                        elif answer["section"] == "tkt_math":
                            # answer_set_index = self.answer.index(answer)
                            section_answer = answer["value"]
                            section_img = outer_segmentation_result.orig_img
                            section_img = section_img[
                                int(y1) : int(y2), int(x1) : int(x2)
                            ]
                            cv2.imwrite("/data/alan/OCRAutoScore/debug/image_process_steps_learn/tktmath_seg.png", section_img)
                            # score_result = self.tkt_math_score(
                            #     section_img, section_answer
                            # )
                            total_result.append(score_result)
                elif cls_name == "subjective_problem":
                    continue
                    for answer in self.answer[answer_set_index:]:
                        if answer["section"] == "zwt":  # 题目类型相符
                            # answer_set_index = self.answer.index(answer)
                            section_img = outer_segmentation_result.orig_img
                            section_img = section_img[
                                int(y1) : int(y2), int(x1) : int(x2)
                            ]
                            cv2.imwrite("/data/alan/OCRAutoScore/debug/image_process_steps_learn/zwt_seg.png", section_img)
                            score_result = self.zwt_score(section_img)
                            total_result.append(score_result)
                elif cls_name == "objective_problem":
                    box_conf = box.conf.item()
                    if box_conf >= 0.25:  # 假设3类是objective_problem
                        xyxy = box.xyxy.cpu().numpy()[0].astype(int)
                        # x1, y1, x2, y2 = box.xyxy.cpu().numpy()[0]
                        xzt_boxes.append(xyxy)
                        # print(f"185   检测到的框：{xyxy}, 置信度：{box_conf}")


            # 下面识别选择题，并且评分, 是字典，key是题号，value是数字的集合 
            xzt_response = main_recognize_scantron_by_examinee(xzt_boxes, img_path)
            values = self.score_xzt_model.calculate_score(xzt_response, self.answer) 
            total_result.append({'section': 'xzt', 'value': values})
            return total_result


if __name__ == "__main__":
    test_dir = "./example_img"
    lst = os.listdir(test_dir)
    s = scoresystem()
    s.set_answer(
        [
            {
                "section": "xzt",
                "value": [
                    ["d"],
                    ["a"],
                    ["b"],
                    ["a"],
                    ["c"],
                    ["a"],
                    ["b"],
                    ["d"],
                    ["a", "b"],
                    ["b", "d"],
                    ["a", "d"],
                    ["a", "b", "d"],
                ],
            },
            {"section": "tkt", "value": ["60", "0.66", "600", "ln4+3/2"]},
            {"section": "tkt_math", "value": ["ln4+3/2"]},
            {"section": "zwt"},
        ]
    )
    for i in lst:
        if i.endswith(".png") or i.endswith(".jpg"):
            path = os.path.join(test_dir, i)
            path = "/data/alan/OCRAutoScore/example_img/1.jpg"
            path = "/data/alan/OCRAutoScore/example_img/62691a3a29ac300b8b92a88c-0182200420-20221017163608-20220427173655_100.jpg"
            # path  ="/data/alan/OCRAutoScore/example_img/62691a5c29ac300b8b92adc6-0182200513-20221017163755-20220427174311_062.jpg"
            path ="/data/alan/OCRAutoScore/example_img/62691a4b29ac300b8b92ab3b-0182200529-20221017163338-20220427173915_052.jpg"
            path="/data/alan/OCRAutoScore/example_img/Huago20240618150914932_004100.jpg"
            path="/data/alan/OCRAutoScore/example_img/Huago20240618150915418_002168.jpg"
            # print("223", "file_name:", path)
            total_result = s.get_score(path)
            print(total_result)
            break
