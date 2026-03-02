from PIL import Image, ImageDraw

def create_sidebar(logo_path, out_path):
    width, height = 164, 314
    # Create dark bg
    img = Image.new("RGB", (width, height), (18, 16, 20)) # Dark grayish purple #121014
    
    # Draw ultra-modern gradient
    draw = ImageDraw.Draw(img)
    for y in range(height):
        # Gradient from #C77DBA (Top) to #121014 (Bottom)
        # Using colors from the app theme!
        top_color = (199, 125, 186)
        bot_color = (18, 16, 20)
        
        ratio = y / height
        r = int(top_color[0] * (1 - ratio) + bot_color[0] * ratio)
        g = int(top_color[1] * (1 - ratio) + bot_color[1] * ratio)
        b = int(top_color[2] * (1 - ratio) + bot_color[2] * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Load and resize logo
    try:
        logo = Image.open(logo_path).convert("RGBA")
        logo.thumbnail((100, 100))
        paste_x = (width - logo.width) // 2
        paste_y = (height - logo.height) // 2 - 30
        img.paste(logo, (paste_x, paste_y), logo)
    except Exception as e:
        print("Logo not found or invalid", e)
        
    img.save(out_path, format="BMP")
    print(f"Saved {out_path}")

def create_header(logo_path, out_path):
    width, height = 150, 57
    img = Image.new("RGB", (width, height), (255, 255, 255)) # Default NSIS header is white bg!
    
    try:
        logo = Image.open(logo_path).convert("RGBA")
        logo.thumbnail((45, 45))
        paste_x = width - logo.width - 10
        paste_y = (height - logo.height) // 2
        img.paste(logo, (paste_x, paste_y), logo)
    except Exception as e:
        print("Logo not found or invalid", e)
        
    img.save(out_path, format="BMP")
    print(f"Saved {out_path}")

logo_file = "public/twilight.png"
create_sidebar(logo_file, "src-tauri/icons/nsis-sidebar.bmp")
create_header(logo_file, "src-tauri/icons/nsis-header.bmp")
