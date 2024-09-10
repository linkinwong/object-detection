from ultralytics import YOLO

# Load a model
#model = YOLO("yolov8m.yaml")  # build a new model from YAML
#model = YOLO("yolov8n.pt")  # load a pretrained model (recommended for training)
model = YOLO("./runs/detect/train10/weights/best.pt")
metrics = model.val()
#print('metrics11:',metrics)
# Train the model
#results = model.train(data="coco8.yaml", epochs=1000, imgsz=1280)
