# Erzeugt das App-Icon (hell + dunkel) aus dem CC0-Pin von 3dicons.co.
# Aufruf: uv run --with pillow python scripts/make_app_icon.py <3dicons-Ordner> AppIcon.png light|dark

from PIL import Image, ImageDraw, ImageFilter
import math, sys
S=1024; SRC=sys.argv[1]; dark = sys.argv[3]=='dark'
def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
if dark: top,bot=(44,30,38),(22,14,20)
else: top,bot=(255,255,255),(255,236,240)
bg=Image.new('RGB',(S,S)); px=bg.load()
for y in range(S):
    c=lerp(top,bot,y/S)
    for x in range(S): px[x,y]=c
bg=bg.convert('RGBA')
# viewfinder corners, supersampled
big=Image.new('RGBA',(S*2,S*2),(0,0,0,0)); d=ImageDraw.Draw(big)
pink=(232,61,127,255)
m=214*2; L=168*2; w=52*2; r=w//2
def seg(a,b):
    d.line([a,b],fill=pink,width=w)
    for p in (a,b): d.ellipse((p[0]-r,p[1]-r,p[0]+r,p[1]+r),fill=pink)
E=S*2-m
for (x,y,dx,dy) in [(m,m,1,1),(E,m,-1,1),(m,E,1,-1),(E,E,-1,-1)]:
    seg((x,y),(x+dx*L,y)); seg((x,y),(x,y+dy*L))
bg.alpha_composite(big.resize((S,S),Image.LANCZOS))
# pin with soft shadow on a padded canvas
size=600
pin=Image.open(f"{SRC}/pin-color.png").convert('RGBA').resize((size,size),Image.LANCZOS)
# shift the orange-red pin towards the brand pink
a=pin.split()[3]; hsv=pin.convert('RGB').convert('HSV'); h,sat,v=hsv.split()
h=h.point(lambda x: (x-14)%256)
pin=Image.merge('HSV',(h,sat,v)).convert('RGB').convert('RGBA'); pin.putalpha(a)
pad=120
sh=Image.new('RGBA',(size+2*pad,size+2*pad),(0,0,0,0))
alpha=Image.new('L',sh.size,0); alpha.paste(pin.split()[3],(pad,pad))
shadow=Image.new('RGBA',sh.size,(120,20,60,0)); shadow.putalpha(alpha.point(lambda a: int(a*0.35)))
shadow=shadow.filter(ImageFilter.GaussianBlur(30))
x=(S-size)//2+6; y=(S-size)//2-6
bg.alpha_composite(shadow,(x-pad+26,y-pad+44))
bg.alpha_composite(pin,(x,y))
out=bg.convert('RGB'); out.save(sys.argv[2])
