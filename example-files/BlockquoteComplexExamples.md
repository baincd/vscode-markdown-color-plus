> BQ
   > > BQ
    > > > BQ line, no BQ symbols (cannot have more than 3 leading spaces)

text
	> Not a BQ (cannot start with tab)

  text
    > Not a BQ (cannot have more than 3 spaces, even if previous text line as more than 3 spaces)

- list
some list text

     > BQ (max number of spaces increases to 5 when after first level list)

text

- list
	 > BQ (tab counts as 4 spaces)
  - list
     - list 
		  > BQ (tab counts as 4 spaces)

text

  - list
       > BQ (max number of spaces increases to 7 when after first level list indented 2 spaces)

text

- list
  - list
     - list
          > BQ
          > > BQ2


> BQ
>     > BQ - but second symbol should not be highlighted!

# Not currently supported correctly
- list
      > Should not be highlighted as a BQ - too many leading spaces
