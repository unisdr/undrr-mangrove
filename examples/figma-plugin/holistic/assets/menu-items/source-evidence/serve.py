from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import json
BASE=Path(__file__).resolve().parent;ROOT=Path('/Users/khawkins/Documents/git/drupal-base/.ddev/related-repos/undrr-mangrove')
class Handler(SimpleHTTPRequestHandler):
 def translate_path(self,path):
  p=path.split('?')[0]
  if p.startswith('/source/stories/assets/css/style') and p.endswith('.css'):return str(BASE/'css'/Path(p).name)
  if p.startswith('/source/'):
   f=(ROOT/p[8:]).resolve();return str(f) if f.is_relative_to(ROOT) else str(BASE/'missing')
  f=(BASE/('index.html' if p=='/' else p.lstrip('/'))).resolve();return str(f) if f.is_relative_to(BASE) else str(BASE/'missing')
s=ThreadingHTTPServer(('127.0.0.1',0),Handler);(BASE/'server.json').write_text(json.dumps({'url':'http://127.0.0.1:'+str(s.server_port),'port':s.server_port,'ownedExternalServer':True})+'\n');s.serve_forever()
