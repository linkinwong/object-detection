import os
import random
import shutil

import cv2
#标注数据验证
def eval_label():
    path1='/Users/wangmeng/Desktop/train/1/train/'
    path2='/Users/wangmeng/Desktop/image/切题/0724_1/'
    path3='/Users/wangmeng/Desktop/train/1/result/'
    files=os.listdir(path1)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 1
    text_color = (255, 255, 255)
    line_type = 2

    for i in range(4):
        txt=open(path1+files[i]).readlines()
        if len(txt)==0:
            continue
        else:
            print(txt)
            img=cv2.imread(path2+files[i].split('.')[0]+'.jpg')
            img_h,img_w,_=img.shape
            for j in range(len(txt)):
                label,x,y,w,h=txt[j].strip().split(' ')
                w1=(float(w)*img_w)/2.
                h1=(float(h)*img_h)/2.
                x1=int(float(x)*img_w-w1)
                x2=int(float(x)*img_w+w1)
                y1=int(float(y)*img_h-h1)
                y2=int(float(y)*img_h+h1)
                cv2.rectangle(img, (x1,y1), (x2,y2), (255, 0, 0), 2)
                print('img:',img.shape)

                cv2.putText(img, label, (x1, y1), cv2.FONT_HERSHEY_COMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
            cv2.imwrite(path3+files[i].split('.')[0]+'.jpg',img)
            return
#划分训练集和测试
def split_train_val():
    path_label = '/Users/wangmeng/Desktop/train/1/train1/'
    path_img = '/Users/wangmeng/Desktop/image/切题/0724/'
    path_train_img='/Users/wangmeng/Desktop/train/images/train/'
    path_val_img = '/Users/wangmeng/Desktop/train/images/val/'
    path_train_label='/Users/wangmeng/Desktop/train/labels/train/'
    path_val_label = '/Users/wangmeng/Desktop/train/labels/val/'
    files=os.listdir(path_label)
    random.shuffle(files)
    t=int(len(files)*0.1)
    for i in range(len(files)):
        if 'txt' not in files[i]:
            continue
        img_name=files[i].split('.')[0]+'.jpg'
        if i<t:
            shutil.copy(path_label+files[i],path_val_label+files[i])
            shutil.copy(path_img+img_name,path_val_img+img_name)
        else:
            shutil.copy(path_label+files[i],path_train_label+files[i])
            shutil.copy(path_img+img_name,path_train_img+img_name)
def del_label():
    path_label = '/Users/wangmeng/Desktop/train/1/train1/'
    files=os.listdir(path_label)
    for i in range(len(files)):
        if 'txt' not in files[i]:
            continue
        txt=open(path_label+files[i]).readlines()
        if len(txt)==0:
            os.remove(path_label+files[i])


if __name__ == "__main__":
    split_train_val()


