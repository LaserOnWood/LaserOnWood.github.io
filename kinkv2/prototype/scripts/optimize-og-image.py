from pathlib import Path
from PIL import Image

source = Path(__file__).resolve().parents[1] / 'og' / 'kinklist_opengraph.png'
target = source.with_suffix('.jpg')

with Image.open(source) as image:
    image = image.convert('RGB')
    image.thumbnail((1200, 800), Image.Resampling.LANCZOS)
    image.save(
        target,
        format='JPEG',
        quality=88,
        optimize=True,
        progressive=True,
        subsampling=0,
    )

print(f'Image Open Graph optimisée : {target.name}')
