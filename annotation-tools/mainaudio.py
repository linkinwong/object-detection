from pydub import AudioSegment
import ffmpeg
import os

class AudioReader:
    def __init__(self, source_path):
        self.audio = AudioSegment.from_file(source_path)
        self.source_path = source_path
        self.frame_rate = self.audio.frame_rate

    def get_total_frames(self):
        return len(self.audio.get_array_of_samples())

    def get_frame_rate(self):
        return self.frame_rate

    def get_duration(self):
        return self.audio.duration_seconds

class Mpeg3ChunkWriter:
    def __init__(self, quality=5):
        self._quality = quality

    def save_as_chunk(self, input_path, start_time, duration, chunk_path):
        ext = os.path.splitext(chunk_path)[1][1:]
        if ext == 'mp3':
            acodec = 'libmp3lame'
        elif ext == 'wav':
            acodec = 'pcm_s16le'
        elif ext == 'aac':
            acodec = 'aac'
        elif ext == 'flac':
            acodec = 'flac'
        elif ext == 'ogg':
            acodec = 'libvorbis'
        elif ext == 'aiff':
            acodec = 'pcm_s16le'
        elif ext == 'wma':
            acodec = 'wmav2'
        else:
            raise ValueError(f"Unsupported audio format: {ext}")

        print(f"Saving chunk: start_time={start_time}, duration={duration}, chunk_path={chunk_path}")
        (
            ffmpeg
            .input(input_path, ss=start_time, t=duration)
            .output(chunk_path, acodec=acodec, audio_bitrate=f'{self._quality}k')
            .global_args('-loglevel', 'error', '-y')  # Suppress output and overwrite files
            .run()
        )

class Mpeg3CompressedChunkWriter(Mpeg3ChunkWriter):
    def __init__(self, quality=5):
        super().__init__(quality)

    def save_as_chunk(self, input_path, start_time, duration, chunk_path):
        super().save_as_chunk(input_path, start_time, duration, chunk_path)

def process_audio_by_frames(input_path, output_dir, frames_per_chunk):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    reader = AudioReader(input_path)
    chunk_writer = Mpeg3CompressedChunkWriter(quality=128)  # 128 kbps

    total_frames = reader.get_total_frames()
    frame_rate = reader.get_frame_rate()
    total_duration = reader.get_duration()
    chunk_index = 0
    start_frame = 0
    ext = os.path.splitext(input_path)[1]  # 获取输入文件的扩展名

    while start_frame < total_frames:
        end_frame = min(start_frame + frames_per_chunk, total_frames)
        start_time = start_frame / frame_rate
        duration = (end_frame - start_frame) / frame_rate

        # 如果 start_time 或 duration 超出音频文件的总时长，则调整duration
        if start_time + duration > total_duration:
            duration = total_duration - start_time

        # 避免生成负的 duration
        if duration <= 0:
            print(f'Audio file can not  split into {chunk_index} chunks. duration= {duration}')

            break

        chunk_path = os.path.join(output_dir, f'chunk_{chunk_index}{ext}')  # 使用输入文件的扩展名
        chunk_writer.save_as_chunk(input_path, start_time, duration, chunk_path)
        
        start_frame = end_frame
        chunk_index += 1

    print(f'Audio file has been split into {chunk_index} chunks.')

# 使用示例
input_mp3 = '/Users/pingzhang/Downloads/asr_speaker_demo.wav'
output_directory = '/Users/pingzhang/Downloads/audio'

# 计算frames_per_chunk
reader = AudioReader(input_mp3)
duration_seconds = 10  # 每个chunk的持续时间（秒）
frames_per_chunk = int(reader.get_frame_rate() * duration_seconds)

process_audio_by_frames(input_mp3, output_directory, frames_per_chunk)