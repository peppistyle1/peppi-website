"""Local preview of the built site, like GitHub Pages: /faq serves faq.html.

    python3 tools/serve.py        then open http://127.0.0.1:8765
"""
import http.server
import os
from functools import partial

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs")


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = super().translate_path(path)
        if not os.path.exists(local) and os.path.exists(local + ".html"):
            return local + ".html"
        return local


if __name__ == "__main__":
    http.server.ThreadingHTTPServer(("127.0.0.1", 8765), partial(Handler, directory=DOCS)).serve_forever()
