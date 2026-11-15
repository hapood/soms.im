#!/usr/bin/env python3
"""Validate the static site without third-party dependencies."""
from pathlib import Path
from html.parser import HTMLParser
import re
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.links, self.meta = [], [], {}
        self.svg = self.h1 = 0
        self.canonical = None
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'svg': self.svg += 1
        if tag == 'h1': self.h1 += 1
        if tag == 'meta': self.meta[a.get('name', a.get('property'))] = a.get('content')
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical = a['href']
        for key in ('href', 'src'):
            if key in a: self.links.append(a[key])

paths = [ROOT / 'index.html', *sorted((ROOT / 'how-it-works').glob('*/index.html'))]
titles, descriptions = set(), set()
for path in paths:
    text = path.read_text()
    page = Page(text)
    assert page.h1 == 1, f'{path}: expected one H1'
    assert len(page.ids) == len(set(page.ids)), f'{path}: duplicate IDs'
    missing = set(re.findall(r'url\(#([^\)]+)\)', text)) - set(page.ids)
    assert not missing, f'{path}: missing SVG definitions: {missing}'
    title = re.search(r'<title>(.*?)</title>', text).group(1)
    assert title not in titles, f'{path}: duplicate title'
    titles.add(title)
    desc = page.meta['description']
    assert desc and desc not in descriptions, f'{path}: duplicate/empty description'
    descriptions.add(desc)
    assert page.meta['og:url'] == page.canonical
    assert page.meta['og:type'] == 'website'
    for key in ('og:title', 'og:description', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image'):
        assert page.meta.get(key), f'{path}: missing {key}'
    for link in page.links:
        parsed = urlsplit(link)
        if parsed.scheme or parsed.netloc or not parsed.path: continue
        target = ROOT / parsed.path.lstrip('/') if parsed.path.startswith('/') else path.parent / parsed.path
        if target.is_dir(): target /= 'index.html'
        assert target.exists(), f'{path}: missing local resource {link}'
    if path.parent != ROOT:
        assert page.svg == 1, f'{path}: unused SVGs'
        notes = re.search(r'<section id="chapter-notes".*?</section>', text, re.S).group(0)
        assert notes.count('<article>') == 3, f'{path}: explanation must be static HTML'
        assert not re.search(r'<div class="slide"[^>]*\bhidden', text), f'{path}: no-JS diagram hidden'
    print(f'PASS {path.relative_to(ROOT)}: metadata, links, SVG references, static content')

ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = ET.parse(ROOT / 'sitemap.xml').findall('s:url', ns)
assert len(urls) == len(paths)
for url in urls:
    location = url.find('s:loc', ns).text
    target = ROOT / urlsplit(location).path.lstrip('/') / 'index.html'
    assert target.exists(), location
    assert re.fullmatch(r'\d{4}-\d{2}-\d{2}', url.find('s:lastmod', ns).text)
print('PASS sitemap: canonical pages and lastmod dates')
