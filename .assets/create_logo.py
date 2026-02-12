from PIL import Image, ImageDraw

# Create a simple 512x512 logo
size = 512
img = Image.new("RGB", (size, size), color="#0070F3")
draw = ImageDraw.Draw(img)

# Draw a white "D" in the center
draw.ellipse([size // 4, size // 4, 3 * size // 4, 3 * size // 4], fill="white")
draw.rectangle([size // 4, size // 4, size // 2, 3 * size // 4], fill="white")

# Save
img.save(".assets/anyon-logo.png")
print("Logo created: .assets/anyon-logo.png")
