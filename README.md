# Markdown Color Plus

Additional Colorization for Markdown Files (background color of code, invisible line breaks, strikethrough text, and current section headers)

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

### Highlight Current Section Headers

![current section headers example](images/example-current-headers.png)

## Troubleshooting

* Due to limitations with the VS Code API, header highlights do not refresh when you move the cursor to whitespace or certain characters like `)`.  To update the header highlights, edit the document or move the cursor to another word.
* Performance and other issues may be solved by modifying extension delay settings.  See extension settings for more details.
