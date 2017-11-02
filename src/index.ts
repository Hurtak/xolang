import * as fs from "fs";
import * as path from "path";
import * as util from "util";

enum TokenType {
  Whitespace = "WHITESPACE",

  Name = "NAME",
  Number = "NUMBER",

  Parentheses = "PARENTHESES",
  Braces = "BRACES",
}

interface IToken {
  type: TokenType;
  value: string;
}

function tokenize(source: string): IToken[] {
  const tokens = [];
  let index = 0;
  let char = source[index];

  function nextChar() {
    index += 1;
    char = source[index];
  }

  while (index < source.length) {
    if (/[{}]/.test(char)) {
      tokens.push({
        type: TokenType.Braces,
        value: char,
      });
      nextChar();

      continue;
    }

    if (/[()]/.test(char)) {
      tokens.push({
        type: TokenType.Parentheses,
        value: char,
      });
      nextChar();

      continue;
    }

    if (/[ \t]/.test(char)) {
      nextChar();

      continue;
    }

    if (/[\n]/.test(char)) {
      nextChar();

      continue;
    }

    const isCharNumberToken = (s: string): boolean => /[0-9]/.test(s);
    if (isCharNumberToken(char)) {
      let value = "";

      while (isCharNumberToken(char)) {
        value += char;
        nextChar();
      }

      tokens.push({
        type: TokenType.Number,
        value: value,
      });

      continue;
    }

    const isCharNameToken = (s: string): boolean => /[a-zA-Z]/.test(s);
    if (isCharNameToken(char)) {
      let value = "";

      while (isCharNameToken(char)) {
        value += char;
        nextChar();
      }

      tokens.push({
        type: TokenType.Name,
        value: value,
      });

      continue;
    }

    throw new Error(`Unknown token "${char}"`);
  }

  return tokens;
}

function main(): void {
  const src = fs.readFileSync(
    path.join(__dirname, "../program/main.xo"),
    "utf8",
  );

  const tokens = tokenize(src);

  process.stdout.write(
    util.inspect(tokens, {
      showHidden: false,
      depth: null, // default 2, null to unlimited
      colors: true,
      maxArrayLength: 100, // default: 100, null to unlimited
      breakLength: 60, // default: 60, Infinity to unlimited
    }),
  );
}

main();
