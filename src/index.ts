import * as fs from "fs";
import * as path from "path";
import * as util from "util";

enum TokenType {
  Whitespace = "WHITESPACE",

  Name = "NAME",

  Number = "NUMBER",
  String = "STRING",

  Parentheses = "PARENTHESES",
  Braces = "BRACES",
}

enum ASTType {
  NumberLiteral = "NumberLiteral",
  StringLiteral = "StringLiteral",
  CallExpression = "CallExpression",
  FunctionDeclaration = "FunctionDeclaration",
  Program = "Program",
}

// type TokenTypeWhitespace = " " | "\t";
// type TokenTypeName = string;
// type TokenTypeNumber = number;
// type TokenTypeString = string;
// type TokenTypeStringIndicator = '"';
// type TokenTypeParentheses = "(" | ")";
// type TokenTypeBraces = "{" | "}";

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

    const isCharStringToken = (s: string): boolean => /["]/.test(s);
    if (isCharStringToken(char)) {
      let value = "";

      nextChar(); // Skip opening `"` char.

      while (!isCharStringToken(char)) {
        value += char;
        nextChar();
      }

      nextChar(); // Skip closing `"` char.

      tokens.push({
        type: TokenType.String,
        value: value,
      });

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

function parser(tokens: IToken[]) {
  function getToken(offset = 0) {
    return tokens[index + offset];
  }

  let index = 0;
  let token = getToken();

  function walk() {
    function walkToken() {
      index += 1;
      token = getToken();
    }

    if (token.type === TokenType.Number) {
      const data = {
        type: ASTType.NumberLiteral,
        value: token.value,
      };
      walkToken();

      return data;
    }

    if (token.type === TokenType.String) {
      const data = {
        type: ASTType.StringLiteral,
        value: token.value,
      };
      walkToken();

      return data;
    }

    if (token.type === TokenType.Name) {
      const node = {
        type: ASTType.CallExpression,
        name: token.value,
        params: [],
      };

      walkToken();

      if (token.type === TokenType.Parentheses && token.value === "(") {
        walkToken(); // Skip `(` after function name

        while (
          token.type !== TokenType.Parentheses ||
          (token.type === TokenType.Parentheses && token.value !== ")")
        ) {
          node.params.push(walk());
        }

        walkToken(); // Skip `)`

        return node;
      }
    }

    throw new Error(`Parser did not reckognize tocken type "${token.type}"`);
  }

  const ast = {
    type: ASTType.Program,
    body: [],
  };

  while (index < tokens.length) {
    ast.body.push(walk());
  }

  return ast;
}

function main(): void {
  const src = fs.readFileSync(
    path.join(__dirname, "../program/main.xo"),
    "utf8",
  );

  const tokens = tokenize(src);
  const ast = parser(tokens);

  process.stdout.write(
    util.inspect(ast, {
      showHidden: false,
      depth: null, // default 2, null to unlimited
      colors: true,
      maxArrayLength: 100, // default: 100, null to unlimited
      breakLength: 60, // default: 60, Infinity to unlimited
    }),
  );
}

main();
