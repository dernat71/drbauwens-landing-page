#!/usr/bin/env python3
"""Serveur de développement local.

`python -m http.server` n'envoie aucun en-tête de cache : Chrome applique alors
sa mise en cache heuristique et peut resservir une ancienne version du HTML, du
CSS ou du JS sans même interroger le serveur — on croit alors que la
modification n'a pas été prise en compte.

Ce serveur interdit explicitement toute mise en cache. En production, c'est
.htaccess qui fixe la vraie politique (HTML revalidé, assets versionnés).

    python3 serve.py [port]        # 8080 par défaut
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.webmanifest': 'application/manifest+json',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        if '404' in (fmt % args):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    handler = partial(NoCacheHandler, directory='.')
    print(f'→ http://localhost:{port}  (cache désactivé — Ctrl+C pour arrêter)')
    try:
        ThreadingHTTPServer(('', port), handler).serve_forever()
    except KeyboardInterrupt:
        print('\nserveur arrêté')
