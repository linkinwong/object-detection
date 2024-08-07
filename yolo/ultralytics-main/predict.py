from ultralytics import YOLO
import os
# Load a model
#model = YOLO("yolov8m.yaml")  # build a new model from YAML
#model = YOLO("yolov8n.pt")  # load a pretrained model (recommended for training)
model = YOLO("./runs/detect/train7/weights/best.pt")
path1='/data/wm/detect/dataset/images/val/'
files=os.listdir(path1)
lists=[]
for names in files:
    if 'jpg' not in names:
        continue
    model.predict(path1+names, line_width=1,save=True, imgsz=1280, conf=0.5)
