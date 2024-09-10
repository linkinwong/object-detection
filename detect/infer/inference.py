import onnxruntime
from utils import yaml_load,preprocess,postprocess,draw_detections
import os
import numpy as np
import cv2
import functools
from paddleocr import PaddleOCR
model_ch  = PaddleOCR(use_angle_cls=True, lang="ch")
def __cmp_rect_r(a, b):
    cax=a[0] + (a[2]) / 2.
    cay = a[1] + (a[3]) / 2.
    cbx=b[0] + (b[2]) / 2.
    cby = b[1] + (b[3]) / 2.
  

    if (a[0]+a[2])<cbx or (cay<cby and (b[0]+b[2])>a[0]):
      return -1
  
    else:
      return 1
def ocr(img,box):
    x0,y0,w0,h0=box
    x1=x0+w0
    y1=y0+h0
    dst=img[int(y0):int(y1),int(x0):int(x1)]

    result = model_ch(dst, cls=True)
      
   
    return result[1]
 
def crop_examination_paper(input_image,boxes,scores,class_ids):
  
    img=cv2.imread(input_image)
    save_path='/Users/wangmeng/Desktop/inter/result/'
    class_dic={0:'title',1:'Qnum_1',2:'QStem',3:'img',4:'QStem_tmp',5:'img_num',6:'score',7:'Qnum_2',8:'Qnum_3'}
   
    img=cv2.imread(input_image)
    dics={'title':[],'QStem':[],'QStem_tmp':[],'Qnum_1':[],'Qnum_2':[],'Qnum_3':[],'img':[],'img_num':[],'score':[]}
    for i in range(len(class_ids)):
      
        dics[class_dic[class_ids[i]]].append(boxes[i])
    #建立图片题号和图片框之间的映射
    num2box_dic={}
    for i in range(len(dics['img_num'])):
        box=dics['img_num'][i]
        cx_t=box[0]+box[2]/2.
        cy_t=box[1]+box[3]/2.
        result=ocr(img,box)
       
        if len(result)>0:
            num_val=int(result[0][0].split('第',1)[-1].split('题',1)[0])
            for box1 in dics['img']:
                x0_t,y0_t,w0_t,h0_t=box1
                #标题框在图片框内，或者在图片框下方
                if cx_t>x0_t and cx_t<(x0_t+w0_t) and ((cy_t>y0_t and cy_t<(y0_t+h0_t)) or (cy_t>(y0_t+h0_t) and cy_t<(y0_t+2*h0_t))):
                    num2box_dic[num_val]=box1
   
   
    #拿出题干和子题
    ranges=dics['QStem']+dics['QStem_tmp']
    #对题干和子题排序
    sorted_rectangles =sorted(ranges, key=functools.cmp_to_key(__cmp_rect_r))
   # t=0
   # for box in sorted_rectangles:
   #     x1, y1, w, h = box
   #     cx=int(x1+w/2.)
   #     cy=int(y1+h/2.)
   
   #     cv2.rectangle(img, (int(x1), int(y1)), (int(x1 + w), int(y1 + h)), (0,255,0), 2)

   


     
   

    #    cv2.putText(img, str(t), (cx, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2, cv2.LINE_AA) 
    #    t+=1
    #cv2.imwrite(input_image.split('.',1)[0]+'_99'+'.jpg',img)
    #print(input_image.split('.',1)[0]+'_1.jpg')
    #return
    #为每个框分配提号
    range_info=[]
    for box in sorted_rectangles:
        
        tmp={'Qnum_1':[],'Qnum_2':[],'Qnum_3':[]}
        if len(dics['Qnum_1'])!=0:
            for box_tmp in dics['Qnum_1']:
                cx=box_tmp[0]+box_tmp[2]/2.
                cy=box_tmp[1]+box_tmp[3]/2.
                if cx>box[0] and cx<(box[0]+box[2]) and cy>box[1] and cy<(box[1]+box[3]):
                    tmp['Qnum_1'].append(box_tmp)
        elif len(dics['Qnum_2'])!=0:
            for box_tmp in dics['Qnum_2']:
                cx=box_tmp[0]+box_tmp[2]/2.
                cy=box_tmp[1]+box_tmp[3]/2.
                if cx>box[0] and cx<(box[0]+box[2]) and cy>box[1] and cy<(box[1]+box[3]):
                    tmp['Qnum_2'].append(box_tmp)  
        elif len(dics['Qnum_3'])!=0:
            for box_tmp in dics['Qnum_3']:
                cx=box_tmp[0]+box_tmp[2]/2.
                cy=box_tmp[1]+box_tmp[3]/2.
                if cx>box[0] and cx<(box[0]+box[2]) and cy>box[1] and cy<(box[1]+box[3]):
                    tmp['Qnum_3'].append(box_tmp)   
        range_info.append(tmp)
   
    for i in range(len(sorted_rectangles)):
        box=sorted_rectangles[i]
        x0,y0,w,h=box
        
        x1=x0+w
        y1=y0+h
        x0,y0,x1,y1=int(x0),int(y0),int(x1),int(y1)
        info=range_info[i]
       # info_next=range_info[i+1]
        #创建一张空白图像
        #临时题号
        tmp_num=-1
        #判断第一个框是不是子题
        if i==0 and len(info['Qnum_1'])==0:
            #如果第一个框是子题，第一个框没有题号，采用下个框获取当前框题号
            result_ocr=ocr(img,range_info[i+1]['Qnum_1'][0])
            if len(result_ocr)>0:
                tmp_num=int(float(result_ocr[0][0]))-1
         
            blank_img=np.ones(img.shape,np.uint8)*255
            blank_img[y0:y1,x0:x1]=img[y0:y1,x0:x1]
            #获取图片框
            if tmp_num in num2box_dic.keys():
                bx,by,bw,bh=num2box_dic[int(tmp_num)]
                bx1=bx+bw
                by1=by+bh
                blank_img[by:by1,bx:bx1]=img[by:by1,bx:bx1]
            cv2.imwrite(input_image.split('.',1)[0]+'_'+str(i)+'.jpg',blank_img)

        elif len(info['Qnum_1'])!=0:
          
            result_ocr=ocr(img,info['Qnum_1'][0])
            if len(result_ocr)>0:
                tmp_num=int(float(result_ocr[0][0]))
            blank_img=np.ones(img.shape,np.uint8)*255
            blank_img[y0:y1,x0:x1]=img[y0:y1,x0:x1]
            if i!=len(sorted_rectangles)-1:
                info_next=range_info[i+1]
                if len(info_next['Qnum_1'])==0:
                    box_next=sorted_rectangles[i+1]
                    x0_next,y0_next,w_next,h_next=box_next
        
                    x1_next=x0_next+w_next
                    y1_next=y0_next+h_next
                    x0_next,y0_next,x1_next,y1_next=int(x0_next),int(y0_next),int(x1_next),int(y1_next)
                    blank_img[y0_next:y1_next,x0_next:x1_next]=img[y0_next:y1_next,x0_next:x1_next]
            if tmp_num in num2box_dic.keys():
                bx,by,bw,bh=num2box_dic[int(tmp_num)]
                bx1=bx+bw
                by1=by+bh
                blank_img[by:by1,bx:bx1]=img[by:by1,bx:bx1]
            cv2.imwrite(input_image.split('.',1)[0]+'_'+str(i)+'.jpg',blank_img)
        print('i:',i)
        print('tmp_num:',tmp_num)

    

def inter_fun():
    classes = yaml_load("/Users/wangmeng/Downloads/model/ultralytics-main/ultralytics/cfg/datasets/coco8.yaml")["names"]
    onnx_model='best.onnx'
    session = onnxruntime.InferenceSession(onnx_model, providers=["CPUExecutionProvider"])
    model_inputs = session.get_inputs()
    input_shape = model_inputs[0].shape
    input_width = input_shape[2]
    input_height = input_shape[3]
    img_path='./'
    conf_thres=0.25
    iou_thres=0.7
   
    color_palette = np.random.uniform(0, 255, size=(len(classes), 3))
    for img_path_ in os.listdir(img_path):
        if img_path_ !='11.jpg':
            continue
        input_image=img_path+img_path_
        img_data,img_height, img_width =preprocess(input_image,input_width,input_height)
        outputs = session.run(None, {model_inputs[0].name: img_data})
        x_factor = img_width / input_width
        y_factor = img_height / input_height
        boxes,scores,class_ids=postprocess(outputs,x_factor,y_factor,confidence_thres=conf_thres,iou_thres=iou_thres) 
        crop_examination_paper(input_image,boxes,scores,class_ids)
       # img=cv2.imread(input_image)
        #for i in indices:
            #box = boxes[i]
            #score = scores[i]
            #class_id = class_ids[i]
          #  draw_detections(img, box, score, classes[class_id],color_palette[class_id])
       # cv2.imwrite('/Users/wangmeng/Desktop/inter/result/'+img_path_,img)
if __name__ == "__main__":
    inter_fun()
