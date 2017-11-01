import * as fs from "fs";
import * as path from "path";

enum TokenType {
  Whitespace = "WHITESPACE",
  Newline = "NEWLINE",

  Name = "NAME",
  Number = "NUMBER",

  Parentheses = "PARENTHESES",
  Braces = "BRACES",
}

const TokenTypesGreedy = [
  TokenType.Whitespace,
  TokenType.Name,
  TokenType.Newline,
  TokenType.Number,
];

interface IToken {
  type: TokenType;
  value: string;
}

function charToToken(char: string): TokenType {
  const charCode = char.codePointAt(0);
  if (charCode === undefined) {
    throw new Error(`charCode is undefined for char "${char}"`);
  }

  if (char === "{" || char === "}") {
    return TokenType.Braces;
  } else if (char === "(" || char === ")") {
    return TokenType.Parentheses;
  } else if (char === " " || char === "\t") {
    return TokenType.Whitespace;
  } else if (char === "\n") {
    return TokenType.Newline;
  }

  if (
    charCode >= ("0".codePointAt(0) as number) &&
    charCode <= ("9".codePointAt(0) as number)
  ) {
    return TokenType.Number;
  } else if (
    (charCode >= ("a".codePointAt(0) as number) &&
      charCode <= ("z".codePointAt(0) as number)) ||
    (charCode >= ("A".codePointAt(0) as number) &&
      charCode <= ("Z".codePointAt(0) as number))
  ) {
    return TokenType.Name;
  } else {
    throw new Error(`Unknown token "${char}"`);
  }
}

function tokenize(source: string): IToken[] {
  const tokens = [];

  let prevToken = charToToken(source[0]);
  let tokenValue = source[0];

  for (let i = 1; i < source.length; i++) {
    const char = source[i];
    const token = charToToken(char);

    if (token === prevToken && TokenTypesGreedy.includes(token)) {
      // pass
    } else {
      tokens.push({
        type: prevToken,
        value: tokenValue,
      });
      tokenValue = "";
    }
    tokenValue += char;

    prevToken = token;
  }

  return tokens;
}

function main(): void {
  const src = fs.readFileSync(
    path.join(__dirname, "../program/main.xo"),
    "utf8",
  );

  const out = tokenize(src);
  console.log(out);
}

main();
