"""
Sprite Sheet Trimmer
Removes transparent space from sprite frames and creates optimized spritesheet
"""

from PIL import Image
import os
import json
import sys

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

def get_trim_box(image, alpha_threshold=10):
    """Find the bounding box of non-transparent pixels using manual scan"""
    # Get alpha channel
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    pixels = image.load()
    width, height = image.size

    # Find bounds by scanning for non-transparent pixels
    min_x, min_y = width, height
    max_x, max_y = 0, 0

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > alpha_threshold:  # Not transparent
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y

    # Check if we found any non-transparent pixels
    if max_x >= min_x and max_y >= min_y:
        return (min_x, min_y, max_x + 1, max_y + 1)
    else:
        # Fallback: return full size
        return (0, 0, width, height)

def trim_sprite_frame(frame_image, padding=2, alpha_threshold=5):
    """Trim a single sprite frame and add padding"""
    bbox = get_trim_box(frame_image, alpha_threshold=alpha_threshold)

    # Add padding
    x1 = max(0, bbox[0] - padding)
    y1 = max(0, bbox[1] - padding)
    x2 = min(frame_image.width, bbox[2] + padding)
    y2 = min(frame_image.height, bbox[3] + padding)

    # Crop to bounding box
    trimmed = frame_image.crop((x1, y1, x2, y2))

    return trimmed, (x1, y1, x2 - x1, y2 - y1)

def process_spritesheet(input_path, frame_width, frame_height, output_dir='../assets/images/trimmed'):
    """Process spritesheet and create trimmed version"""

    print(f"📦 Loading spritesheet: {input_path}")
    spritesheet = Image.open(input_path)

    # Calculate number of frames
    num_frames = spritesheet.width // frame_width
    print(f"📊 Found {num_frames} frames ({frame_width}x{frame_height} each)")

    # Extract and trim each frame
    frames = []
    trim_data = []
    max_width = 0
    max_height = 0

    for i in range(num_frames):
        x = i * frame_width
        frame = spritesheet.crop((x, 0, x + frame_width, frame_height))

        trimmed_frame, trim_info = trim_sprite_frame(frame, padding=0, alpha_threshold=5)  # Gentler trim to preserve crown!
        frames.append(trimmed_frame)
        trim_data.append({
            'frame': i,
            'original_x': trim_info[0],
            'original_y': trim_info[1],
            'width': trim_info[2],
            'height': trim_info[3]
        })

        max_width = max(max_width, trim_info[2])
        max_height = max(max_height, trim_info[3])

        print(f"  Frame {i}: {frame_width}x{frame_height} -> {trim_info[2]}x{trim_info[3]} (saved {100 - (trim_info[2]*trim_info[3])/(frame_width*frame_height)*100:.1f}% space)")

    # Create new spritesheet with trimmed frames
    # Make all frames same size for easier handling
    new_frame_width = max_width
    new_frame_height = max_height

    new_spritesheet = Image.new('RGBA', (new_frame_width * num_frames, new_frame_height), (0, 0, 0, 0))

    for i, frame in enumerate(frames):
        # LEFT-ALIGN horizontally, TOP-ALIGN vertically (prevents frame misalignment!)
        x_offset = 0  # LEFT-ALIGN - prevents splitting of sprite body
        y_offset = 0  # TOP-ALIGN - crown at top of frame!

        new_spritesheet.paste(frame, (i * new_frame_width + x_offset, y_offset))

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Save trimmed spritesheet
    output_path = os.path.join(output_dir, 'girl_trimmed.png')
    new_spritesheet.save(output_path, 'PNG', optimize=True)

    # Calculate file sizes
    original_size = os.path.getsize(input_path)
    new_size = os.path.getsize(output_path)
    savings = (1 - new_size / original_size) * 100

    print(f"\n✅ Success!")
    print(f"📁 Output: {output_path}")
    print(f"📊 Original: {spritesheet.width}x{spritesheet.height} ({original_size / 1024:.1f} KB)")
    print(f"📊 Trimmed: {new_spritesheet.width}x{new_spritesheet.height} ({new_size / 1024:.1f} KB)")
    print(f"💾 Saved {savings:.1f}% file size")
    print(f"📐 New frame size: {new_frame_width}x{new_frame_height}")

    # Save metadata
    metadata = {
        'original_frame_size': {'width': frame_width, 'height': frame_height},
        'trimmed_frame_size': {'width': new_frame_width, 'height': new_frame_height},
        'num_frames': num_frames,
        'frames': trim_data
    }

    metadata_path = os.path.join(output_dir, 'girl_trimmed_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"📄 Metadata saved: {metadata_path}")

    return {
        'output_path': output_path,
        'new_frame_width': new_frame_width,
        'new_frame_height': new_frame_height,
        'num_frames': num_frames
    }

if __name__ == '__main__':
    # Configuration
    INPUT_FILE = '../assets/images/girl_v2_fixed.png'  # Using fixed sprite (1535px = 5 × 307px)
    NUM_FRAMES = 5  # Number of animation frames
    ORIGINAL_FRAME_HEIGHT = 1024

    # Auto-calculate frame width from sprite
    temp_img = Image.open(INPUT_FILE)
    ORIGINAL_FRAME_WIDTH = temp_img.width // NUM_FRAMES
    print(f"Auto-detected frame width: {temp_img.width}px / {NUM_FRAMES} frames = {ORIGINAL_FRAME_WIDTH}px per frame")

    # Check for remainder
    remainder = temp_img.width % NUM_FRAMES
    if remainder != 0:
        print(f"⚠️  WARNING: Sprite width ({temp_img.width}px) doesn't divide evenly by {NUM_FRAMES} frames!")
        print(f"         Remainder: {remainder}px - this will cause frame misalignment!")
        print(f"         Consider resizing sprite to {NUM_FRAMES * ORIGINAL_FRAME_WIDTH}px or {NUM_FRAMES * (ORIGINAL_FRAME_WIDTH + 1)}px width")
    else:
        print(f"✅ Sprite dimensions perfect: {temp_img.width}px / {NUM_FRAMES} = {ORIGINAL_FRAME_WIDTH}px (no remainder)")
    print()

    print("=" * 60)
    print("  SPRITE SHEET TRIMMER")
    print("  Professional sprite optimization tool")
    print("=" * 60)
    print()

    result = process_spritesheet(INPUT_FILE, ORIGINAL_FRAME_WIDTH, ORIGINAL_FRAME_HEIGHT)

    print()
    print("=" * 60)
    print("📝 To use in your game, update game_clean.js:")
    print()
    print(f"  scene.load.spritesheet('girl', 'assets/images/trimmed/girl_trimmed.png', {{")
    print(f"      frameWidth: {result['new_frame_width']},")
    print(f"      frameHeight: {result['new_frame_height']}")
    print(f"  }});")
    print()
    print("  // No need for custom collision offset anymore!")
    print("  this.player.setOrigin(0.5, 1);  // Just works now!")
    print("=" * 60)
