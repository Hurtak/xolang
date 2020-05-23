# XOXO

## TODO

- tokenizer
- parse comments
- js output target

---

- variables
  - strings
  - numbers
    - int (64bit, js only has 52 or something)
    - float
  - null?
- show where error happened
- features
  - floats
  - arrays
- compiler stuff
  - transformation
  - js code generation
- turtle library for learning
  - https://docs.python.org/3.3/library/turtle.html?highlight=turtle

## High level overview

### Features

- garbage collected
- typed or optionally typed?
  - either way inferred types
  - compile program even if it does not typecheck so we can debug more easily?
    - how would this work on native?
- syntax extensions to support JSX, Graphql...?
- compile to JS on client, later webassembly
- compile to node (later native) on server
- js interop?
- distributed as a single binary where everything is packaged (node...)
- pluggable like jai, import compiler/parser/whatever/package manager as a library

### Ecosystem

- rich standard library
  - test library
  - benchmark library?
- package manager
  - accepts any git repository, so github links mostly but also could be locally hosted projects/directories
  - versioned std lib (compiler needs to ship with all versions or this will be pulled from github?)
  - audited packages
    - have a way to dispaly if cerpatin packages (and their dependencies) were audited by someone
    - have trust system, audit from someone known more valuable than someone new?
    - https://github.com/eirslett/package-trust
- linter
  - no unused variables
  - no unused functions
  - variable names are not snake_case
- autoupdater from version A to B
- autoformatter

## Syntax

- Source: https://twitter.com/jamiebuilds/status/1020025386531401729

### Loops

- It's funny the things I can't decide on. Like loops:
- for ...stuff... {}
- while ...stuff... {}
- It's a pretty unique spot in languages, I'm trying to unify it with other parts of the syntax and it just doesn't work

### Tuples

- I also can't decide on how I want to do tuples, I hate using (a, b, c) because that looks like so many other things that can appear around expressions.

- Or maybe I don't want tuples at all and lightweight records could fill pretty much the entire need

### Imports

- local imports use just file paths and the last /part of their file path becomes their binding (except when you destruct individual exports)

```python
import Iter
import Math
import ./Utils { isEven, double }
import ./path/to/Constants

let total = Constants.numbers
    |> Iter.filter isEven
    |> Iter.map double
    |> Iter.reduce(add, 0)
```

### Lists/Arrays

- I've also decided to steal from F# and use [...] for lists and [|...|] for fixed length arrays. You have to choose one or the other based on what you want to do with them (they are optimized for different use cases)

```python
let listA = [1, 2]
let listB = [3, 4]
let listC = [...listA, ...listB]

let array = [|1, 2, 3|]
let first = array[0]
```

### Strings

- I made strings work differently than JavaScript. I pulled it from Python and Ruby. But I used just "{value}" as the syntax for interpolations.

```python
let target = 'world'

// single line
let str1 = 'hello world'
let str2 = "hello {target}"

// escaping
let str3 = '\''
let str4 = "\"\{\}"

// multiline (strips out indentation)
let str5 =
    '''
    hello
    world
    '''

let str6 =
    """
    hello
    {target}
    """
```

### Functions

- Functions are also always declared as expressions and passed around as values, they don't have names. They return automatically. (Parenthesis, around, arguments) and { curly braces around function bodies } are required

```python
let add = (a, b) => { a + b }
let add = (a, b) => {
  a + b
}
```

### JSX / MDX / custom syntax support

- TODO

## Syntax OLD

### Variables

```python
x = 10
let x = 20 // mutable variable
```

### Data types

```python
bool = true
number = 123
number = 100_000
float = 123.456
string = "text"
array = [1, 2, 3]
hash = {
    key = "value", // string key
    123 = "value", // number key
}
```

### Functions

```python
add = (a, b) => a + b
add2 = (a) => add(a, 2)
substract = (a, b) => a - b

x = add(10, 20)
    |> x => add2(x)
    |> x => substract(x, 5)
y = substract(add(10, 20), 5)

longFunction = (a) => {
    if a > 10 {
        return true
    }
    return false
}

x = add 10 20
x = add(10 20)
x = add 10 20
    |> x => add2 x
    |> x => substract x 5
```

### Cycles

```python
for true {
    // infinite cycle
}

for value, key in x {

}

for i=1; i<length(key); i += 1 {

}
```

## Ideas

### Pure function

- Function that can only touch
  - parameters
  - variables/functions defined inside of it
  - other pure functions?
  - anything immutable (constants/interfaces)?

```js
let foo = pure (a, b) => {
  return a + b
}
```

### Asserts

#### Regular asserts

- Should it be imported or in global scope?

```js
assert(a > 0);
```

- if asserting is in hot path we could do the assert only every x runs?

```js
@skipPercentage(50) // 50% asserts are going to be skipped
assert(a > 0);
```

#### Assert Types

- assert is automatically run when value is accessed or assigned

```js
interface Person {
  name: {
    type: string,
    assert: (value) => {
      return value.length > 0
    }
  }
}
```

### Record

```js
function main() {
	let res;
	res = longrunningFunction1();
	res = longrunningFunction2();

	record;

	res = longrunningFunction3();
}
```

- when `record` statement is hit, it saves complete state of the aplication
- then we can somehow run it again from that place
- super useful for debugging some place of the program where it takes a long time to get there
  - eg some decent amount of user interaction
  - or vyzkumnici have lots of long running functions around datasets and they fine tune algorithms
- almost python netebook style programming?
- TODO: how to run recorded stuff
- TODO: what if something from before the record changes?
- The other thing is that `await` should have been inverted. You should mark function calls you don't want to wait for, not the other way around. Waiting should be the default for a function call

## Random notes

- Licensing
  - https://twitter.com/geekovo/status/1045263759030112258
- Inspiration:
  - Skip programming language
    - https://news.ycombinator.com/item?id=18077612
    - http://skiplang.com/
- Long term promotion
  - product placement?
  - deal with online schools that teach web dev?
