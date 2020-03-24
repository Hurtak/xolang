import * as fs from "fs-extra";
import * as path from "path";
import * as util from "util";
import * as meow from "meow";
import * as prettier from "prettier";

enum TokenType {
  Name = "Name",
  Whitespace = "Whitespace",
  NewLine = "NewLine",

  Number = "Number",
  String = "String",

  Comment = "Comment",
  CommentMultiline = "CommentMultiline",

  Equals = "Equals",
  Comma = "Comma",
  Parentheses = "Parentheses",
  Braces = "Braces",
}

const reservedNames = {
  let: "let",
  true: "true",
  false: "false",
};

const character = {
  whitespace: " ",
  tab: "\t",
  newLine: "\n",
  quote: `'`,
  equals: "=",
  asterisk: "*",
  comma: ",",
  slashForward: "/",
  underline: "_",
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
  CommentMultiline = "CommentMultiline",
  NewLine = "NewLine",

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

function sourceToTokens(source: string): IToken[] {
  const tokens = [];
  let lineNumber = 1;
  let rowNumber = 1;

  let index = 0;
  let char = getChar();
  function nextChar() {
    index += 1;
    char = getChar();

    rowNumber += 1;
    if (char === character.newLine) {
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
        while (char !== character.newLine) {
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
          type: TokenType.CommentMultiline,
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

    if (testChar(char, character.newLine)) {
      tokens.push({
        type: TokenType.NewLine,
        value: char,
        filePosition: filePosition,
      });
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

      while (true) {
        if (isCharNumberToken(char)) {
          value += char;
          nextChar();
        } else if (char === character.underline) {
          nextChar();
        } else {
          break;
        }
      }

      tokens.push({
        type: TokenType.Number,
        value: value,
        filePosition: filePosition,
      });

      continue;
    }

    const isCharNameToken = (s: string): boolean => testChar(s, /[a-zA-Z0-9_]/);
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

function tokensToAst(tokens: IToken[]): INode[] {
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

    if (token.type === TokenType.NewLine) {
      const value = token.value;
      token = walkToken();
      return {
        type: ASTType.NewLine,
        value: value,
      };
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

    if (token.type === TokenType.CommentMultiline) {
      const value = token.value;
      token = walkToken();

      return {
        type: ASTType.CommentMultiline,
        value: value,
      };
    }

    if (
      token.value === reservedNames.true ||
      token.value === reservedNames.false
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
      if (token.value === reservedNames.let) {
        token = walkToken(); // advance from let

        const variableName = token.value;
        if (token.type !== TokenType.Name) {
          throw error(
            `Variable name expected after let definition. eg "let variable_name = 0;"`,
            token.filePosition,
          );
        }

        token = walkToken(); // advance from variable name
        if (token.value !== character.equals) {
          throw error(
            `Equals is expected after variable name. eg "let variable_name = 0;"`,
            token.filePosition,
          );
        }

        token = walkToken(); // advance from "="

        const body = [];
        while (token.type !== TokenType.NewLine) {
          body.push(token);
          token = walkToken();
        }

        return {
          type: ASTType.VariableAssignment,
          name: variableName,
          body: tokensToAst(body),
        };
      }

      // const name = token.value;
      // token = walkToken();
      //
      // if (
      //   token.type === TokenType.Parentheses &&
      //   token.value === character.parenthesesOpen
      // ) {
      //   const params = [];
      //   token = walkToken(); // Skip `(` after function name

      //   while (
      //     token.type !== TokenType.Parentheses ||
      //     (token.type === TokenType.Parentheses &&
      //       token.value !== character.parenthesesClose)
      //   ) {
      //     const param = walk();
      //     if (param) {
      //       params.push(param);
      //     }
      //   }

      //   token = walkToken(); // Skip `)`

      //   return {
      //     type: ASTType.FunctionCall,
      //     name: name,
      //     params: params,
      //   };
      // }
    }

    throw error(
      `Parser did not reckognize token ${JSON.stringify(token)}`,
      token.filePosition,
    );
  }

  const res = [];
  while (index < tokens.length) {
    const node = walk();
    if (node) {
      res.push(node);
    }
  }

  return res;
}

function tokensToAstProgram(tokens: IToken[]): INode {
  return {
    type: ASTType.Program,
    body: tokensToAst(tokens),
  };
}

function astToJavaScriptSource(ast: INode[] = [], out = ""): string {
  for (const node of ast) {
    switch (node.type) {
      case ASTType.Program: {
        out += astToJavaScriptSource(node.body);
        break;
      }

      case ASTType.VariableAssignment: {
        out += "let " + node.name + " = ";
        out += astToJavaScriptSource(node.body);
        break;
      }

      case ASTType.NewLine: {
        out += "\n";
        break;
      }

      case ASTType.Comment: {
        out += "//";
        out += node.value;
        break;
      }

      case ASTType.CommentMultiline: {
        const lines = (node.value || "").split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          out += "//";
          out += line;

          const lastItem = lines.length - 1 === i;
          if (!lastItem) {
            out += "\n";
          }
        }

        break;
      }

      case ASTType.LiteralBoolean: {
        switch (node.value) {
          case reservedNames.true:
            out += "false";
            break;

          case reservedNames.false:
            out += "true";
            break;

          default:
            throw new Error(
              `JS source emitter did not implement node type "${node.type}"`,
            );
        }

        break;
      }

      case ASTType.LiteralNumber: {
        out += node.value;
        break;
      }

      default: {
        throw new Error(
          `JS source emitter did not implement node type "${node.type}"`,
        );
      }
    }
  }

  return out;
}

function formatToLogOutput(stuff: object): string {
  return util.inspect(stuff, {
    showHidden: false,
    depth: null, // default 2, null to unlimited
    colors: true,
    maxArrayLength: 100, // default: 100, null to unlimited
    breakLength: 80, // default: 60, Infinity to unlimited
  });
}

function error(message: string, errorPosition: ICharacterFilePosition): Error {
  return new Error(`
    Hey man...
      ${message}
    at ${errorPosition.lineNumber}:${errorPosition.rowNumber}
  `);
}

async function main(): Promise<void> {
  const cli = meow(`
    Hello there!

    Usage
      $ xo <filename>

    Options
      none so far
  `);

  const sourceFilePath = cli.input[0];
  if (!sourceFilePath) {
    throw new Error("Missing file path as first command line argument");
  }

  console.log("Using file: " + sourceFilePath);
  console.log("");

  const cwd = process.cwd();
  const filePath = path.join(cwd, sourceFilePath);

  const src = await fs.readFile(filePath, "utf8");

  console.log("Tokens:");
  const tokens = sourceToTokens(src);
  console.log(formatToLogOutput(tokens));
  console.log("");

  console.log("AST:");
  const ast = tokensToAstProgram(tokens);
  console.log(formatToLogOutput(ast));
  console.log("");

  console.log("Generated JS:");
  let javaScriptOutput = astToJavaScriptSource([ast]);
  javaScriptOutput = prettier.format(javaScriptOutput, { parser: "babylon" });
  console.log(javaScriptOutput);
  console.log("");

  const dirBuild = path.join(cwd, ".build");
  const outFilePath = path.join(dirBuild, sourceFilePath.replace(".xo", ".js"));
  console.log("Outputting JS file: ", outFilePath);
  await fs.remove(dirBuild);
  await fs.outputFile(outFilePath, javaScriptOutput);
}

main();
