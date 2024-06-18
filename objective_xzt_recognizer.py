from collections import defaultdict
from PIL import Image
import functools
import sys
import cv2
import functools
import os
import numpy as np
import math
from ultralytics import YOLO

from objective_xzt_scorer import Score_XZT_Model


class Read_XZT_Model:
    def __init__(self, debug=False):
        self.rects = []  # 记录一张图可以标记分割的矩阵 格式为[x, y, w, h]
        self.crop_img = []  # 保存分割的图片
        self.img = None  # 图片
        self.debug = debug  # debug模式
        self.name = "tmp"  # 图片名
        self.count = 0

    def turn_bright_yellow_2_black(self, img):
        #  有些图上有计算机做的浅色的标注，会影响后面的识别，首先需要去除

        # 定义浅黄色的HSV范围
        lower_yellow = np.array([20, 100, 100])  # 更改这些值以适应你的图像
        upper_yellow = np.array([30, 255, 255])

        # 转换为HSV色彩空间
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # 创建掩码
        mask = cv2.inRange(hsv, lower_yellow, upper_yellow)

        # 使用掩码将浅黄色变为黑色
        img[mask == 255] = 0

        # cv2.imwrite(
        #     f"/data/alan/OCRAutoScore/debug/image_process_steps_learn/1_section_yellow_after.png",
        #     img,
        # )
        return img

    def process(self, img):  # 运行过程
        self.count += 1
        img = self.turn_bright_yellow_2_black(img)

        binary = self.__preProcessing(img)
        cv2.imwrite(
            f"/data/alan/OCRAutoScore/debug/image_process_steps_learn/1_section_binary_{self.count}.png",
            binary,
        )
        # print('30  binary and type:',binary, type(binary))
        horizon = self.__detectLines(binary)
        # print('32  horizon and type:',horizon, type(horizon))
        cv2.imwrite(
            f"/data/alan/OCRAutoScore/debug/image_process_steps_learn/1_section_horizont_{self.count}.png",
            horizon,
        )
        self.__contourExtraction(horizon)
        # result = self.__segmentation()
        # print('self.rects:',len(self.rects))
        rects_tmp = [re for re in self.rects]
        self.rects.clear()
        self.img = None
        self.name = ""
        return rects_tmp

    def __preProcessing(self, img):  # 图片预处理，输出二值图
        self.img = img

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # blur = cv2.GaussianBlur(gray, (5, 5), 1.5)
        # #可以使用比上面更小核和模糊技术
        blur = cv2.GaussianBlur(gray, (3, 3), 1, cv2.BORDER_REPLICATE)
        _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        thresh, binary = cv2.threshold(blur, int(_ * 0.95), 255, cv2.THRESH_BINARY)
        # print("55  阈值 _ 是： ", _)
        return binary

    # @staticmethod
    def __detectLines(self, img):  # 检测水平线, 把比较细的线给腐蚀掉
        # horizon_k = int(math.sqrt(img.shape[1]) * 1.2)  # w
        horizon_k = int(img.shape[1] / 16)  # w
        horizon_k = 7
        # print("87  核的形状： ", (horizon_k, 1))
        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT, (horizon_k, 1)
        )  # 设置内核形状
        horizon = ~cv2.dilate(img, kernel)  # 膨胀
        # cv2.imwrite(
        #     f"/data/alan/OCRAutoScore/debug/image_process_steps_learn/1_section_horiz_1.5rd_neg_dilate_{self.count}.png",
        #     horizon,
        # )
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (int(horizon_k / 1.2), 1))
        horizon = cv2.dilate(horizon, kernel, iterations=1)
        # cv2.imwrite(
        #     f"/data/alan/OCRAutoScore/debug/image_process_steps_learn/1_section_horiz_2nd_dilate_{self.count}.png",
        #     horizon,
        # )

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT, (2, 6)
        )  # 创建一个高度为6的垂直线
        horizon = cv2.erode(horizon, kernel)
        # cv2.imwrite(
        #     f"/data/alan/OCRAutoScore/debug/image_process_steps_learn/1_section_horiz_4nd_eroded_{self.count}.png",
        #     horizon,
        # )

        return horizon

    def __contourExtraction(self, img, debug=False):  # 轮廓检测
        cnts = cv2.findContours(img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        # 绘制轮廓
        # cv2.drawContours(img, cnts[0], -1, (255, 255, 0), 2)
        # cv2.imwrite(f"/data/alan/OCRAutoScore/debug/image_process_steps_learn/8894_19290429_1_section_contour_{self.cnt}.png", img)

        border_y, border_x = img.shape
        # 去除邻近上边界和下边界检测的轮廓

        for cnt in cnts[0]:
            x, y, w, h = cv2.boundingRect(cnt)
            self.rects.append([x, y, w, h])
        # # print("103 : 小矩形轮廓 self.rects和个数", self.rects, len(self.rects))

    @staticmethod
    def _cmp_rect_r1(a, b):
        cax = (a[0] + a[2]) / 2
        cay = (a[1] + a[3]) / 2
        cbx = (b[0] + b[2]) / 2
        cby = (b[1] + b[3]) / 2
        ha = a[3] - a[1]
        hb = b[3] - b[1]
        minh = min(ha, hb)

        if (a[2] < b[0] and abs(cby - cay) < (minh / 6)) or a[3] < b[1]:
            return -1
        elif abs(a[1] - b[1]) < 5 and abs(a[0] - b[0]) < 5:
            return 0
        else:
            return 1


def rectangle_center(rect):
    # 计算矩形的中心点坐标
    x1, y1, x2, y2 = rect
    center_x = (x1 + x2) / 2
    center_y = (y1 + y2) / 2
    return (center_x, center_y)


def sort_rectangles_by_center(rectangles):
    # 对矩形列表按照中心点进行排序
    sorted_rectangles = sorted(
        rectangles, key=functools.cmp_to_key(Read_XZT_Model._cmp_rect_r1)
    )
    #  print('sorted_rectangles:',sorted_rectangles)
    # 初始化行列ID
    row_id = 1
    col_id = 1
    prev_max_y2 = 0

    # 存储排序后的矩形及其行列ID
    sorted_rectangles_with_id = []

    for rect in sorted_rectangles:
        center = rectangle_center(rect)

        # 判断下一个矩形是否在同一行或同一列
        if len(sorted_rectangles_with_id) > 0 and (
            center[0] < sorted_rectangles_with_id[-1][0][0] and rect[1] > prev_max_y2
        ):
            row_id += 1
            col_id = 1
            prev_max_y2 = 0
        prev_max_y2 = max(prev_max_y2, rect[3])
        # print("160, prev_max_y2:", prev_max_y2)
        sorted_rectangles_with_id.append((rect, row_id, col_id))
        col_id += 1
    return sorted_rectangles_with_id


def main_recognize_scantron_by_examinee(list_box, ori_img_path):
    """
    使用模型识别并处理扫描答题卡中的填涂区域。

    参数：
    list_box：list，包含填涂区域每组边界框的列表。
    ori_img_path：原始答题卡图像路径。

    返回值：
    抽取出的客观选择题的答案，并在指定目录下保存处理后的图像和识别结果。
    """
    model_ = Read_XZT_Model(debug=False)
    img_draw = cv2.imread(ori_img_path)

    # print("217 进入客观选择题区域，分割的大的区域 list_box", list_box)

    sorted_rectangles = sort_rectangles_by_center(list_box)

    rect_dic = {}
    mean_h_lst, mean_w_lst = (
        [],
        [],
    )  # 多个选择题题组，综合起来涂抹块的宽度和高度的平均值
    for rect, row_id, col_id in sorted_rectangles:
        x1, y1, x2, y2 = rect
        final_small_rectanges, mean_w, mean_h = stat_graphical_small_rect_dimension(
            rect, ori_img=img_draw, col_id=col_id, read_xzt_model=model_
        )
        print(
            " 210  涂抹小矩形 宽度异常值剔除及拆分之后 的结果 res:",
            final_small_rectanges,
        )
        rect_dic[(row_id, col_id, x1, y1, x2, y2)] = final_small_rectanges
        mean_w_lst.append(mean_w)
        mean_h_lst.append(mean_h)

    global_mean_h = sum(mean_h_lst) / len(mean_h_lst)
    # 填涂矩形本身的宽度，不包括空白间隙
    global_mean_w = sum(mean_w_lst) / len(mean_w_lst)
    # print("309  全局小涂抹格的平均高度和宽度分别是： ", global_mean_h, global_mean_w)

    # 统计平均水平间隔
    global_mean_w_itemize, blank_x = calculate_mean_horizontal_dist(
        rect_dic, global_mean_w
    )
    # print(
    #     " 314   空白位置的平均距离是 blank_x和平均水平间隔global_mean_w_itemize： ",
    #     blank_x,
    #     global_mean_w_itemize,
    # )
    # 统计平均垂直间隔
    global_mean_h_itemize, blank_y = calculate_mean_vertical_dist(
        rect_dic, global_mean_h
    )
    # print(
    #     " 325   空白位置的平均距离是 blank_y和平均垂直间隔global_mean_h_itemize： ",
    #     blank_y,
    #     global_mean_h_itemize,
    # )

    # print('241  这个是否有问题rect_dic: ', rect_dic)
    question_id = 0
    examinee_xzt_response = defaultdict(set)
    for k, v in rect_dic.items():
        idx, idy, x1, y1, x2, y2 = k

        row_num = round((y2 - y1 + blank_y) / global_mean_h_itemize)
        real_item_gap = (y2 - y1 + blank_y) / row_num

        for i in range(row_num):
            question_id += 1

            for rect in v:
                x, y, w, h = rect
                middle_point_vertical = rect[1] + 0.5 * rect[3]
                # print('349, middle_point_vertical, idy, i,  upper, lower, rect:', middle_point_vertical,idy, i, int(i*global_mean_h_itemize), int((i+1)*global_mean_h_itemize), rect)
                if (
                    middle_point_vertical >= i * real_item_gap
                    and middle_point_vertical < (i + 1) * real_item_gap
                ):
                    # print('354, middle_point_vertical, i,  upper, lower, rect:', middle_point_vertical, i, int(i*global_mean_h_itemize), int((i+1)*global_mean_h_itemize), rect)
                    answer_nums = round(
                        (x2 - x1 +blank_x) / global_mean_w_itemize  #(global_mean_w + 0.5 * blank_x)
                    )  # (global_mean_w+0.5*blank_x) 是填涂格宽度加上空白的一半，代表一个item占的宽度
                    interval = [x1-0.5*blank_x, x2 + 0.5*blank_x]
                    middle_point_horizontal = x1 + rect[0] + 0.5 * rect[2]
                    id_x = find_answer_in_subinterval(
                        interval, middle_point_horizontal, answer_nums
                    )
                    if id_x < 0:
                        print(
                            "363 warning: 无法识别该填涂项是第几个答案, ans_num和该填涂块rect分别是：",
                            question_id,
                            rect,
                        )
                        continue
                    examinee_xzt_response[question_id].add(id_x)

                    # print('371, middle_point_vertical, i,  upper, lower, rect:', middle_point_vertical, i, int(i*global_mean_h_itemize), int((i+1)*global_mean_h_itemize), rect)
                    x_new = x1 + x
                    y_new = y1 + y
                    cv2.rectangle(
                        img_draw,
                        (int(x_new), int(y_new)),
                        (int(w + x_new), int(h + y_new)),
                        (255, 0, 255),
                        2,
                    )
                    cv2.putText(
                        img_draw,
                        str(question_id) + "_" + str(id_x),
                        (int(x_new), int(y_new)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (255, 0, 0),
                        1,
                    )
                    cv2.imwrite(
                        f"/data/alan/OCRAutoScore/debug/image_process_steps_learn/1_id{question_id}.png",
                        img_draw,
                    )
        cv2.rectangle(
            img_draw, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 255), 2
        )
    # cv2.imwrite("/Users/wangmeng/Desktop/speaker-diarization-3.1/3.png", img_draw)
    cv2.imwrite("/data/alan/OCRAutoScore/debug/1_process.png", img_draw)
    return examinee_xzt_response


# 确定一个涂抹块是位于该行的第几个答案
def find_answer_in_subinterval(interval, middle_point, n_subintervals):
    interval_size = (interval[1] - interval[0]) / (n_subintervals)
    for i in range(1, n_subintervals + 1):
        lower_bound = interval[0] + (i - 1) * interval_size
        upper_bound = lower_bound + interval_size
        # print('421, middle_point_horizontal, left, right:', middle_point,  lower_bound,upper_bound)
        if lower_bound <= middle_point < upper_bound:
            return i
    return -1


def stat_graphical_small_rect_dimension(
    rect, ori_img, col_id, read_xzt_model: Read_XZT_Model
):
    # 统计客观题答题区域的填涂和空白的尺寸信息
    x1, y1, x2, y2 = rect
    section_img = ori_img[int(y1) : int(y2), int(x1) : int(x2)]
    res = read_xzt_model.process(section_img)
    print(
        " 189  客观题一个多选项区域 after process    col_id, rect:",
        col_id,
        rect,
    )

    # 统计平均高度，剔除低于一半平均高度的框
    sum_h = 0
    heights = []
    for res_1 in res:
        if res_1[-1] < 8 or res_1[-1] > 60:  # 高度特别薄 或者厚
            continue
        heights.append(res_1[-1])
    mean_h = (sum(heights) / len(heights)) / 2
    res_new = [res_1 for res_1 in res if res_1[-1] > mean_h]
    # print(" 200  涂抹小矩形 初步筛选后   row_id, col_id, rect:", res_new)

    # 计算真正的平均高度。
    sum_h = 0
    for res_1 in res_new:
        sum_h += res_1[-1]
    mean_h = sum_h / len(res_new)

    mean_w, sum_w = 0, 0  # 涂抹内容的平均宽度
    count = 0
    for rect in res_new:
        # 一个涂抹格的宽度一般大概是平均高度的两倍， 过小应剔除，
        if (
            rect[2] < mean_h or rect[2] > 3 * mean_h
        ):  # 宽度比一倍的**高度**还小，不进入平均宽度计算
            continue
        sum_w += rect[2]
        count += 1

    # print(" 260  涂抹小矩形 剔除高度和宽度过小值之后  res:", res_new)
    mean_w = sum_w / count
    # print("261  小涂抹格的平均高度和宽度分别是： ", mean_h, mean_w)

    # 一个涂抹格的宽度过大， 可能需要拆分成几个涂抹格
    final_small_rectanges = []
    for rect in res_new:
        if rect[2] < 0.5 * mean_w:  # 宽度过小，应该剔除
            continue
        if (
            rect[2] < 1.4 * mean_w
        ):  # 宽度正常， （没有过分的宽 # 宽度没有大于等于1.5倍 的平均宽度）
            final_small_rectanges.append(rect)  # 无需处理
            continue
        multiple = int(rect[2] // mean_w)  # 需要拆分

        for i in range(multiple):
            x = (
                rect[0] + i * mean_w + min(1, i) * 3
            )  # 表示一个长的涂抹格在切分点附近截断，变成多个格
            w = mean_w - 3
            y, h = rect[1], rect[-1]
            a_split_rect = [x, y, w, h]
            final_small_rectanges.append(a_split_rect.copy())

    # 宽度拆分之后，最后再次剔除低于0.5倍平均高度的框
    final_small_rectanges = [
        res_1 for res_1 in final_small_rectanges if res_1[-1] > 0.5 * mean_h
    ]

    return final_small_rectanges, mean_w, mean_h


# 统计平均水平间隔
def calculate_mean_horizontal_dist(rect_dic, global_mean_w):
    total_blank_dist_effect = []
    for k, v in rect_dic.items():
        lst = sorted(
            [rect[0] + 0.5 * rect[2] for rect in v]
        )  # 每个小涂抹格的水平中间位置，排序
        # print('317  小涂抹格的中间位置升序排列 lst', lst)
        effect_pos = [lst[0]]  # 可以加入列表的中间点位置，有效位置
        blank_dist_effect = []  # 有效位置之间的距离
        for i in range(1, len(lst)):
            dist = lst[i] - effect_pos[-1]
            if dist > global_mean_w * 0.8 and dist < 1.9 * global_mean_w:
                blank_dist_effect.append(dist)
                effect_pos.append(lst[i])
        total_blank_dist_effect += blank_dist_effect.copy()

    # print(" 424   两个相邻填涂块中间点间的有效距离:", total_blank_dist_effect)
    # global mean_W_itemize是 空白距离+平均填涂区域的宽度
    global_mean_w_itemize = (
        sum(total_blank_dist_effect) / len(total_blank_dist_effect)
        if len(total_blank_dist_effect) > 0
        else global_mean_w + 2
    )
    # print(" 419   item间的平均距离是global_mean_w_itemize： ", global_mean_w_itemize)
    blank_x = global_mean_w_itemize - global_mean_w
    return global_mean_w_itemize, blank_x


# 统计平均垂直间隔
def calculate_mean_vertical_dist(rect_dic, global_mean_h):
    total_blank_dist_effect = []
    for k, v in rect_dic.items():
        lst = sorted([rect[1] + 0.5 * rect[3] for rect in v])
        # print('441  小涂抹格的中间位置升序排列 lst', lst)
        effect_pos = [lst[0]]  # 可以加入列表的中间点位置，有效位置
        blank_dist_effect = []  # 有效位置之间的距离
        for i in range(1, len(lst)):
            dist = lst[i] - effect_pos[-1]
            if dist > global_mean_h * 0.9 and dist < 2.5 * global_mean_h:
                blank_dist_effect.append(dist)
                effect_pos.append(lst[i])
        total_blank_dist_effect += blank_dist_effect.copy()

    # print(" 419   两个垂直相邻填涂块中间点间的有效距离:", total_blank_dist_effect)
    # global mean_h_itemize是 空白距离+平均填涂区域的宽度
    global_mean_h_itemize = (
        sum(total_blank_dist_effect) / len(total_blank_dist_effect)
        if len(total_blank_dist_effect) > 0
        else global_mean_h + 2
    )
    # print(
    #     " 444   item间的垂直平均距离global_mean_h_itemize是： ", global_mean_h_itemize
    # )
    blank_y = global_mean_h_itemize - global_mean_h
    return global_mean_h_itemize, blank_y


def main_recognize_examinee_id(box, ori_img_path):
    """
    使用模型识别并处理扫描答题卡中的考号填涂区域。

    参数：
    box：包含填涂区域框坐标[x1,y1,x2,y2]。
    ori_img_path：原始答题卡图像路径。

    返回值：
    抽取出的考生编号，并在指定目录下保存处理后的图像和识别结果。
    """
    model_ = Read_XZT_Model(debug=False)
    img_draw = cv2.imread(ori_img_path)

    # print("472 进入考生号区域，分割的大的区域 box, 原图尺寸cv2.imread", box, img_draw.shape)

    rect = box
    final_small_rectanges, global_mean_w, global_mean_h = (
        stat_graphical_small_rect_dimension(
            rect, ori_img=img_draw, col_id=1, read_xzt_model=model_
        )
    )

    # final_small_rectanges = sorted(
    #     final_small_rectanges, key=functools.cmp_to_key(Read_XZT_Model._cmp_rect_r1)
    # )

    # print("474  全局小涂抹格的平均高度和宽度分别是： ", global_mean_h, global_mean_w)
    rect_dic = {}
    x1, y1, x2, y2 = rect
    rect_dic[(1, 1, x1, y1, x2, y2)] = final_small_rectanges
    # 统计平均水平间隔
    global_mean_w_itemize, blank_x = calculate_mean_horizontal_dist(
        rect_dic, global_mean_w
    )
    # print(
    #     " 497   空白位置的平均距离 blank_x和平均水平间隔global_mean_w_itemize： ",
    #     blank_x,
    #     global_mean_w_itemize,
    # )
    # 统计平均垂直间隔
    global_mean_h_itemize, blank_y = calculate_mean_vertical_dist(
        rect_dic, global_mean_h
    )
    # print(
    #     " 504   空白位置的平均距离是 blank_y和平均垂直间隔global_mean_h_itemize： ",
    #     blank_y,
    #     global_mean_h_itemize,
    # )

    # print("509  检查rect_dic: ", rect_dic)
    question_id = 0
    examinee_id_response = []
    for k, v in rect_dic.items():
        idx, idy, x1, y1, x2, y2 = k

        column_num = round((x2 - x1 + blank_x) / global_mean_w_itemize)
        real_item_gap = (x2 - x1 + blank_x) / column_num
        # print(
        #     "520 填涂的个数是：column_num ",
        #     column_num,
        # )

        for i in range(column_num):
            question_id += 1

            for rect in v:
                x, y, w, h = rect
                middle_point_horizontal = x + 0.5 * w
                # print(
                #     "523, middle_point_vertical, idy,   upper, lower, rect:",
                #     middle_point_horizontal,
                #     idy,
                #     int(i * real_item_gap),
                #     int((i + 1) * real_item_gap),
                #     rect,
                # )
                if (
                    middle_point_horizontal >= i * real_item_gap
                    and middle_point_horizontal < (i + 1) * real_item_gap
                ):
                    answer_nums = round(
                        (y2 - y1 + blank_y) / (global_mean_h_itemize)
                    )  # 加上blank_y，是因为最上最下的item的空白区各被截了0.5*blank_y
                    if answer_nums != 10:  # 考号的每个数字永远都是从10个选一个.
                        print(
                            "532 Warning: 计算不正确，选项不是10个，而是： ",
                            answer_nums,
                        )
                    interval = [y1 - 0.5 * blank_y, y2 + 0.5 * blank_y]
                    middle_point_vertical = y1 + rect[1] + 0.5 * rect[3]
                    id_y = find_answer_in_subinterval(
                        interval, middle_point_vertical, answer_nums
                    )
                    real_id = id_y - 1
                    if real_id < 0:
                        print(
                            "363 warning: 无法识别该填涂项是第几个数字, ans_num和该填涂块rect分别是：",
                            question_id,
                            rect,
                        )
                        continue
                    examinee_id_response.append(real_id)

                    x_new = x1 + x
                    y_new = y1 + y
                    cv2.rectangle(
                        img_draw,
                        (int(x_new), int(y_new)),
                        (int(w + x_new), int(h + y_new)),
                        (255, 0, 255),
                        2,
                    )
                    cv2.putText(
                        img_draw,
                        str(question_id) + "_" + str(id_y),
                        (int(x_new), int(y_new)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (255, 0, 0),
                        1,
                    )
                    cv2.imwrite(
                        f"/data/alan/OCRAutoScore/debug/image_process_steps_learn/1_id{question_id}.png",
                        img_draw,
                    )
        cv2.rectangle(
            img_draw, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 255), 2
        )
    # cv2.imwrite("/Users/wangmeng/Desktop/speaker-diarization-3.1/3.png", img_draw)
    cv2.imwrite("/data/alan/OCRAutoScore/debug/1_process.png", img_draw)
    return examinee_id_response


def test_main_recognize_scantron_by_examniee():

    img_path = (
        # "/Users/wangmeng/Desktop/speaker-diarization-3.1/img1/8894_19290060_1.jpg"
        "/data/alan/OCRAutoScore/debug/8894_19290429_1.png"
    )
    # img_path = "/data/alan/OCRAutoScore/example_img/1.jpg"
    img_path = "/data/alan/OCRAutoScore/example_img/62691a5a29ac300b8b92ad7f-0182200133-20221017164016-20220427174311_046.jpg"

    ori_img = cv2.imread(img_path)
    model = Score_XZT_Model()
    # img = model.scale_image(ori_img) # type: ignore
    boxes, _ = model.detect_major_sections_with_yolo(
        ori_img, conf_threshold=0.25
    )  # 设置置信度阈值

    ans = main_recognize_scantron_by_examinee(boxes, img_path)
    print("497 最后的选择题结果是：", ans)


if __name__ == "__main__":
    test_main_recognize_scantron_by_examniee()


# def beta(img):
#     alpha = 1
#     beta = 100
#     # 灰度图
#     dst = img * alpha + beta
#     # 彩图
#     for i in range(rows):
#         for j in range(cols):
#             for c in range(3):
#                 dst = img[i, j][c] * alpha + beta
#     return dst


# def fun11():
#     path1 = "/Users/wangmeng/Desktop/1/"
#     path2 = "/Users/wangmeng/Desktop/2/"
#     files = os.listdir(path1)
#     for i in range(2):
#         img = cv2.imread(path1 + files[i])
#         dst1 = beta(img)
#         print("dst1:", dst1.shape)
#         cv2.imwrite(path2 + "1_" + files[i], dst1)

# def __cmp_rect_r1(a, b):
#     cax = (a[0] + a[2]) / 2
#     cay = (a[1] + a[3]) / 2
#     cbx = (b[0] + b[2]) / 2
#     cby = (b[1] + b[3]) / 2
#     ha = a[3] - a[1]
#     hb = b[3] - b[1]
#     minh = min(ha, hb)

#     if (a[2] < b[0] and abs(cby - cay) < (minh / 6)) or a[3] < b[1]:
#         return -1
#     elif abs(a[1] - b[1]) < 5 and abs(a[0] - b[0]) < 5:
#         return 0
#     else:
#         return 1

# @staticmethod
# def __cmp_rect(a, b):
#     if (abs(a[1] - b[1]) < 10 and a[0] > b[0]) or a[1] > b[1]:
#         return -1
#     elif abs(a[1] - b[1]) < 10 and abs(a[0] - b[0]) < 20:
#         return 0
#     else:
#         return 1

# def process_img(self, img):
#     self.__preProcessing_img(img)
#     binary = self.__preProcessing_img(img)
#     horizon = self.__detectLines(binary)
#     self.__contourExtraction(horizon)
#     result = self.__segmentation()
#     self.rects.clear()

#     self.img = None
#     return result

# def __preProcessing_img(self, img):  # 图片预处理，输出二值图
#     self.img = img
#     gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#     blur = cv2.GaussianBlur(gray, (5, 5), 1.5)
#     _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
#     thresh, binary = cv2.threshold(blur, int(_ * 0.95), 255, cv2.THRESH_BINARY)
#     return binary

# def __segmentation(self):  # 分割
#     if self.debug:  # debug模式只标记不分割

#         if not os.path.exists("debug"):
#             os.mkdir("debug")

#         for idx, rect in enumerate(self.rects):
#             x, y, w, h = rect
#         # x_new=x1+x
#         # y_new=y1+y

#         # cv2.rectangle(self.img, (x_new, y_new), (w + x_new, h + y_new), (255, 0, 255), 2)
#         # cv2.putText(self.img, str(idx + 1), (x_new, y_new + 5), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 255), 2)
#     # print('self.img:',self.img.shape)
#     # cv2.imwrite('./debug/{}.png'.format(self.name), self.img)
#     else:
#         # if not os.path.exists('res'):
#         #     os.mkdir('res')
#         for idx, rect in enumerate(self.rects):
#             x, y, w, h = rect
#             crop_img = self.img[y : y + h, x : x + w]
#             crop_img = crop_img.copy()
#             self.crop_img.append(crop_img)
#             # cv2.imwrite('./res/{}-{}.png'.format(self.name, idx + 1), crop_img)
#         return self.crop_img

# @staticmethod
# def _cmp_rect_r(a, b):
#     if (abs(a[1] - b[1]) < 5 and a[0] < b[0]) or a[1] > b[1]:
#         return -1
#     elif abs(a[1] - b[1]) < 5 and abs(a[0] - b[0]) < 5:
#         return 0
#     else:
#         return 1

# @staticmethod
# def _cmp_rect_y(a, b):
#     if a[1] + a[3] < b[1]:
#         return -1
#     else:
#         return 1

# @staticmethod
# def _cmp_rect_x(a, b):
#     if a[0] + a[2] < b[0]:
#         return -1
#     else:
#         return 1
