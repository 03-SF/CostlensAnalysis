from pathlib import Path
import subprocess, zipfile, hashlib, json
root=Path(__file__).resolve().parents[2]
tracked=subprocess.check_output(['git','ls-files'],cwd=root,text=True).splitlines()
paths={root/p for p in tracked if p and not p.startswith('.bolt/')}
paths.add(root/'README.md')
paths.update(p for p in (root/'evidence').rglob('*') if p.is_file())
paths.update(p for p in (root/'output/pdf').rglob('*') if p.is_file())
paths.update(p for p in (root/'output/demo').rglob('*') if p.is_file())
paths.add(root/'output/SUBMISSION_NOTES.md')
paths={p for p in paths if p.is_file() and not (p.name.startswith('.env') and p.name!='.env.example')}
target=root/'output/CostLens_Submission_Backup.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(paths):z.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
    manifest={'archive':target.name,'entries':len(z.namelist()),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size}
(root/'output/backup-validation.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps(manifest,indent=2))
