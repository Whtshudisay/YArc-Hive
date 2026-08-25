use regex::Regex;
use serde::Serialize;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize)]
pub struct ParsedNote {
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub source_path: String,
}

#[tauri::command]
pub fn parse_apple_notes_export(file_paths: Vec<String>) -> Result<Vec<ParsedNote>, String> {
    if file_paths.is_empty() {
        return Err("No files selected".into());
    }

    let tag_re = Regex::new(r"(?m)(^|\s)#([A-Za-z0-9/_-]+)").map_err(|e| e.to_string())?;
    let heading_re = Regex::new(r"(?m)^#{1,6}\s+(.+)$").map_err(|e| e.to_string())?;
    let html_heading_re =
        Regex::new(r"(?is)<h[1-6][^>]*>(.*?)</h[1-6]>").map_err(|e| e.to_string())?;
    let title_re = Regex::new(r"(?is)<title[^>]*>(.*?)</title>").map_err(|e| e.to_string())?;
    let tag_strip_re = Regex::new(r"(?is)<[^>]+>").map_err(|e| e.to_string())?;

    let mut notes = Vec::new();
    let mut errors = Vec::new();

    for raw in file_paths {
        let path = PathBuf::from(&raw);
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        if !matches!(ext.as_str(), "txt" | "md" | "html" | "htm") {
            errors.push(format!("Skipped unsupported file: {}", path.display()));
            continue;
        }

        match fs::read_to_string(&path) {
            Ok(raw_content) => {
                let is_html = matches!(ext.as_str(), "html" | "htm");
                let mut title = String::new();
                let mut content = raw_content.clone();

                if is_html {
                    if let Some(cap) = html_heading_re.captures(&raw_content) {
                        title = strip_html(&tag_strip_re, cap.get(1).map(|m| m.as_str()).unwrap_or(""));
                    } else if let Some(cap) = title_re.captures(&raw_content) {
                        title = strip_html(&tag_strip_re, cap.get(1).map(|m| m.as_str()).unwrap_or(""));
                    }
                    content = html_to_text(&tag_strip_re, &raw_content);
                } else if let Some(cap) = heading_re.captures(&raw_content) {
                    title = cap
                        .get(1)
                        .map(|m| m.as_str().trim().to_string())
                        .unwrap_or_default();
                }

                if title.is_empty() {
                    title = path
                        .file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("Untitled Note")
                        .to_string();
                }

                let mut tags: Vec<String> = tag_re
                    .captures_iter(&content)
                    .filter_map(|c| c.get(2).map(|m| m.as_str().to_string()))
                    .collect();
                tags.sort();
                tags.dedup();

                notes.push(ParsedNote {
                    title,
                    content: content.trim().to_string(),
                    tags,
                    source_path: path.to_string_lossy().to_string(),
                });
            }
            Err(e) => errors.push(format!("{}: {e}", path.display())),
        }
    }

    if notes.is_empty() {
        return Err(if errors.is_empty() {
            "No notes could be parsed".into()
        } else {
            errors.join("\n")
        });
    }

    Ok(notes)
}

fn strip_html(tag_strip_re: &Regex, input: &str) -> String {
    html_decode(&tag_strip_re.replace_all(input, " "))
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn html_to_text(tag_strip_re: &Regex, input: &str) -> String {
    let with_breaks = input
        .replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("<br />", "\n")
        .replace("</p>", "\n\n")
        .replace("</div>", "\n")
        .replace("</li>", "\n");
    html_decode(&tag_strip_re.replace_all(&with_breaks, " "))
        .lines()
        .map(|l| l.split_whitespace().collect::<Vec<_>>().join(" "))
        .collect::<Vec<_>>()
        .join("\n")
}

fn html_decode(input: &str) -> String {
    input
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
}
