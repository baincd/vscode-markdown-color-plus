## Known Limitations

These are limitations (some might say bugs) in edge cases.  These are weird or uncommon, yet valid, markdown uses that would be complex to solve.

These are all considered a very low priority, with no current plans to be fixed.

* Valid indented code blocks that follow a non-blank line other than a header, horizontal rule, or a fenced code block will not have the background set
* Multiple backticks in inline code (for example ` ``Hello`` `) will not have the background set
* Inline code that spans multiple lines will not have the background set
* Strike through text that spans multiple lines will not be struck through or have opacity set
* Invisible line breaks will not be highlighted on non-table lines that start and end with |
* Invisible line breaks within inline code is highlighted 
* The header highlights do not refresh if you move the cursor to whitespace (making an edit or moving the cursor to text will update the header highlights)

## Potential Feature Ideas

These are proposed ideas for potential new features.  It has not been decided whether these should be implemented or not.

- Invisible line breaks: Make spaces visible (similar to when selected) (is this even possible?)
- Invisible line breaks: Highlight first 2 trailing spaces (instead of last 2)  (make configurable?)
- Invisible line breaks: Do not highlight when next line is only whitespace
- Indented code blocks: Do not highlight lines that start indented code block that are only whitespace
- Indented code blocks: Do not highlight indented code blocks made up of only whitespace


