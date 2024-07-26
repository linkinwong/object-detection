from ultralytics import YOLO

# Load a model
model = YOLO("yolov8m.yaml")  # build a new model from YAML
#model = YOLO("yolov8n.pt")  # load a pretrained model (recommended for training)


# Train the model
results = model.train(data="coco8.yaml", epochs=100, imgsz=640)