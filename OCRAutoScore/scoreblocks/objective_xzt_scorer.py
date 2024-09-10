import paddleocr
import numpy as np
from PIL import Image, ImageDraw
import cv2
from ultralytics import YOLO

debug = True


class Score_XZT_Model:
    def __init__(self, language: str = "ch"):
        # self.ocr = paddleocr.PaddleOCR(use_angle_cls=True, lang=language)
        self.yolo_model = YOLO(
            "./segmentation/Layout4Card/runs/detect/train3/weights/best.pt"
        )  # 替换为你的本地路径

    # model = YOLO("./segmentation/Layout4Card/runs/detect/train3/weights/best.pt")  # 替换为你的本地路径

    def preprocess_image(self, img_path: str):
        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
        _, binary_img = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY_INV)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        cleaned_img = cv2.morphologyEx(binary_img, cv2.MORPH_CLOSE, kernel)
        return cleaned_img

    def scale_image(self, img, target_width=640):
        # 同步缩放到宽度640，保持不变形
        height, width = img.shape[:2]
        new_width = target_width
        new_height = int((new_width / width) * height)
        resized_img = cv2.resize(img, (new_width, new_height))
        return resized_img

    def detect_major_sections_with_yolo(self, img_path, conf_threshold=0.25):

        results = self.yolo_model.predict(source=img_path, imgsz=640)
        boxes = []
        for result in results:
            if result.boxes is not None:
                for i in range(len(result.boxes)):
                    box_conf = result.boxes.conf[i].item()
                    box_cls = result.boxes.cls[i].item()
                    # print(f"检测到的boxes：{result.boxes}")
                    if (
                        box_conf >= conf_threshold and box_cls == 3
                    ):  # 假设3类是objective_problem
                        xyxy = result.boxes.xyxy[i].cpu().numpy().astype(int)
                        boxes.append(xyxy)
                        # print(f"检测到的框：{xyxy}, 置信度：{box_conf}")
        return boxes, img_path

    def check_filled_area(self, img_path: str, boxes):
        # img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

        # img_color = cv2.imread(img_path)
        img = cv2.cvtColor(img_path, cv2.COLOR_BGR2GRAY)
        img_color = img_path.copy()
        filled_boxes = []
        for box in boxes:
            x1, y1, x2, y2 = box
            roi = img[y1:y2, x1:x2]
            filled_area = cv2.countNonZero(roi)
            total_area = (x2 - x1) * (y2 - y1)
            fill_ratio = filled_area / total_area
            if fill_ratio > 0.5:
                filled_boxes.append(box)
                cv2.rectangle(img_color, (x1, y1), (x2, y2), (0, 0, 255), 2)
        cv2.imwrite("output_with_boxes.png", img_color)
        return filled_boxes

    def extract_answers(self, boxes):
        """
        提取答案信息，将问题编号和对应的选项填入字典。

        参数:
            boxes (List[List[int]]): 包含每个答案框坐标信息的列表，每个元素是一个包含四个整数的列表，分别表示左上角和右下角的坐标。

        返回:
            answers (Dict[int, str]): 一个字典，键为问题编号（从1开始），值为对应问题的选项（A、B、C或D）。
        """
        answers = {}
        for box in boxes:
            x1, y1, x2, y2 = box[0], box[1], box[2], box[3]
            question_number = (y1 // 50) + 1
            option = chr(65 + ((x1 // 50) % 4))
            answers[question_number] = option
        return answers

    def calculate_score(self, examinee_response, answer):
        value_to_return = []
        for answer in answer:
            if answer["section"] == "xzt":  # 题目类型相符
                for i, ans_list in enumerate(answer['value']):
                    ans_list = list( map(str.upper, ans_list))
                    if i+1 not in examinee_response:
                        value_to_return.append(-1)
                        # print(f'选择题{i+1}: 没有识别到考生的这道题。正确答案{ans_list}')
                        continue
                    response_in_abcd = list(map(lambda x: chr(x+64), list(examinee_response[i+1])) )
                    if set(response_in_abcd)== set(ans_list):
                        value_to_return.append(1)
                        print(f'选择题{i+1}: 正确。你的答案{list(response_in_abcd)}')
                    else:
                        value_to_return.append(0)
                        print(f'选择题{i+1}: 错误。你的答案{list(response_in_abcd)}, 正确答案{ans_list}')
        return value_to_return

                    

if __name__ == "__main__":
    debug = True

    img_path = "/data/alan/OCRAutoScore/test.png"
    img_path = "/data/alan/OCRAutoScore/test06.png"
    img_path = (
        # "/Users/wangmeng/Desktop/speaker-diarization-3.1/img1/8894_19290060_1.jpg"
        "/data/alan/OCRAutoScore/debug/8894_19290429_1.png"
    )
    img_path = "/data/alan/OCRAutoScore/example_img/1.jpg"
    correct_answers = "B,D,A,C,C,D,C,A,A,C,B,A,D,D,C,D,C,A,D,C".split(
        ","
    )  # input("请输入正确答案(多个答案请用逗号分隔): ").split(",")

    model = Score_XZT_Model()
    img = cv2.imread(img_path)
    #img = model.scale_image(img)  # type: ignore
    boxes, _ = model.detect_major_sections_with_yolo(
        img, conf_threshold=0.25
    )  # 设置置信度阈值

    if not boxes:
        print("未检测到答题框")
        # continue
    filled_boxes = model.check_filled_area(img, boxes)
    if not filled_boxes:
        print("未检测到填涂区域")
        # continue
    extracted_answers = model.extract_answers(filled_boxes)
    print("提取的答案: ", extracted_answers)
    for q, pred in extracted_answers.items():
        if pred not in correct_answers:
            print(f"问题 {q} 的正确答案列表：", correct_answers)
            print(f"检测到的答案: {pred}")
