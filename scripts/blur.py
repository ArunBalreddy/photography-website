"""Regenerate src/content/blur.ts — tiny blurred previews shown while photos load.

Run from the repo root after adding or replacing images:  python3 scripts/blur.py
"""
import base64
import glob
import io
import json
import os

from PIL import Image

entries = {}
for pattern in ["public/photos/*.jpg", "public/hero/*.jpg", "public/films/*.jpg", "public/instagram/*.jpg"]:
    for path in sorted(glob.glob(pattern)):
        im = Image.open(path).convert("RGB")
        im.thumbnail((14, 14))
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=55, optimize=True)
        entries["/" + os.path.relpath(path, "public")] = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

lines = [
    "// Generated from public/ images: tiny blurred previews shown while each photo loads.",
    "// Regenerate after adding or replacing images: python3 scripts/blur.py",
    "",
    "export const blur: Record<string, string> = {",
    *[f'  {json.dumps(k)}: "{v}",' for k, v in entries.items()],
    "};",
    "",
    "/** next/image props for a blur-up placeholder: the item's own (uploads) or a generated one (built-ins). */",
    "export const blurProps = (src: string, own?: string) => {",
    "  const data = own ?? blur[src];",
    '  return data ? ({ placeholder: "blur", blurDataURL: data } as const) : ({} as const);',
    "};",
    "",
]
with open("src/content/blur.ts", "w") as f:
    f.write("\n".join(lines))
print(f"{len(entries)} previews written to src/content/blur.ts")
