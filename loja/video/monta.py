import json,os,glob,subprocess,textwrap
from PIL import Image,ImageDraw,ImageFont
D='frames/'; C=json.load(open(D+'caps.json')); caps=C['caps']; fim=C['fim']
fr=sorted((int(os.path.basename(f).split('_')[1][:-4]),f) for f in glob.glob(D+'*.jpg'))
W,HS,BAND=1080,2340,300; FPS=30
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',40); F2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',26)
def cap_at(t):
  c=''
  for ts,x in caps:
    if ts<=t: c=x
  return c
start=caps[0][0]
proc=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{HS+BAND}','-r',str(FPS),'-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','23','-preset','medium','-movflags','+faststart','escudo_amigo_review.mp4'],stdin=subprocess.PIPE)
cache={}; j=0; last=None; lastkey=None
t=start
while t<=fim:
  while j+1<len(fr) and fr[j+1][0]<=t: j+=1
  c=cap_at(t); key=(fr[j][1],c)
  if key!=lastkey:
    im=Image.open(fr[j][1]).convert('RGB').resize((W,HS),Image.LANCZOS)
    cv=Image.new('RGB',(W,HS+BAND),(14,30,63)); cv.paste(im,(0,BAND)); d=ImageDraw.Draw(cv)
    d.text((48,26),'Escudo Amigo · App Review walkthrough (build 1.0)',font=F2,fill=(170,190,230))
    y=74
    for line in textwrap.wrap(c,44)[:4]:
      d.text((48,y),line,font=F,fill=(255,255,255)); y+=52
    last=cv.tobytes(); lastkey=key
  proc.stdin.write(last); t+=1000/FPS
proc.stdin.close(); proc.wait(); print('ok', round((fim-start)/1000,1),'s')
