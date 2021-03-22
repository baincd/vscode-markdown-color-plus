    Indented code block at line 0
# Header Level 1

Some text

## Header Level 2 with inline `code` here

More Text `with` multiple `inline` code `parts even with spaces`

## Header Level 2 again

More Text

### Header Level 3  - 2 trailing spaces should not be highlighted -->  

Text with 2 trailing spaces-->  
The next line!

### Header Level 3 The Sequel

Text with 4 trailing spaces-->    
And again, the next line


| Tablish with trailing spaces should not be highlighted |  

Alternate Headers with trailing spaces should not be highlighted

Header 1 -->  
===  

Header 2 -->  
---  

And Horizontal Rules with trailing spaces should not be highlighted



- List items with trailing spaces should be highlighted -->  

```java
Code block with language identifier

Line 2 - trailing spaces in fenced code block should not be highlighted-->  
inline `code` should also not be highlighted
    and this indented line should be part of the same fenced code block
```

Outside code block

```
Code block with no language identifer
4 spaces should not mark the end of code block:
    ```

Line 2
```

Outside code block

~~~
Code block with squigglies

Line 2
```
Still in code block
~~~

Outside code block

``````
Code block with 6 tokens
```
still in code block
Now closing text - but with 3 leading spaces
   ``````

Outside code block

   ~~~~javascript
Fenced code block with 3 leading spaces, then 4 tokens
3 tokens - shouldn't end code block
~~~
And now 4 tokens to end code block
~~~~

### A Header
    Indented code block 1 (with spaces, immediately following header)

    Same indented code block (prev line blank)
 
    Same Indented code block (prev line single space)
    
    Same indented code block (prev line 4 spaces)
	
    Same indented code block (prev line tab)
    Trailing spaces in indented code block should not be highlighted-->  

outside

	indented code block using tab
    Line 2

outside

> blockquote
    Indented code immediately following blockquote should not be code
    Line 2

outside

```
fenced code block
Line 2
```
    Indented code block
    Line 2

outside
