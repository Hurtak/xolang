import * as fs from "fs";
import * as path from "path";

function main(): void {
  const src = fs.readFileSync(
    path.join(__dirname, "../program/main.xo"),
    "utf8"
  );

  const out = tokenize(src);
  console.log(out);
}

const tokenTypes = {
  WHITESPACE: "WHITESPACE",
  NAME: "NAME",
  PARENTHESES: "PARENTHESES",
  BRACES: "BRACES",
  NUMBER: "NUMBER"
};

function charToToken(char: string) {
  switch (char) {
    case "{":
    case "}":
      return tokenTypes.BRACES;
    case "(":
    case ")":
      return tokenTypes.PARENTHESES;
    case " ":
    case "\t":
      return tokenTypes.WHITESPACE;
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      return tokenTypes.NUMBER;
    default:
      return tokenTypes.NAME;
  }
}

function tokenize(source: string) {
  const tokens = [];

  let prevToken = charToToken(source[0]);
  let tokenValue = source[0];
  for (let i = 1; i < source.length; i++) {
    const char = source[i];
    const token = charToToken(char);

    if (
      token !== prevToken ||
      [tokenTypes.BRACES, tokenTypes.PARENTHESES].includes(token)
    ) {
      tokens.push({
        type: prevToken,
        value: tokenValue
      });
      tokenValue = "";
    }
    tokenValue += char;

    prevToken = token;
  }

  return tokens;
}

main();
