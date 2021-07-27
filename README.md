# XOXO

- data structures
  - https://twitter.com/alesroubicek/status/1384072121081499657
- viral
  - https://twitter.com/JanRuziJan/status/1391318261967376386?s=20
  - store with share where devs can develop plugins
- https://twitter.com/atomkirk/status/1396238932078055424
- base on https://vimeo.com/113707214
  - but make it work with regular exceptions etc

## TODO

- tokenizer
- parse comments
- js output target
- something like dependencies cruiser

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
- error handling
  - https://news.ycombinator.com/item?id=25253471
  - easy to use

```js
const sanitizeEmail = (email: String): String => {
	return input.trim().toLowerCase();
};

const validateEmail = (email: String): Boolean => {
	return true;
};

const UserController = () => {
	const userService = UserService();

	return {
		changePassword: (userId: String, newPassword: String) => {
			userService.changePassword(userId, newPassword);
			smtpService.sendEmail(userId, newPassword);
		},
	};
};

const main = () => {
	const userController = UserController();

	const res = userController.changePassword("userId1", "newPassword");
  switch (res) {
    case Either(data) {
      return [200, "Change ok"]
    }
    case
  }
};
```

```js
const script = () => {
	const file = File.read('test.txt') // returns Either<FileContent, ErrorsUnion>

	const file = File.read('test.txt').unwrap() // returns FileContent

	// but modifies rest of the function to basically be
	match File.read('test.txt') {
		case Ok(FikeContent) => {
			// rest of the script
		}
		case Err => {
			return Left(Err)
		}
	}
}
```

- great idea: exhaustiveness pattern matching with default that specifies number of rest patterns

```js
type Currency = USD | CZK | XXX
const tax = match Currency {
  case USD -> 0.2
  case else 2 -> 0
  // This 2 is important, means match all of the cases, but there needs to be 2 of them, so when we remove or add new case,
  // the compiler will complain and we will need to update and rethink all of our exhaustiveness pattern mathching cases
}

```

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
- end goal - replace brittle stacks of dependencies that yo do not control with xo https://twitter.com/iljapanic/status/1295828432572612609
- detect unused code https://twitter.com/jfmengels/status/1331329218630852608?s=20

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
- web framework
  - needs to have FE + BE
  - form auto-generated crud
    - https://demo.adminer.org/editor.php?username=
    - or like Rails
  - forms need to be super simple, like in Nette - thats because they have FE and BE covered in one framework, there is no split

## UI components

- Have universal UI components that first compile to Web
- Take inspiration from Flutter
  - https://www.youtube.com/watch?v=FCyoHclCqc8&feature=emb_title

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
- Idea: build in help
  - "Not directly related, but when I was learning programming back in highschool (before the Internet) what made it easy was the built in help in Turbo Pascal. You could press F1 over any function or keyword and you were given a detailed description and example of usage. Learning C later using the K&R book and Google was a huge downgrade. Even today I think that language help built into the IDE should be a basic functionality." - https://news.ycombinator.com/item?id=25150547

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
