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
  if (/[{}]/.test(char)) {
    return TokenType.Braces;
  } else if (/[()]/.test(char)) {
    return TokenType.Parentheses;
  } else if (/[ \t]/.test(char)) {
    return TokenType.Whitespace;
  } else if (/[\n]/.test(char)) {
    return TokenType.Newline;
  } else if (/[0-9]/.test(char)) {
    return TokenType.Number;
  } else if (/[a-zA-Z]/.test(char)) {
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
