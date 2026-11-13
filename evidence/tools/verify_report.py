from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
from pypdf import PdfReader
import json
root=Path(__file__).resolve().parents[2]
files=sorted((root/'tmp/pdfs').glob('report-*.png'))
for offset in range(0,len(files),8):
    sheet=Image.new('RGB',(1000,1460),'#dce2e7');d=ImageDraw.Draw(sheet)
    for i,f in enumerate(files[offset:offset+8]):
        im=Image.open(f).convert('RGB');im.thumbnail((470,675))
        x=(i%2)*500+(500-im.width)//2;y=(i//2)*365
        im.thumbnail((470,335));x=(i%2)*500+(500-im.width)//2
        sheet.paste(im,(x,y+22));d.text(((i%2)*500+15,y+5),f'Page {offset+i+1}',fill='black')
    sheet.save(root/f'tmp/pdfs/contact-{offset//8+1}.png')
pdf=PdfReader(root/'output/pdf/CostLens_Report_Final.pdf')
pages=[p.extract_text() for p in pdf.pages]
links=[]
for i,page in enumerate(pdf.pages):
    for ref in page.get('/Annots',[]):
        a=ref.get_object().get('/A',{})
        if a:links.append({'page':i+1,'uri':str(a.get('/URI',''))})
result={'pages':len(pages),'rendered_pages':len(files),'square_brackets':sum(p.count('[') for p in pages),'draft_note_present':any('Draft note:' in p for p in pages),'embedded_images':sum(len(p.images) for p in pdf.pages),'links':links,'page_text_lengths':[len(p) for p in pages]}
for filename in ['downloaded-budget-report.pdf','supplemental-import-report.pdf']:
    d=PdfReader(root/'evidence'/filename);s='\n'.join(p.extract_text() for p in d.pages)
    result[filename]={'pages':len(d.pages),'text':s}
(root/'evidence/pdf-validation.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items() if not k.endswith('.pdf')},indent=2))
