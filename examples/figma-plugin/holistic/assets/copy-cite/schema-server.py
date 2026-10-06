from http.server import BaseHTTPRequestHandler,HTTPServer
from pathlib import Path
root=Path('/Users/khawkins/Documents/git/drupal-base/.ddev/related-repos/undrr-mangrove')
class H(BaseHTTPRequestHandler):
 def do_GET(self):
  target=self.path.split('?')[0]
  if target=='/cite-this.js':data=(root/'stories/assets/js/cite-this.js').read_bytes();kind='text/javascript'
  elif target=='/style-all.css':data=(root/'stories/assets/css/style-all.css').read_bytes();kind='text/css'
  elif target in ['/fonts/mangrove-icon-set/font/mangrove-icon-set.woff2','/fonts/mangrove-icon-set/font/mangrove-icon-set.woff','/fonts/mangrove-icon-set/font/mangrove-icon-set.ttf']:data=(root/'stories/assets'/target.lstrip('/')).read_bytes();kind='font/woff2'
  elif target=='/matching-schema.html':data=Path('/tmp/mangrove-copy-cite-source-20261006/matching-schema.html').read_bytes();kind='text/html'
  else:self.send_error(404);return
  self.send_response(200);self.send_header('Content-Type',kind);self.end_headers();self.wfile.write(data)
HTTPServer(('127.0.0.1',6119),H).serve_forever()
