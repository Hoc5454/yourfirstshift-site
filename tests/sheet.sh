#!/bin/bash
# usage: sheet.sh html tag
H=$1;T=$2;mkdir -p o/$T
for L in "Modern Professional" "Clean Minimal" "Bold Trades" "Creative Tech" "Traditional Classic"; do
 S=$(echo $L|tr ' ' '_'); node run.js $H "$L" o/$T/$S >/dev/null 2>&1 || echo FAIL $L
 soffice --headless --convert-to pdf --outdir o/$T/w o/$T/$S.docx >/dev/null 2>&1
 echo "$S pdfpages=$(pdfinfo o/$T/${S}_styled.pdf|grep Pages|awk '{print $2}') pdftext=$(pdftotext o/$T/${S}_styled.pdf - |wc -w) wordpages=$(pdfinfo o/$T/w/$S.pdf|grep Pages|awk '{print $2}')"
done
python3 - "$T" <<'E'
import sys,glob,subprocess
from PIL import Image
T=sys.argv[1]
for kind,pat in (('pdf','o/%s/%%s_styled.pdf'%T),('word','o/%s/w/%%s.pdf'%T)):
  rows=[]
  for L in ["Modern_Professional","Clean_Minimal","Bold_Trades","Creative_Tech","Traditional_Classic"]:
    f=pat%L; subprocess.run(['pdftoppm','-r','40','-png',f,'/tmp/pp_'+L+kind])
    ims=[Image.open(x) for x in sorted(glob.glob('/tmp/pp_'+L+kind+'*.png'))]
    for x in glob.glob('/tmp/pp_'+L+kind+'*.png'):
      import os;os.remove(x)
    rows.append(ims)
  W=max(sum(i.width+8 for i in r) for r in rows);H=sum(max(i.height for i in r)+8 for r in rows)
  o=Image.new('RGB',(W,H),'gray');y=0
  for r in rows:
    x=0
    for i in r:o.paste(i,(x,y));x+=i.width+8
    y+=max(i.height for i in r)+8
  o.save('o/%s/sheet_%s.png'%(T,kind))
E
