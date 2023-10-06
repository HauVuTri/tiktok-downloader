import os
import subprocess
import random


cwd = os.getcwd()
username = "@fusion_mage"
# Combine CWD with the relative paths
source_directory = os.path.join(cwd, f'downloads\\{username}')
output_directory = os.path.join(cwd, f'export\\{username}')

# Your LUT file path
lut_file_path = os.path.join(cwd, 'path_to_your_lut.cube')

# Check if output directory exists, if not, create it
if not os.path.exists(output_directory):
    os.makedirs(output_directory)

# Your LUT file path
lut_file_path = './Luts/TL_R709_V2.cube'


def random_volume_curve(input_file, temp_file):
    # Split the video into small segments, e.g., 10 seconds
    segment_duration = 10

    # Get the duration of the video
    cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1', input_file]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    total_duration = float(result.stdout.strip().split('=')[1])

    # For each segment, apply random volume
    segments = []
    for start_time in range(0, int(total_duration), segment_duration):
        segment_file = f"temp_{start_time}.mp4"
        segments.append(segment_file)

        volume_multiplier = random.uniform(0.5, 1.5)  # random volume between 50% and 150%

        cmd = [
            'ffmpeg', '-y',  # overwrite temporary files
            '-ss', str(start_time),
            '-t', str(segment_duration),
            '-i', input_file,
            '-af', f'volume={volume_multiplier}',
            '-an',  # no audio for video processing
            '-vf', f'scale=iw*1.2:-1,lut3d={lut_file_path}',  # Modified the scale command
            segment_file
        ]
        subprocess.run(cmd)

    # Concatenate segments back together using a different method
    # Check if all segment files were created successfully
    if not all(os.path.exists(segment) for segment in segments):
        raise Exception("Some segments were not generated correctly.")

    with open('filelist.txt', 'w') as f:
        for segment in segments:
            f.write(f"file '{segment}'\n")

    cmd = ['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', 'filelist.txt', '-c', 'copy', temp_file]
    subprocess.run(cmd)

    # Cleanup temporary segment files and filelist.txt
    for segment in segments:
        if os.path.exists(segment):
            os.remove(segment)
    if os.path.exists('filelist.txt'):
        os.remove('filelist.txt')
# Loop through each file in the source directory
for filename in os.listdir(source_directory):
    if filename.endswith(('.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv')):
        # Define source and destination paths
        source_path = os.path.join(source_directory, filename)
        output_path = os.path.join(output_directory, filename)
        used_output_path = os.path.join(output_directory,"used", filename)
        # Skip processing if the file already exists in the output directory
        if os.path.exists(output_path) or os.path.exists(used_output_path):
            print(f"Skipping {filename} as it has already been exported.")
            continue
        
        temp_output_path = os.path.join(output_directory, "temp_" + filename)

        # Apply random volume curve and video filter
        random_volume_curve(source_path, temp_output_path)

        # Now, copy the audio from temp_output_path to output_path
        cmd = [
            'ffmpeg',
            '-i', temp_output_path,
            '-i', source_path,
            '-vf', "scale=iw*1.2:ih*1.2,crop=iw/1.2:ih/1.2", 
            '-c:v', 'libx264',  # Encoding video
            '-c:a', 'aac',  # Encoding audio
            '-map', '0:v:0',  # video from temp file
            '-map', '1:a:0',  # audio from source file
            output_path
        ]
        subprocess.run(cmd)
        
        # Cleanup the temporary output file
        os.remove(temp_output_path)

print("Processing completed.")