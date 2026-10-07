"""Check local HTML/CSS links and media without making network requests."""
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PREFIX = '/' if (ROOT / 'CNAME').exists() else '/wildlife-site/'


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if not value:
                continue
            if key in {'src', 'href', 'poster', 'data-src', 'data-full'}:
                self.refs.append(value)
            elif key == 'srcset' and not value.startswith('data:'):
                self.refs.extend(part.strip().split()[0] for part in value.split(',') if part.strip())


def check(root=ROOT, prefix=PREFIX):
    errors = []
    checked = 0
    pages = list(root.rglob('*.html')) + list(root.rglob('*.css'))
    for page in pages:
        if any(part in {'.git', 'node_modules'} for part in page.relative_to(root).parts):
            continue
        text = page.read_text(encoding='utf-8')
        if page.suffix == '.html':
            parser = References()
            parser.feed(text)
            refs = parser.refs
        else:
            refs = re.findall(r'url\(\s*[\'"]?([^\)\'"\s]+)', text)
        for ref in refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc or not url.path:
                continue
            path = unquote(url.path)
            if path.startswith('/'):
                # Other projects under Reedos.dev have independent deployments.
                if not path.startswith(prefix):
                    continue
                target = root / path[len(prefix):]
            else:
                target = page.parent / path
            if target.is_dir():
                target = target / 'index.html'
            checked += 1
            if not target.is_file():
                errors.append(f'{page.relative_to(root)}: missing {ref}')
    return checked, sorted(set(errors))


if __name__ == '__main__':
    checked, errors = check()
    print('\n'.join(errors) if errors else f'Checked {checked} local page/media references.')
    sys.exit(bool(errors))
