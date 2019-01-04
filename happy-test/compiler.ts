import { Builtin } from "./vm";

const NAME_CHARS = /[a-z\-]/i;
const INTEGER_CHARS = /[0-9]/;
const WHITESPACE_CHARS = /\s/;

enum TokenType {
  Name,
  Integer,
  String,
  Semicolon
}

export class Token {
  constructor(public type: TokenType, public value: string) {}
}

export class Tokenizer implements IterableIterator<Token> {
  private current = 0;
  done = false;

  [Symbol.iterator]() {
    return this;
  }

  constructor(private program: string) {}

  next(): IteratorResult<Token> {
    let char = this.program[this.current];

    if (char === undefined) {
      this.done = true;
      return ({ done: true } as any) as IteratorResult<Token>;
    }

    if (NAME_CHARS.test(char)) {
      let value = "";

      do {
        value += char;
        char = this.program[++this.current];
      } while (NAME_CHARS.test(char) && char !== undefined);

      return { done: false, value: new Token(TokenType.Name, value) };
    }

    if (char === ";") {
      this.current++;

      return { done: false, value: new Token(TokenType.Semicolon, char) };
    }

    if (INTEGER_CHARS.test(char)) {
      let value = "";

      do {
        value += char;
        char = this.program[++this.current];
      } while (INTEGER_CHARS.test(char) && char !== undefined);

      return { done: false, value: new Token(TokenType.Integer, value) };
    }

    if (char === '"') {
      let value = "";

      // Skip opening quote
      char = this.program[++this.current];

      do {
        if (char === undefined) throw new Error("Unclosed string");
        value += char;
        char = this.program[++this.current];
      } while (char !== '"');

      // Skip closing quote
      char = this.program[++this.current];

      return { done: false, value: new Token(TokenType.String, value) };
    }

    if (WHITESPACE_CHARS.test(char)) {
      this.current++;
      return this.next();
    }

    throw new Error("BAD: " + char);
  }
}

export interface IDict<T> {
  [key: string]: T;
}

enum SourceASTType {
  Program,
  Word,
  Definition,
  IntegerLiteral,
  StringLiteral
}

enum DestASTType {
  Program,
  Instruction,
  IntegerLiteral,
  StringLiteral
}

enum Keyword {
  StepDef = "stepdef",
  Feature = "feature",
  Background = "background",
  Scenario = "scenario"
}

export class AST {
  constructor(
    public type: SourceASTType | DestASTType,
    public props: IDict<any>
  ) {}
}

function parse(tokens: Token[]): AST {
  let current = 0;

  function walk(): AST {
    let token = tokens[current];

    switch (token.type) {
      case TokenType.Integer:
        current++;
        return new AST(SourceASTType.IntegerLiteral, { value: token.value });

      case TokenType.String:
        current++;
        return new AST(SourceASTType.StringLiteral, { value: token.value });

      case TokenType.Name:
        switch (token.value) {
          case Keyword.StepDef:
            const type = token.value;
            const args = [];

            token = tokens[++current];

            while (token.type !== TokenType.Semicolon) {
              args.push(walk());
              token = tokens[current];
            }

            current++;

            return new AST(SourceASTType.Definition, { type, args });

          default:
            return new AST(SourceASTType.Word, { value: token.value });
        }
    }

    throw new Error("BAD: " + token);
  }

  const ast = new AST(SourceASTType.Program, { body: [] });

  while (current < tokens.length) {
    ast.props.body.push(walk());
  }

  return ast;
}

interface IVisitor {
  [key: string]: {
    enter?(node: AST, parent?: AST): void;
    exit?(node: AST, parent?: AST): void;
  };
}

function traverse(ast: AST, visitor: IVisitor): void {
  function traverseArray(node: AST, parent?: AST) {
    ast.props.body.forEach((node: AST) => {
      traverseNode(node, ast);
    });
  }

  function traverseNode(node: AST, parent?: AST): void {
    const methods = visitor[node.type];

    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    switch (node.type) {
      case SourceASTType.Program:
        traverseArray(node.props.body, node);
        break;

      case SourceASTType.Word:
      case SourceASTType.IntegerLiteral:
      case SourceASTType.StringLiteral:
        break;

      default:
        throw new Error("BAD: " + node.type);
    }

    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  traverseNode(ast);
}

function transform(ast: AST): AST {
  const newAST = new AST(DestASTType.Program, {
    body: []
  });

  traverse(ast, {
    IntegerLiteral: {
      enter(node, parent) {
        newAST.props.body.push(
          new AST(DestASTType.Instruction, {
            value: Builtin.Push
          })
        );
        newAST.props.body.push(
          new AST(DestASTType.IntegerLiteral, {
            value: node.props.value
          })
        );
      }
    },
    StringLiteral: {
      enter(node, parent) {
        newAST.props.body.push(
          new AST(DestASTType.Instruction, {
            value: Builtin.Push
          })
        );
        newAST.props.body.push(
          new AST(DestASTType.StringLiteral, {
            value: node.props.value
          })
        );
      }
    },
    Word: {
      enter(node, parent) {
        newAST.props.body.push(
          new AST(DestASTType.Instruction, {
            value: node.props.value
          })
        );
      }
    }
  });

  newAST.props.body.push(
    new AST(DestASTType.Instruction, {
      value: Builtin.Halt
    })
  );

  return newAST;
}

export function generate(node: AST): string {
  switch (node.type) {
    case DestASTType.Program:
      return `{ "program": [${node.props.body.map(generate).join(", ")}] }`;

    case DestASTType.Instruction:
      return '"' + node.props.value + '"';

    case DestASTType.IntegerLiteral:
      return node.props.value;

    case DestASTType.StringLiteral:
      return '"' + node.props.value + '"';
  }

  throw new Error("BAD: " + node.type);
}

export default function compile(program: string) {
  return generate(transform(parse(...new Tokenizer(program))));
}
