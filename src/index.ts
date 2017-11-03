import * as fs from "fs";
import * as path from "path";
import * as util from "util";

enum TokenType {
  Whitespace = "WHITESPACE",

  Name = "NAME",

  Number = "NUMBER",
  String = "STRING",

  Comma = "COMMA",
  Parentheses = "PARENTHESES",
  Braces = "BRACES",
}

enum ASTType {
  NumberLiteral = "NumberLiteral",
  StringLiteral = "StringLiteral",
  CallExpression = "CallExpression",
  FunctionDeclaration = "FunctionDeclaration",
  Program = "Program",
  Nothing = "Nothing",
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

interface INode {
  type: ASTType;
  name?: IToken["value"];
  value?: IToken["value"];
  params?: INode[];
  body?: INode[];
}

function testChar(input: string, ...testers: Array<RegExp | string>): boolean {
  return testers.some(tester => {
    if (typeof tester === "string") {
      return input === tester;
    }
    return tester.test(input);
  });
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
    if (testChar(char, "{", "}")) {
      tokens.push({
        type: TokenType.Braces,
        value: char,
      });
      nextChar();

      continue;
    }

    if (testChar(char, "(", ")")) {
      tokens.push({
        type: TokenType.Parentheses,
        value: char,
      });
      nextChar();

      continue;
    }

    if (testChar(char, ",")) {
      tokens.push({
        type: TokenType.Comma,
        value: char,
      });
      nextChar();

      continue;
    }

    if (testChar(char, " ", "\t")) {
      nextChar();

      continue;
    }

    if (testChar(char, "\n")) {
      nextChar();

      continue;
    }

    const isStringToken = (s: string): boolean => testChar(s, '"');
    if (isStringToken(char)) {
      let value = "";

      nextChar(); // Skip opening `"` char.

      while (!isStringToken(char)) {
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

    const isCharNumberToken = (s: string): boolean => testChar(s, /[0-9]/);
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

    const isCharNameToken = (s: string): boolean => testChar(s, /[a-zA-Z]/);
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

function parser(tokens: IToken[]): INode {
  function getToken(offset = 0) {
    return tokens[index + offset];
  }

  let index = 0;
  let token = getToken();

  function walk(): INode | null {
    function walkToken() {
      index += 1;
      return getToken();
    }

    if (token.type === TokenType.Whitespace) {
      while (token.type === TokenType.Whitespace) {
        token = walkToken();
      }
      return null;
    }

    if (token.type === TokenType.Comma) {
      token = walkToken();
      return null;
    }

    if (token.type === TokenType.Number) {
      const value = token.value;
      token = walkToken();

      return {
        type: ASTType.NumberLiteral,
        value: value,
      };
    }

    if (token.type === TokenType.String) {
      const value = token.value;
      token = walkToken();

      return {
        type: ASTType.StringLiteral,
        value: value,
      };
    }

    if (token.type === TokenType.Name) {
      const value = token.value;
      const params = [];

      token = walkToken();
      if (token.type === TokenType.Parentheses && token.value === "(") {
        token = walkToken(); // Skip `(` after function name

        while (
          token.type !== TokenType.Parentheses ||
          (token.type === TokenType.Parentheses && token.value !== ")")
        ) {
          const param = walk();
          if (param) {
            params.push(param);
          }
        }

        token = walkToken(); // Skip `)`

        return {
          type: ASTType.CallExpression,
          name: value,
          params: params,
        };
      }
    }

    throw new Error(`Parser did not reckognize tocken type "${token.type}"`);
  }

  const ast = {
    type: ASTType.Program,
    body: [],
  };

  while (index < tokens.length) {
    const node = walk();
    if (node) {
      ast.body.push();
    }
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
