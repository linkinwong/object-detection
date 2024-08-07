from ultralytics import YOLOv10
# Load a model
model = YOLOv10("yolov10m.pt")  # build a new model from YAML
  # load a pretrained model (recommended for training)


# Train the model
results = model.train(data="coco8.yaml", epochs=1000, imgsz=640,device=[0, 1,2,3,4,5,6,7])
