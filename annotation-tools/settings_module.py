import os
import django
import multiprocessing as mp
from rq import Connection, Worker

def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cvat.settings.development")
    django.setup()

    with Connection():
        qs = ["import"]
        w = Worker(qs)
        w.work()

if __name__ == "__main__":
    os.environ["DJANGO_SETTINGS_MODULE"] = "cvat.settings.development"
    mp.set_start_method("forkserver")
    main()
