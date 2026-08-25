use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT};
use serde::Serialize;
use url::Url;

#[derive(Debug, Serialize)]
pub struct MediaMetadata {
    pub url: String,
    pub title: String,
    pub description: String,
    pub image_url: String,
    pub site_name: String,
    pub media_type: String,
}

fn youtube_id(parsed: &Url) -> Option<String> {
    let host = parsed.host_str()?.to_lowercase();
    if host.contains("youtu.be") {
        let id = parsed.path().trim_matches('/').split('/').next()?;
        return if id.is_empty() {
            None
        } else {
            Some(id.to_string())
        };
    }
    if host.contains("youtube.com") {
        if let Some(v) = parsed
            .query_pairs()
            .find(|(k, _)| k == "v")
            .map(|(_, v)| v.to_string())
        {
            if !v.is_empty() {
                return Some(v);
            }
        }
        let parts: Vec<&str> = parsed.path().split('/').filter(|s| !s.is_empty()).collect();
        if parts.len() >= 2 && matches!(parts[0], "embed" | "shorts" | "live" | "v") {
            return Some(parts[1].to_string());
        }
    }
    None
}

fn classify_host(parsed: &Url) -> &'static str {
    let host = parsed.host_str().unwrap_or("").to_lowercase();
    if host.contains("youtube.com") || host.contains("youtu.be") {
        "youtube"
    } else if host.contains("substack.com") {
        "substack"
    } else if host.contains("instagram.com") {
        "instagram"
    } else {
        "article"
    }
}

fn og_content(document: &scraper::Html, property: &str) -> String {
    let selector = scraper::Selector::parse(&format!(
        r#"meta[property="{property}"], meta[name="{property}"]"#
    ))
    .ok();
    let Some(selector) = selector else {
        return String::new();
    };
    document
        .select(&selector)
        .filter_map(|el| el.value().attr("content"))
        .next()
        .unwrap_or("")
        .trim()
        .to_string()
}

fn html_title(document: &scraper::Html) -> String {
    let Ok(selector) = scraper::Selector::parse("title") else {
        return String::new();
    };
    document
        .select(&selector)
        .next()
        .map(|el| el.text().collect::<String>().trim().to_string())
        .unwrap_or_default()
}

fn host_label(parsed: &Url) -> String {
    parsed.host_str().unwrap_or("web").to_string()
}

fn first_nonempty(values: &[String]) -> String {
    values
        .iter()
        .find(|v| !v.trim().is_empty())
        .cloned()
        .unwrap_or_default()
}

#[tauri::command]
pub async fn fetch_url_metadata(url: String) -> Result<MediaMetadata, String> {
    let parsed = Url::parse(&url).map_err(|e| format!("Invalid URL: {e}"))?;
    let mut media_type = classify_host(&parsed).to_string();
    let yt_id = youtube_id(&parsed);

    let mut headers = HeaderMap::new();
    headers.insert(
        USER_AGENT,
        HeaderValue::from_static(
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        ),
    );

    let client = reqwest::Client::builder()
        .default_headers(headers)
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| e.to_string())?;

    let mut title = String::new();
    let mut description = String::new();
    let mut image_url = String::new();
    let mut site_name = host_label(&parsed);

    match client.get(&url).send().await {
        Ok(response) => match response.error_for_status() {
            Ok(ok) => match ok.text().await {
                Ok(html) => {
                    let document = scraper::Html::parse_document(&html);
                    title = first_nonempty(&[og_content(&document, "og:title"), html_title(&document)]);
                    description = og_content(&document, "og:description");
                    image_url = og_content(&document, "og:image");
                    site_name = first_nonempty(&[
                        og_content(&document, "og:site_name"),
                        host_label(&parsed),
                    ]);
                }
                Err(_) => {}
            },
            Err(_) => {}
        },
        Err(_) => {}
    }

    if let Some(id) = yt_id {
        media_type = "youtube".into();
        image_url = format!("https://img.youtube.com/vi/{id}/maxresdefault.jpg");
        if site_name.is_empty() {
            site_name = "YouTube".into();
        }
        if title.is_empty() {
            title = format!("YouTube {id}");
        }
    }

    if title.is_empty() {
        title = url.clone();
    }

    if media_type == "article" && description.is_empty() && image_url.is_empty() {
        media_type = "generic".into();
    }

    Ok(MediaMetadata {
        url,
        title,
        description,
        image_url,
        site_name,
        media_type,
    })
}
