import * as fs from "fs";
import * as path from "path";
import * as util from "util";

enum TokenType {
  Name = "Name",
  Whitespace = "Whitespace",

  Number = "Number",
  String = "String",

  Comment = "Comment",
  CommentMultiline = "CommentMultiline",

  Equals = "Equals",
  Comma = "Comma",
  Parentheses = "Parentheses",
  Braces = "Braces",
}

const reserverNames = {
  true: "true",
  false: "false",
};

const character = {
  whitespace: " ",
  tab: "\t",
  newline: "\n",
  quote: `'`,
  equals: "=",
  asterisk: "*",
  comma: ",",
  slashForward: "/",
  parenthesesOpen: "(",
  parenthesesClose: ")",
  bracesOpen: "{",
  bracesClose: "}",
};

enum ASTType {
  LiteralBoolean = "LiteralBoolean",
  LiteralNumber = "LiteralNumber",
  LiteralString = "LiteralString",

  VariableAssignment = "VariableAssignment",

  FunctionCall = "FunctionCall",
  // FunctionDeclaration = "FunctionDeclaration",

  Comment = "Comment",

  Program = "Program",
}

// type TokenTypeWhitespace = " " | "\t";
// type TokenTypeName = string;
// type TokenTypeNumber = number;
// type TokenTypeString = string;
// type TokenTypeStringIndicator = '"';
// type TokenTypeParentheses = "(" | ")";
// type TokenTypeBraces = "{" | "}";

interface ICharacterFilePosition {
  lineNumber: number;
  rowNumber: number;
}

interface IToken {
  type: TokenType;
  value: string;
  filePosition: ICharacterFilePosition;
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
  let lineNumber = 1;
  let rowNumber = 1;

  let index = 0;
  let char = getChar();
  function nextChar() {
    index += 1;
    char = getChar();

    rowNumber += 1;
    if (char === character.newline) {
      rowNumber = 1;
      lineNumber += 1;
    }
  }

  function getChar(offset = 0) {
    return source[index + offset];
  }

  while (index < source.length) {
    const filePosition = {
      lineNumber: lineNumber,
      rowNumber: rowNumber,
    };

    if (testChar(char, character.bracesOpen, character.bracesClose)) {
      tokens.push({
        type: TokenType.Braces,
        value: char,
        filePosition: filePosition,
      });
      nextChar();

      continue;
    }

    if (testChar(char, character.parenthesesOpen, character.parenthesesClose)) {
      tokens.push({
        type: TokenType.Parentheses,
        value: char,
        filePosition: filePosition,
      });
      nextChar();

      continue;
    }

    if (testChar(char, character.comma)) {
      tokens.push({
        type: TokenType.Comma,
        value: char,
        filePosition: filePosition,
      });
      nextChar();

      continue;
    }

    if (testChar(char, character.slashForward)) {
      nextChar(); // Skip `/`.

      if (char === character.slashForward) {
        nextChar(); // Skip second `/`.

        let value = "";
        while (char !== character.newline) {
          value += char;
          nextChar();
        }

        tokens.push({
          type: TokenType.Comment,
          value: value,
          filePosition: filePosition,
        });

        continue;
      }

      if (char === character.asterisk) {
        nextChar(); // Skip `*`.

        let commentNestingLevel = 1;
        let value = "";
        while (true) {
          if (
            getChar() === character.slashForward &&
            getChar(1) === character.asterisk
          ) {
            commentNestingLevel += 1;
          } else if (
            getChar() === character.asterisk &&
            getChar(1) === character.slashForward
          ) {
            commentNestingLevel -= 1;
            if (commentNestingLevel === 0) {
              // Skip closing `*/`
              nextChar();
              nextChar();
              break;
            }
          }

          value += char;
          nextChar();
        }

        tokens.push({
          type: TokenType.Comment,
          value: value,
          filePosition: filePosition,
        });

        continue;
      }
    }

    if (testChar(char, character.equals)) {
      tokens.push({
        type: TokenType.Equals,
        value: char,
        filePosition: filePosition,
      });
      nextChar();

      continue;
    }

    if (testChar(char, character.whitespace, character.tab)) {
      nextChar();

      continue;
    }

    if (testChar(char, character.newline)) {
      nextChar();

      continue;
    }

    const isStringToken = (s: string): boolean => testChar(s, character.quote);
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
        filePosition: filePosition,
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
        filePosition: filePosition,
      });

      continue;
    }

    const isCharNameToken = (s: string): boolean => testChar(s, /[a-zA-Z_]/);
    if (isCharNameToken(char)) {
      let value = "";

      while (isCharNameToken(char)) {
        value += char;
        nextChar();
      }

      tokens.push({
        type: TokenType.Name,
        value: value,
        filePosition: filePosition,
      });

      continue;
    }

    throw error(`Unknown token "${char}"`, filePosition);
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

    if (token.type === TokenType.Comment) {
      const value = token.value;
      token = walkToken();

      return {
        type: ASTType.Comment,
        value: value,
      };
    }

    if (
      token.value === reserverNames.true ||
      token.value === reserverNames.false
    ) {
      const value = token.value;
      token = walkToken();

      return {
        type: ASTType.LiteralBoolean,
        value: value,
      };
    }

    if (token.type === TokenType.Number) {
      const value = token.value;
      token = walkToken();

      return {
        type: ASTType.LiteralNumber,
        value: value,
      };
    }

    if (token.type === TokenType.String) {
      const value = token.value;
      token = walkToken();

      return {
        type: ASTType.LiteralString,
        value: value,
      };
    }

    if (token.type === TokenType.Name) {
      const name = token.value;
      token = walkToken();

      if (
        token.type === TokenType.Parentheses &&
        token.value === character.parenthesesOpen
      ) {
        const params = [];
        token = walkToken(); // Skip `(` after function name

        while (
          token.type !== TokenType.Parentheses ||
          (token.type === TokenType.Parentheses &&
            token.value !== character.parenthesesClose)
        ) {
          const param = walk();
          if (param) {
            params.push(param);
          }
        }

        token = walkToken(); // Skip `)`

        return {
          type: ASTType.FunctionCall,
          name: name,
          params: params,
        };
      }

      if (token.type === TokenType.Equals) {
        token = walkToken(); // Skip `"`
        const body = walk();

        return {
          type: ASTType.VariableAssignment,
          name: name,
          body: body ? [body] : undefined,
        };
      }
    }

    throw error(
      `Parser did not reckognize token ${JSON.stringify(token)}`,
      token.filePosition,
    );
  }

  const program = [];
  while (index < tokens.length) {
    const node = walk();
    if (node) {
      program.push(node);
    }
  }

  return {
    type: ASTType.Program,
    body: program,
  };
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
      breakLength: 80, // default: 60, Infinity to unlimited
    }),
  );
}

function error(message: string, errorPosition: ICharacterFilePosition): Error {
  return new Error(`
    Hey man...
      ${message}
    at ${errorPosition.lineNumber}:${errorPosition.rowNumber}
  `);
}

main();
