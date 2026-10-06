import Token from "./Token";
import TokenType, {tokenTypesList} from "./TokenType";
import ExpressionNode from "./AST/ExpressionNode";
import StatementsNode from "./AST/StatementsNode";
import NumberNode from "./AST/NumberNode";
import VariableNode from "./AST/VariableNode";
import BinOperationNode from "./AST/BinOperationNode";
import UnarOperationNode from "./AST/UnarOperationNode";
import AssignNode from "./AST/AssignNode";
import FunctionNode from "./AST/FunctionNode";
import CallNode from "./AST/CallNode";
import ReturnNode from "./AST/ReturnNode";

class ReturnSignal {
    constructor(public value: any) {}
}

export default class Parser {
    tokens: Token[];
    pos: number = 0;
    scope: any = {};
    functions: { [name: string]: FunctionNode } = {};

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    match(...expected: TokenType[]): Token | null {
        if (this.pos < this.tokens.length) {
            const currentToken = this.tokens[this.pos];
            if (expected.find(type => type.name === currentToken.type.name)) {
                this.pos += 1;
                return currentToken;
            }
        }
        return null;
    }

    require(...expected: TokenType[]): Token {
        const token = this.match(...expected);
        if (!token) {
            throw new Error(`in position ${this.pos} wait ${expected[0].name}`)
        }
        return token;
    }

    parseVariableOrNumber(): ExpressionNode {
        const number = this.match(tokenTypesList.NUMBER);
        if (number != null) return new NumberNode(number);

        const variable = this.match(tokenTypesList.VARIABLE);
        if (variable != null) {
            if (this.match(tokenTypesList.LPAR) != null) {
                return this.parseCallArgs(variable);
            }
            return new VariableNode(variable);
        }
        throw new Error(`wait var or number ${this.pos} position`)
    }

    parseCallArgs(name: Token): ExpressionNode {
        const args: ExpressionNode[] = [];
        if (this.match(tokenTypesList.RPAR) == null) {
            args.push(this.parseFormula());
            while (this.match(tokenTypesList.COMMA) != null) {
                args.push(this.parseFormula());
            }
            this.require(tokenTypesList.RPAR);
        }
        return new CallNode(name, args);
    }

    parsePrint(): ExpressionNode {
        const operatorLog = this.match(tokenTypesList.LOG);
        if (operatorLog != null) {
            return new UnarOperationNode(operatorLog, this.parseFormula())
        }
        throw new Error(`wait unary operator CONSOLE in ${this.pos} position`)
    }

    parseParentheses(): ExpressionNode {
        if (this.match(tokenTypesList.LPAR) != null) {
            const node = this.parseFormula();
            this.require(tokenTypesList.RPAR);
            return node;
        } else {
            return this.parseVariableOrNumber();
        }
    }

    parseFormula(): ExpressionNode {
        let leftNode = this.parseParentheses();
        let operator = this.match(tokenTypesList.MINUS, tokenTypesList.PLUS);
        while (operator != null) {
            const rightNode = this.parseParentheses();
            leftNode = new BinOperationNode(operator, leftNode, rightNode);
            operator = this.match(tokenTypesList.MINUS, tokenTypesList.PLUS);
        }
        return leftNode;
    }

    parseFunction(): ExpressionNode {
        const funcKeyword = this.require(tokenTypesList.FUNC);
        const name = this.require(tokenTypesList.VARIABLE);
        this.require(tokenTypesList.LPAR);
        const params: Token[] = [];
        if (this.match(tokenTypesList.RPAR) == null) {
            params.push(this.require(tokenTypesList.VARIABLE));
            while (this.match(tokenTypesList.COMMA) != null) {
                params.push(this.require(tokenTypesList.VARIABLE));
            }
            this.require(tokenTypesList.RPAR);
        }
        this.require(tokenTypesList.LBRACE);

        const body = new StatementsNode();
        while (this.match(tokenTypesList.RBRACE) == null) {
            body.addNode(this.parseExpression());
            if (!this.tokens[this.pos] ||
                this.tokens[this.pos].type.name !== tokenTypesList.RBRACE.name) {
                this.require(tokenTypesList.SEMICOLON);
            }
        }
        const node = new FunctionNode(name, params, body);
        this.functions[name.text] = node;
        return node;
    }

    parseReturn(): ExpressionNode {
        this.require(tokenTypesList.RETURN);
        if (this.match(tokenTypesList.SEMICOLON) != null) {
            return new ReturnNode(new NumberNode(
                new Token(tokenTypesList.NUMBER, '0', this.pos)
            ));
        }
        return new ReturnNode(this.parseFormula());
    }

    parseExpression(): ExpressionNode {
        if (this.match(tokenTypesList.FUNC) != null) {
            this.pos -= 1;
            return this.parseFunction();
        }
        if (this.match(tokenTypesList.RETURN) != null) {
            this.pos -= 1;
            return this.parseReturn();
        }
        if (this.match(tokenTypesList.CONSOLE) != null) {
            this.pos -= 1;
            return this.parsePrint();
        }
        if (this.match(tokenTypesList.VARIABLE) != null) {
            this.pos -= 1;
            const variableNode = this.parseVariableOrNumber();
            const assignOperator = this.match(tokenTypesList.ASSIGN);
            if (assignOperator != null) {
                const rightFormulaNode = this.parseFormula();
                return new AssignNode(assignOperator, variableNode, rightFormulaNode);
            }
            return variableNode;
        }
        throw new Error(`error in ${this.pos}`);
    }

    parseCode(): ExpressionNode {
        const root = new StatementsNode();
        while (this.pos < this.tokens.length) {
            const codeStringNode = this.parseExpression();
            const isBlock = codeStringNode instanceof FunctionNode;
            if (!isBlock) {
                this.require(tokenTypesList.SEMICOLON);
            }
            root.addNode(codeStringNode);
        }
        return root;
    }

    run(node: ExpressionNode, localScope: any = null): any {
        if (node instanceof NumberNode) {
            return parseInt(node.number.text);
        }
        if (node instanceof ReturnNode) {
            throw new ReturnSignal(this.run(node.expression, localScope));
        }
        if (node instanceof UnarOperationNode) {
            switch (node.operator.type.name) {
                case tokenTypesList.LOG.name:
                    console.log(this.run(node.operand, localScope))
                    return;
            }
        }
        if (node instanceof FunctionNode) {
            return;
        }
        if (node instanceof CallNode) {
            const fn = this.functions[node.name.text];
            if (!fn) throw new Error(`function ${node.name.text} not found`);

            const local: any = {};
            fn.params.forEach((p, i) => {
                local[p.text] = this.run(node.args[i], localScope);
            });

            try {
                this.run(fn.body, local);
            } catch (e) {
                if (e instanceof ReturnSignal) return e.value;
                throw e;
            }
            return 0;
        }
        if (node instanceof BinOperationNode) {
            switch (node.operator.type.name) {
                case tokenTypesList.PLUS.name:
                    return this.run(node.leftNode, localScope) + this.run(node.rightNode, localScope)
                case tokenTypesList.MINUS.name:
                    return this.run(node.leftNode, localScope) - this.run(node.rightNode, localScope)
                case tokenTypesList.ASSIGN.name:
                    const result = this.run(node.rightNode, localScope)
                    const variableNode = <VariableNode>node.leftNode;
                    if (localScope && variableNode.variable.text in localScope) {
                        localScope[variableNode.variable.text] = result;
                    } else if (localScope) {
                        if (variableNode.variable.text in this.scope) {
                            this.scope[variableNode.variable.text] = result;
                        } else {
                            localScope[variableNode.variable.text] = result;
                        }
                    } else {
                        this.scope[variableNode.variable.text] = result;
                    }
                    return result;
            }
        }
        if (node instanceof VariableNode) {
            if (localScope && node.variable.text in localScope) {
                return localScope[node.variable.text];
            }
            if (this.scope[node.variable.text] !== undefined) {
                return this.scope[node.variable.text]
            }
            throw new Error(`var with name ${node.variable.text} not born`)
        }
        if (node instanceof StatementsNode) {
            for (const codeString of node.codeStrings) {
                this.run(codeString, localScope);
            }
            return;
        }
        throw new Error('Error!')
    }
}