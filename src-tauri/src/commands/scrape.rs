use htmd;
use kuchikiki::{traits::TendrilSink, NodeRef};
use spider::website::Website;
use url::Url;

pub struct ScrapedPage {
    pub url: String,
    pub title: String,
    pub content: String,
}

pub async fn page_to_md(url: String) -> Result<ScrapedPage, String> {
    let mut website = Website::new(&url)
        .with_limit(1)
        .with_subdomains(false)
        .with_tld(false)
        .with_respect_robots_txt(true)
        .with_user_agent(Some("page_to_md/0.1".into()))
        .with_caching(false)
        .build()
        .map_err(|e| format!("spider build error: {e}"))?;

    website.scrape().await;

    let pages = website.get_pages().ok_or("No page was fetched")?;
    let page = pages.iter().next().ok_or("No page content found")?;
    let final_url = page.get_url_final().to_string();
    let base = Url::parse(&final_url).unwrap_or_else(|_| Url::parse(&url).unwrap());
    let raw_html = page.get_html().to_string();
    if raw_html.trim().is_empty() {
        return Err("Fetched page is empty".into());
    }
    let document = kuchikiki::parse_html().one(raw_html);

    let title = document
        .select_first("title")
        .ok()
        .map(|title_node| title_node.text_contents().trim().to_string())
        .filter(|t| !t.is_empty())
        .unwrap_or_else(|| "Untitled".to_string());

    strip_nodes(&document, NODES_TO_STRIP_FIRST_PASS);
    let content = pick_main_container(&document, MAIN_CONTAINER_SELECTORS)
        .unwrap_or_else(|| pick_largest_text_block(&document));
    strip_nodes(&content, NODES_TO_STRIP_SECOND_PASS);

    absolutize_urls(&content, &base, "a", "href");
    absolutize_urls(&content, &base, "img", "src");

    let content_html = node_html(&content);
    let mut md = htmd::convert(&content_html).map_err(|e| format!("htmd convert error: {e}"))?;
    md = normalize_whitespace(&md);

    Ok(ScrapedPage {
        title,
        url: final_url,
        content: md,
    })
}

const NODES_TO_STRIP_FIRST_PASS: &[&str] = &[
    // Non-content and scripting
    "script",
    "style",
    "noscript",
    "template",
    "iframe",
    "svg",
    "canvas",
    // Forms and controls
    "form",
    "input",
    "button",
    "select",
    "label",
    // Global chrome / banners / navigation
    "nav",
    "header",
    "footer",
    "[role=contentinfo]",
    "aside",
    "[role=navigation]",
    "[role=banner]",
    ".banner",
    "[class*=banner i]",
    "[id*=banner i]",
    "[aria-label*=banner i]",
    "[data-testid*=banner i]",
    ".topbar",
    ".top-bar",
    "[class*=topbar i]",
    "[class*=top-bar i]",
    "[id*=topbar i]",
    "[id*=top-bar i]",
    // Sticky/fixed elements often used as site chrome
    "[style*=position:fixed i]",
    "[style*=position: sticky i]",
    "[style*=position:sticky i]",
    "[class*=sticky i]",
    "[id*=sticky i]",
    // Breadcrumbs, sidebars, menus
    "[aria-label*=breadcrumb i]",
    ".breadcrumbs",
    ".breadcrumb",
    "[class*=breadcrumb i]",
    "[id*=breadcrumb i]",
    ".sidebar",
    ".sidenav",
    ".menu",
    ".navbar",
    ".site-header",
    ".site-footer",
    "[class*=footer i]",
    "[id*=footer i]",
    "[aria-label*=footer i]",
    // Prev/next/pagination
    "[class*=prev i]",
    "[class*=next i]",
    "[aria-label*=prev i]",
    "[aria-label*=next i]",
    "[rel=prev]",
    "[rel=next]",
    // Search, ads, ToC
    "[role=search]",
    "[class*=search i]",
    "[id*=search i]",
    ".ad",
    ".ads",
    ".advert",
    "[aria-label*=advert i]",
    ".toc",
    "#toc",
    ".table-of-contents",
    // Cookie/consent/GDPR and announcements
    ".cookie",
    ".cookie-banner",
    "[id*=cookie i]",
    "[aria-label*=cookie i]",
    ".gdpr",
    ".consent",
    "[id*=consent i]",
    "[aria-label*=consent i]",
    ".notification",
    ".notifications",
    "[class*=notification i]",
    "[id*=notification i]",
    "[aria-label*=notification i]",
    ".announce",
    ".announcement",
    ".announcements",
    "[class*=announce i]",
    "[id*=announce i]",
    // Overlays / modals / interstitials
    ".modal",
    ".modal-backdrop",
    "[role=dialog]",
    "[aria-modal=true]",
    ".overlay",
    ".popup",
    ".pop-up",
    ".interstitial",
    // Pagination wrappers
    ".pagination",
    ".pager",
    ".prev-next",
    "[class*=pagination i]",
    "[id*=pagination i]",
    "[class*=pager i]",
    "[id*=pager i]",
];

const MAIN_CONTAINER_SELECTORS: &[&str] = &[
    // Strong signals of primary content
    "article",
    "main",
    "[role=main]",
    "[itemprop=articleBody]",
    // Common IDs/classes
    "#content",
    "#main",
    ".content",
    ".post",
    ".entry-content",
    ".entry",
    ".h-entry",
    ".e-content",
    ".markdown-body",
    ".article",
    ".article-body",
    ".article__body",
    ".article__content",
    ".story",
    ".story-body",
    ".story-content",
    ".post-content",
    ".post-body",
    ".page-content",
    ".content__article-body",
    ".rich-text",
    ".RichText",
];

const NODES_TO_STRIP_SECOND_PASS: &[&str] = &[
    // Global chrome and banners
    "nav",
    "header",
    "footer",
    "[role=contentinfo]",
    "aside",
    "[role=banner]",
    ".banner",
    "[class*=banner i]",
    "[id*=banner i]",
    "[aria-label*=banner i]",
    ".topbar",
    ".top-bar",
    "[class*=topbar i]",
    "[class*=top-bar i]",
    "[id*=topbar i]",
    "[id*=top-bar i]",
    // Sticky/fixed and overlays
    "[style*=position:fixed i]",
    "[style*=position: sticky i]",
    "[style*=position:sticky i]",
    "[class*=sticky i]",
    "[id*=sticky i]",
    ".modal",
    ".modal-backdrop",
    "[role=dialog]",
    "[aria-modal=true]",
    ".overlay",
    ".popup",
    ".pop-up",
    ".interstitial",
    // ToC, sidebars
    ".toc",
    "#toc",
    ".table-of-contents",
    ".sidebar",
    // Breadcrumbs
    ".breadcrumbs",
    ".breadcrumb",
    "[class*=breadcrumb i]",
    "[id*=breadcrumb i]",
    // Social/share/comments
    ".share",
    ".social",
    ".share-bar",
    "#comments",
    // Footers/pagination
    "[class*=footer i]",
    "[id*=footer i]",
    "[aria-label*=footer i]",
    "[class*=prev i]",
    "[class*=next i]",
    "[aria-label*=prev i]",
    "[aria-label*=next i]",
    "[rel=prev]",
    "[rel=next]",
    "[class*=pagination i]",
    "[id*=pagination i]",
    "[class*=pager i]",
    "[id*=pager i]",
    // Search & ads
    "[role=search]",
    "[class*=search i]",
    "[id*=search i]",
    ".ad",
    ".ads",
    ".advert",
    "[aria-label*=advert i]",
    // Cookie/consent & announcements
    ".cookie",
    ".cookie-banner",
    "[id*=cookie i]",
    "[aria-label*=cookie i]",
    ".gdpr",
    ".consent",
    "[id*=consent i]",
    "[aria-label*=consent i]",
    ".notification",
    ".notifications",
    "[class*=notification i]",
    "[id*=notification i]",
    "[aria-label*=notification i]",
    ".announce",
    ".announcement",
    ".announcements",
    "[class*=announce i]",
    "[id*=announce i]",
    // Generic non-content wrappers left over
    "script",
    "style",
    "noscript",
    "template",
    "iframe",
    "svg",
];

fn strip_nodes(root: &NodeRef, selectors: &[&str]) {
    for s in selectors {
        if let Ok(sel) = root.select(s) {
            let to_detach: Vec<_> = sel.collect();
            for n in to_detach {
                n.as_node().detach();
            }
        }
    }
}

fn pick_main_container(root: &NodeRef, candidates: &[&str]) -> Option<NodeRef> {
    let mut best: Option<(usize, NodeRef)> = None;

    for s in candidates {
        if let Ok(iter) = root.select(s) {
            for n in iter {
                let node = n.as_node().clone();
                let len = text_weight(&node);
                if best.as_ref().map(|(l, _)| len > *l).unwrap_or(true) {
                    best = Some((len, node));
                }
            }
        }
    }
    best.map(|(_, n)| n)
}

fn pick_largest_text_block(root: &NodeRef) -> NodeRef {
    let mut best_len = 0usize;
    let mut best = root.clone();

    for tag in &["article", "main", "section", "div"] {
        if let Ok(iter) = root.select(tag) {
            for n in iter {
                let node = n.as_node().clone();
                let len = text_weight(&node);
                if len > best_len {
                    best_len = len;
                    best = node;
                }
            }
        }
    }

    best
}

fn text_weight(node: &NodeRef) -> usize {
    node.text_contents()
        .chars()
        .filter(|c| !c.is_whitespace())
        .count()
}

fn node_html(node: &NodeRef) -> String {
    let mut out = Vec::new();
    node.serialize(&mut out).ok();
    String::from_utf8(out).unwrap_or_default()
}

fn absolutize_urls(root: &NodeRef, base: &Url, selector: &str, attr: &str) {
    if let Ok(iter) = root.select(&format!("{selector}[{attr}]")) {
        for el in iter {
            let mut attrs = el.attributes.borrow_mut();
            if let Some(val) = attrs.get(attr) {
                if let Ok(joined) = base.join(val) {
                    attrs.insert(attr, joined.to_string());
                }
            }
        }
    }
}

fn normalize_whitespace(md: &str) -> String {
    let mut out = String::with_capacity(md.len());
    let mut prev_blank = false;

    for line in md.lines() {
        let blank = line.trim().is_empty();
        if blank && prev_blank {
            continue;
        }
        out.push_str(line);
        out.push('\n');
        prev_blank = blank;
    }
    out.trim().to_string() + "\n"
}
