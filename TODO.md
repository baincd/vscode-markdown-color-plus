## Known Limitations

These are limitations (some might say bugs) in edge cases.  These are weird or uncommon, yet valid, markdown uses that would be complex to solve.

These are all considered a very low priority, with no current plans to be fixed.

* Valid indented code blocks that follow a non-blank line other than a header, blockquote, or a fenced code block will not have the background set
* Multiple backticks in inline code (for example ` ``Hello`` `) will not have the background set
* Inline code that spans multiple lines will not have the background set
