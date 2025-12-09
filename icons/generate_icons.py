#!/usr/bin/env python3
"""
Simple icon generator for Break Reminder extension
Creates basic placeholder icons if you don't have custom ones
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    # Icon specifications
    sizes = [16, 48, 128]
    bg_color = (59, 130, 246)  # Blue #3b82f6
    text_color = (255, 255, 255)  # White
    
    icons_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("Creating placeholder icons...")
    
    for size in sizes:
        # Create image
        img = Image.new('RGB', (size, size), bg_color)
        draw = ImageDraw.Draw(img)
        
        # Draw simple clock emoji or circle
        if size >= 48:
            # Draw a simple clock representation
            center = size // 2
            radius = size // 3
            
            # Clock circle
            draw.ellipse(
                [center - radius, center - radius, center + radius, center + radius],
                outline=text_color,
                width=max(2, size // 24)
            )
            
            # Clock hands
            draw.line([center, center, center, center - radius // 2], fill=text_color, width=max(2, size // 32))
            draw.line([center, center, center + radius // 3, center], fill=text_color, width=max(2, size // 32))
        else:
            # For 16x16, just draw a filled circle
            padding = 2
            draw.ellipse([padding, padding, size - padding, size - padding], fill=text_color)
        
        # Save
        filename = f'icon{size}.png'
        filepath = os.path.join(icons_dir, filename)
        img.save(filepath)
        print(f"✓ Created {filename}")
    
    print("\n✅ All icons created successfully!")
    print("You can now load the extension in Chrome.")
    print("\nTo use custom icons, replace icon16.png, icon48.png, and icon128.png")
    print("with your own designs (keeping the same names).")
    
except ImportError:
    print("❌ PIL/Pillow not installed.")
    print("\nTo install: pip install Pillow")
    print("\nAlternatively, create icons manually:")
    print("1. Visit https://favicon.io/favicon-generator/")
    print("2. Create icons and save as icon16.png, icon48.png, icon128.png")
    print("3. Place them in the icons/ folder")
except Exception as e:
    print(f"Error creating icons: {e}")
    print("\nPlease create icons manually. See ICON_INSTRUCTIONS.txt for help.")
