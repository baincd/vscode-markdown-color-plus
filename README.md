# Markdown Color Plus

Additional Colorization for Markdown Files, such as background color of code blocks and inline code

## Features

All these features can be configured or disabled

### Set Background on fenced code blocks

![fenced code block example](images/example-fenced-code-block.png)

### Set Background on indented code blocks

![indented code block example](images/example-indented-code-block.png)

### Set Background on inline code

![inline code example](images/example-inline-code.png)

## Known Limitations

* Valid indented code blocks that follow a non-blank line other than a header, blockquote, or a fenced code block will not have the background set
* Multiple backticks in inline code (for example ` ``Hello`` `) will not have the background set
* Inline code that spans multiple lines will not have the background set
