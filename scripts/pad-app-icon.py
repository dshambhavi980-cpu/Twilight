from PIL import Image
import os

def pad_to_square(img_path, out_path):
    img = Image.open(img_path)
    img = img.convert("RGBA")
    
    width, height = img.size
    new_size = max(width, height)
    
    new_img = Image.new("RGBA", (new_size, new_size), (0, 0, 0, 0)) # transparent background
    
    paste_x = (new_size - width) // 2
    paste_y = (new_size - height) // 2
    
    new_img.paste(img, (paste_x, paste_y))
    new_img.save(out_path)
    print(f"Padded image saved to {out_path}")

pad_to_square("public/twilight.png", "public/icon_square.png")
