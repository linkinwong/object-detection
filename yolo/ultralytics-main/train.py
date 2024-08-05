from ultralytics import YOLO
# Load a model
model = YOLO("yolov8m.yaml")  # build a new model from YAML
  # load a pretrained model (recommended for training)


# Train the model
results = model.train(data="coco8.yaml", epochs=1000, imgsz=640,device=[0, 1,2,3,4,5,6,7])
