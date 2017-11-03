# XOXO

## TODO

- https://github.com/thejameskyle/the-super-tiny-compiler/blob/master/the-super-tiny-compiler.js
- features
    - comments
        - nested comments
    - floats
    - arrays
- compiler stuff
    - transformation
    - js code generation

- Prefixing interfaces with "I", is this common practice or should we disable this in TSLint?

## Syntax

### Variables

```javascript
x = 10
let x = 20 // mutable variable
```

### Data types

```javascript
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

```javascript
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

```javascript
for true {
    // infinite cycle
}

for value, key in x {

}

for i=1; i<length(key); i += 1 {

}
```
