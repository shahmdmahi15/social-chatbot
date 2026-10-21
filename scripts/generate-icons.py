import os
import struct
import zlib
import math

def create_png(width, height, filename):
    # Generates a smooth gradient icon with a rounded chat bubble and robot dot
    pixels = bytearray()
    radius = width * 0.45
    cx, cy = width / 2.0, height / 2.0

    for y in range(height):
        pixels.append(0)  # filter type 0 (None)
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            
            # Rounded squircle / circular bubble
            if dist <= radius:
                # Radial gradient from Cyan (0, 210, 255) to Indigo (99, 102, 241)
                t = (x + y) / (width + height)
                r = int(14 * (1 - t) + 99 * t)
                g = int(165 * (1 - t) + 102 * t)
                b = int(233 * (1 - t) + 241 * t)
                
                # Antialiasing near edge
                alpha = 255
                if dist > radius - 1.2:
                    alpha = int(255 * (radius - dist) / 1.2)
                    alpha = max(0, min(255, alpha))

                # Draw two eye dots in the center
                eye_dist_y = abs(y - (cy - height * 0.05))
                eye_left_dist = math.sqrt((x - (cx - width * 0.2))**2 + eye_dist_y**2)
                eye_right_dist = math.sqrt((x - (cx + width * 0.2))**2 + eye_dist_y**2)
                eye_radius = max(1.5, width * 0.09)

                if eye_left_dist <= eye_radius or eye_right_dist <= eye_radius:
                    r, g, b = 255, 255, 255
                    alpha = 255

                pixels.extend([r, g, b, alpha])
            else:
                pixels.extend([0, 0, 0, 0])

    def chunk(tag, data):
        return struct.pack("!I", len(data)) + tag + data + struct.pack("!I", zlib.crc32(tag + data) & 0xffffffff)

    header = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack("!IIBBBBB", width, height, 8, 6, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(bytes(pixels)))
    iend = chunk(b"IEND", b"")

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "wb") as f:
        f.write(header + ihdr + idat + iend)

if __name__ == "__main__":
    create_png(16, 16, "public/icons/icon-16.png")
    create_png(48, 48, "public/icons/icon-48.png")
    create_png(128, 128, "public/icons/icon-128.png")
    print("Generated 16x16, 48x48, 128x128 icons successfully.")
