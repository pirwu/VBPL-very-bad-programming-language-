export default class TokenType {
    name: string;
    regex: string;

    constructor(name: string, regex: string) {
        this.name = name;
        this.regex = regex;
    }
}

export const tokenTypesList = {
    'NUMBER': new TokenType('NUMBER', '[0-9]+'),
    'VARIABLE': new TokenType('VARIABLE', '[a-z]+'),
    'SEMICOLON': new TokenType('SEMICOLON', ';'),
    'SPACE': new TokenType('SPACE', '[ \\n\\t\\r]'),
    'ASSIGN': new TokenType('ASSIGN', '='),
    'CONSOLE': new TokenType('CONSOLE', 'console'),
    'PLUS': new TokenType('PLUS', '\\+'),
    'MINUS': new TokenType('MINUS', '-'),
    'LPAR': new TokenType('LPAR', '\\('),
    'RPAR': new TokenType('RPAR', '\\)'),
    'LBRACE': new TokenType('LBRACE', '\\{'),
    'RBRACE': new TokenType('RBRACE', '\\}'),
    'COMMA': new TokenType('COMMA', ','),
    'FUNC': new TokenType('FUNC', 'func'),
    'RETURN': new TokenType('RETURN', 'return'),
}