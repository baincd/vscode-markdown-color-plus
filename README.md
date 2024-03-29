# Markdown Color Plus

Additional Colorization for Markdown Files (background color of code, invisible line breaks, strikethrough text, blockquotes, horizontal rules, setext headers, and highlighting current section headers)

## Features

All these features can be configured or disabled

### Fenced Code Block Background

![fenced code block example](images/example-fenced-code-block.png)

### Indented Code Block Background

![indented code block example](images/example-indented-code-block.png)

### Inline Code Background

![inline code example](images/example-inline-code.png)

### Highlight invisible line breaks (2 trailing spaces)

![invisible line breaks example](images/example-invisible-line-breaks.png)

### Strikethrough text

![strikethrough text example](images/example-strikethrough-text.png)

### Blockquote

![blockquote example](images/example-blockquote.png)

### Horizontal Rule

![horizontal rule examples](images/example-horizontal-rules.png)

### Alternate (setext-style) headers

![setext-style headers example](images/example-setext-headers.png)

**Note** This feature is disabled by default.  See [Alternate (setext-style) Header Colors](#alternate-setext-style-header-colors) for how to make alternate setext-style headers match your color theme.

### Highlight Current Section Headers

![current section headers example](images/example-current-headers.png)

## Troubleshooting

* Due to limitations with the VS Code API, header highlights do not refresh when you move the cursor to whitespace or certain characters like `)`.  To update the header highlights, edit the document or move the cursor to another word.
* Performance and other issues may be solved by modifying extension delay settings.  See extension settings for more details.
* Selected text is not visibly highlighted if the background color is 100% opaque.  To fix this, [set the alpha channel](https://www.w3schools.com/css/css3_colors.asp) so that background is partially transparent.  This can be done by defining background colors using either of these formats:
	- `#RRGGBBAA` (ex: `#0A0A0A66` → the "66" is the Alpha channel in hex.  "FF" is 100% opaque, "00" is 100% transparent, 66 is approx 40% opaque)
	- `rgba(r,g,b,a)` (ex: `rgba(10,10,10,0.40)` → 0.40 is the opacity on a scale of 0.0-1.0)

### Alternate (setext-style) Header Colors

This extension is unable to automatically use the markdown header colors of the current color theme.  The default color settings for alternate headers matches the default VS Code color themes.

To configure alternate headers to match your color theme:
  1. Open a markdown document
  2. Use the command "Developer: Inspect Editor Tokens and Scopes" to find the color(s) your color theme uses for markdown headers 
  3. Set the corresponding `markdown-color-plus setext` color settings (and enable)

### Conflicts

The popular extension "Markdown All in One" (yzhang.markdown-all-in-one) also adds colors and decorations to markdown files, some of which overlap and could cause conflicts with this extension.

If you are not seeing the expected behavior from this extension and have "Markdown All in One" also installed, review "Markdown All in One" settings that start with `markdown.extension.theming.decoration` to see if any may be conflicting with this extension.
