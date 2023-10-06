import subprocess
import os
import imageio_ffmpeg as ffmpeg

def ensure_dir_exists(path):
    """Ensure that the directory a file is going to be written to exists, if not, create it."""
    dir_name = os.path.dirname(path)
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)

def process_video(input_file, output_file, width, height):
    """
    Scale video to a specified resolution using imageio_ffmpeg.
    """
    input_file = os.path.abspath(input_file)
    output_file = os.path.abspath(output_file)
    ensure_dir_exists(output_file)

    # Using subprocess.run with a list of arguments
    command = [
        ffmpeg.get_ffmpeg_exe(), 
        "-i", input_file, 
        "-vf", f"scale={width}:{height}", 
        output_file
    ]
    print(f"Running: {' '.join(command)}")
    subprocess.run(command)

# Define file paths and resolutions
input_file = "7286092206266404098_undefined.mp4"
input_path = f"downloads/{input_file}"
downscaled_file = f"change_resolution_videos/1st_down_scale/{input_file}"
upscaled_file = f"change_resolution_videos/second_up_scale/{input_file}"

# Downscale from 1920x1080 to 1280x720
process_video(input_path, downscaled_file, 854, 480)

# Upscale back from 1280x720 to 1920x1080
process_video(downscaled_file, upscaled_file, 1920, 1080)
