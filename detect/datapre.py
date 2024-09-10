import os
import random
import shutil
import zipfile
import glob

import cv2

this_py_file_dir=os.path.dirname(os.path.abspath(__file__))
os.chdir(this_py_file_dir)

class ProcessConfig:
    def __init__(self):
        self.app = {
            "debug": True,
            "log_level": "info"
        }
        self.select_jobs={
            'lower' : 44,  # 选取标注数据，从job id 44开始，44之前的小题标注有问题
            'upper' : 60,
            'labels': [0,1,2,3,4,5,6,7,8],  #如果标注的类别不在这些里面，该条标注会被删除  
        }
        self.paths={
            "jobs" : './jobs',  # cvat标注的数据
            "tmp" : './tmp',   #处理的中间过程数据，该文件夹最后会被删除
            'dataset' : './dataset', #处理好的文件放入这里面, 分为images和labels两个文件夹，每个文件夹下同名文件，代表其对应数据和标签
            'train_folder_name' : 'train_cvat_jobs_44_60', #
            'val_folder_name' : 'val_cvat_jobs_44_60', #
            'test_folder_name' : 'test_cvat_jobs_44_60', #
        }

    def is_debug(self):
        return self.app["debug"]


pc = ProcessConfig()

def mk_tmp_dir_and_unzip_and_move():
    jobs = pc.paths['jobs']
    tmp = pc.paths['tmp']
    tmp_data_all_jobs = tmp + '/data_from_all_jobs'
    # 创建tmp目录，以及其下的收集各个job所有的数据的目录
    os.makedirs(tmp, exist_ok=True)
    os.makedirs(tmp_data_all_jobs, exist_ok=True)
    for folder in os.listdir(jobs):
        if int(folder)<pc.select_jobs['lower'] or int(folder)>pc.select_jobs['upper']:
            continue
        print('38 folder name is:', folder)
        
        # 一个job里面的图片、标签解压到tmp下的同名文件夹里面
        new_job_folder = os.path.join(tmp, folder)
        os.makedirs(new_job_folder, exist_ok=True)
        zip_pattern = jobs+'/'+folder+'/export_cache' + '/dataset_yolo*.ZIP'
        for zip_file in glob.glob(zip_pattern):
            print('49  zip_file=', zip_file)
            with zipfile.ZipFile(zip_file) as zip_ref:
                zip_ref.extractall(new_job_folder)

        path_export_cache = os.path.join(new_job_folder, 'obj_train_data')
        files_in_export_cache = os.listdir(path_export_cache)
        # 去掉标注类别超出范围的行
        # 去掉连1个标注框都没有的图片和标注文本, 把这样的文件名放入set中
        set_names_to_remove = set()
        for file in files_in_export_cache:
            if 'txt' not in file:
                continue
            file_path = os.path.join(path_export_cache,file)
            txt=open(file_path).readlines()
            txt = [t for t in txt if int(t.split()[0]) in pc.select_jobs['labels']]
            if len(txt)==0:
                pure_name = file.split(r'.txt')[0]
                set_names_to_remove.add(pure_name)
            else:  # 删掉不需要的标注类别后的行，替换原文件内容
                with open(file_path, 'w') as f:
                    f.writelines(txt)
        
        print(f"70  job id={folder}, 没标注:有标注 = {len(set_names_to_remove)}: {int(len(files_in_export_cache)/2) - len(set_names_to_remove)}")
        # 解压后的文件改名字, 同时移到 tmp_data_all_jobs 文件夹里面， 如目标文件夹有同名，则报警后覆盖 
        for file in files_in_export_cache:
            if file.split(r'.')[0] in set_names_to_remove and pc.is_debug:
                # print(f"Debug：warning 文件 {new_file_path} 没有任何标注，丢弃。")
                continue
            new_file_name = f"job_{folder}_{file}"
            old_file_path = os.path.join(path_export_cache, file)
            new_file_path = os.path.join(tmp_data_all_jobs, new_file_name)
            if os.path.exists(new_file_path) and pc.is_debug:
                # print(f"debug：警告：目标文件 {new_file_path} 已存在，将被覆盖")
                pass
            os.rename(old_file_path, new_file_path)

            
#划分训练集和测试， 并且移入dataset 里面对应的文件夹里面
def split_train_val():
    
    folder_tmp_data_all_jobs = pc.paths['tmp'] + '/data_from_all_jobs'
    files=os.listdir(folder_tmp_data_all_jobs)

    # 根据纯文件名建立两个字典，value分别为图片，和文本
    img_dict, txt_dict = {},{}
    for file in files:
        pure_name,ext_name = file.split(r'.')
        if ext_name == 'jpg':
            img_dict[pure_name] = file
        elif ext_name == 'txt':
            txt_dict[pure_name] = file
        else:
            print('100 Error: unknown file extention of file =', file)
    
    keys = list(txt_dict.keys())
    random.shuffle(keys)

    train_ratio, test_ratio, val_ratio = (7,2,1)
    total_ratio = train_ratio + test_ratio + val_ratio

    train_keys = keys[:int(len(keys) * train_ratio / total_ratio)]
    test_keys = keys[int(len(keys) * train_ratio / total_ratio): int(len(keys) * (train_ratio + test_ratio) / total_ratio)]
    val_keys = keys[int(len(keys) * (train_ratio + test_ratio) / total_ratio):]

    iterate = ((train_keys, 'train'),(test_keys, 'test'),(val_keys,'val'))
    for i_keys, st in iterate:
    # 图片和标签分别移动到各自的train文件夹
        image = os.path.join (pc.paths['dataset'], 'images', pc.paths[f'{st}_folder_name']) 
        text = os.path.join (pc.paths['dataset'], 'labels', pc.paths[f'{st}_folder_name']) 
        os.makedirs(image, exist_ok=True)
        os.makedirs(text, exist_ok=True)
        for key in i_keys:
            shutil.copy(folder_tmp_data_all_jobs+'/'+img_dict[key], image)
            shutil.copy(folder_tmp_data_all_jobs+'/'+txt_dict[key], text)

if __name__ == "__main__":
    mk_tmp_dir_and_unzip_and_move()
    # split_train_val()







# #标注数据验证
# def eval_label():
#     path1='/Users/wangmeng/Desktop/train/1/train/'
#     path2='/Users/wangmeng/Desktop/image/切题/0724_1/'
#     path3='/Users/wangmeng/Desktop/train/1/result/'
#     files=os.listdir(path1)
#     font = cv2.FONT_HERSHEY_SIMPLEX
#     font_scale = 1
#     text_color = (255, 255, 255)
#     line_type = 2

#     for i in range(4):
#         txt=open(path1+files[i]).readlines()
#         if len(txt)==0:
#             continue
#         else:
#             print(txt)
#             img=cv2.imread(path2+files[i].split('.')[0]+'.jpg')
#             img_h,img_w,_=img.shape
#             for j in range(len(txt)):
#                 label,x,y,w,h=txt[j].strip().split(' ')
#                 w1=(float(w)*img_w)/2.
#                 h1=(float(h)*img_h)/2.
#                 x1=int(float(x)*img_w-w1)
#                 x2=int(float(x)*img_w+w1)
#                 y1=int(float(y)*img_h-h1)
#                 y2=int(float(y)*img_h+h1)
#                 cv2.rectangle(img, (x1,y1), (x2,y2), (255, 0, 0), 2)
#                 print('img:',img.shape)

#                 cv2.putText(img, label, (x1, y1), cv2.FONT_HERSHEY_COMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
#             cv2.imwrite(path3+files[i].split('.')[0]+'.jpg',img)
#             return